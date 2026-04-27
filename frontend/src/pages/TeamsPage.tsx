import { useEffect, useMemo, useRef, useState } from 'react';
import { MainLayout } from '@/components/layout';
import { teamsApi, usersApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Loader2, Plus, Users, UserPlus, Trash2, Send, MessageCircle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Team {
  id: string;
  name: string;
  description?: string;
  my_role?: string;
  member_count?: number;
  created_at: string;
}

interface TeamMember {
  id?: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface TeamDetail extends Team {
  members: TeamMember[];
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface TeamMessage {
  id: string;
  team_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar_url?: string | null;
  message: string;
  created_at: string;
}

const toAbsoluteAssetUrl = (assetPath?: string | null) => {
  if (!assetPath) return '';
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }
  return assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
};

const formatChatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export default function TeamsPage() {
  const { user, token } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedTeamDetail, setSelectedTeamDetail] = useState<TeamDetail | null>(null);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isLoadingTeamDetail, setIsLoadingTeamDetail] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<TeamMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSocketReady, setIsSocketReady] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
  });

  const [memberSearch, setMemberSearch] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) || null,
    [teams, selectedTeamId]
  );

  useEffect(() => {
    void loadTeams();
  }, []);

  useEffect(() => {
    if (!token) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:3001`;
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsSocketReady(true);
    });

    socket.on('disconnect', () => {
      setIsSocketReady(false);
    });

    socket.on('team:message', (incomingMessage: TeamMessage) => {
      if (incomingMessage.team_id !== selectedTeamId) return;
      setChatMessages((prev) => [...prev, incomingMessage]);
    });

    socket.on('team:error', (message: string) => {
      toast.error(message || 'Chat error');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsSocketReady(false);
    };
  }, [token, selectedTeamId]);

  useEffect(() => {
    if (!selectedTeamId) {
      setSelectedTeamDetail(null);
      setChatMessages([]);
      return;
    }
    void loadTeamDetail(selectedTeamId);
    void loadTeamMessages(selectedTeamId);
  }, [selectedTeamId]);

  useEffect(() => {
    if (!selectedTeamId || !socketRef.current || !isSocketReady) return;

    socketRef.current.emit('team:join', selectedTeamId);

    return () => {
      socketRef.current?.emit('team:leave', selectedTeamId);
    };
  }, [selectedTeamId, isSocketReady]);

  useEffect(() => {
    if (!memberSearch.trim() || !selectedTeamDetail) {
      setUserOptions([]);
      return;
    }

    const timer = window.setTimeout(() => {
      void searchUsers(memberSearch.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [memberSearch, selectedTeamDetail]);

  useEffect(() => {
    if (!chatContainerRef.current) return;
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [chatMessages]);

  const loadTeams = async () => {
    try {
      setIsLoadingTeams(true);
      const response = await teamsApi.getAll();
      const loadedTeams: Team[] = Array.isArray(response.data) ? response.data : [];
      setTeams(loadedTeams);
      if (loadedTeams.length > 0) {
        setSelectedTeamId((prev) => prev || loadedTeams[0].id);
      } else {
        setSelectedTeamId(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load teams');
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const loadTeamDetail = async (teamId: string) => {
    try {
      setIsLoadingTeamDetail(true);
      const response = await teamsApi.getById(teamId);
      setSelectedTeamDetail(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load team details');
    } finally {
      setIsLoadingTeamDetail(false);
    }
  };

  const loadTeamMessages = async (teamId: string) => {
    try {
      setIsLoadingMessages(true);
      const response = await teamsApi.getMessages(teamId);
      setChatMessages(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load chat messages');
      setChatMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const searchUsers = async (search: string) => {
    try {
      setIsSearchingUsers(true);
      const response = await usersApi.getAll({ search });
      const data = response.data;
      const currentMemberIds = new Set(selectedTeamDetail?.members.map((member) => member.user_id) || []);
      const filteredUsers = (Array.isArray(data) ? data : []).filter(
        (foundUser: UserOption) => !currentMemberIds.has(foundUser.id)
      );
      setUserOptions(filteredUsers);
    } catch {
      setUserOptions([]);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = createForm.name.trim();
    if (!name) {
      toast.error('Team name is required');
      return;
    }

    try {
      setIsCreatingTeam(true);
      await teamsApi.create({
        name,
        description: createForm.description.trim() || undefined,
      });
      toast.success('Team created');
      setCreateForm({ name: '', description: '' });
      await loadTeams();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create team');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeamDetail?.id || !selectedUserId) {
      toast.error('Select a user to add');
      return;
    }

    try {
      setIsAddingMember(true);
      await teamsApi.addMember(selectedTeamDetail.id, {
        user_id: selectedUserId,
        role: memberRole,
      });
      toast.success('Member added');
      setSelectedUserId('');
      setMemberSearch('');
      setUserOptions([]);
      await loadTeamDetail(selectedTeamDetail.id);
      await loadTeams();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeamDetail?.id) return;

    try {
      setRemovingMemberId(userId);
      await teamsApi.removeMember(selectedTeamDetail.id, userId);
      toast.success('Member removed');
      await loadTeamDetail(selectedTeamDetail.id);
      await loadTeams();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const sendMessage = () => {
    const message = chatMessage.trim();
    if (!message || !selectedTeamId || !socketRef.current) return;

    socketRef.current.emit('team:message', {
      teamId: selectedTeamId,
      message,
    });
    setChatMessage('');
  };

  return (
    <MainLayout title="Teams" subtitle="Create teams, manage members, and chat in real time">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="text-lg font-display font-bold text-slate-900 mb-4">Create Team</h2>
              <form onSubmit={handleCreateTeam} className="space-y-3">
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Team name"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#42A090] focus:border-transparent"
                />
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Description (optional)"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#42A090] focus:border-transparent resize-none"
                />
                <button
                  type="submit"
                  disabled={isCreatingTeam}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#42A090] hover:bg-[#358070] text-white font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
                >
                  {isCreatingTeam ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isCreatingTeam ? 'Creating...' : 'Create Team'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h2 className="text-lg font-display font-bold text-slate-900">Your Teams</h2>
              </div>
              {isLoadingTeams ? (
                <div className="p-6 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-[#42A090]" />
                </div>
              ) : teams.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  No teams yet
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`w-full text-left p-4 transition-colors ${
                        selectedTeamId === team.id ? 'bg-teal-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-semibold text-slate-900">{team.name}</p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {team.member_count || 0} members • Role: {team.my_role || 'member'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedTeamDetail && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="text-lg font-display font-bold text-slate-900">Members</h3>
                </div>
                {selectedTeamDetail.members.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">No members in this team</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {selectedTeamDetail.members.map((member) => (
                      <div key={member.user_id} className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {member.avatar_url ? (
                            <img
                              src={toAbsoluteAssetUrl(member.avatar_url)}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#42A090]/10 text-[#42A090] flex items-center justify-center font-semibold">
                              {member.name
                                .split(' ')
                                .map((namePart) => namePart[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{member.name}</p>
                            <p className="text-sm text-slate-500 truncate">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-700 capitalize">
                            {member.role}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleRemoveMember(member.user_id)}
                            disabled={removingMemberId === member.user_id}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-60"
                            title="Remove member"
                          >
                            {removingMemberId === member.user_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {!selectedTeam ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center text-slate-500">
                Select a team to manage members and chat
              </div>
            ) : isLoadingTeamDetail || !selectedTeamDetail ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#42A090]" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h2 className="text-2xl font-display font-bold text-slate-900">{selectedTeamDetail.name}</h2>
                  <p className="text-slate-600 mt-1">
                    {selectedTeamDetail.description || 'No description added'}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    {selectedTeamDetail.members.length} members in this group
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-lg font-display font-bold text-slate-900 mb-4">Add Member</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={(e) => {
                          setMemberSearch(e.target.value);
                          setSelectedUserId('');
                        }}
                        placeholder="Search by name or email"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#42A090] focus:border-transparent"
                      />
                      {memberSearch && (
                        <div className="mt-2 border border-slate-200 rounded-xl max-h-44 overflow-y-auto bg-white">
                          {isSearchingUsers ? (
                            <div className="p-3 text-sm text-slate-500">Searching...</div>
                          ) : userOptions.length === 0 ? (
                            <div className="p-3 text-sm text-slate-500">No users found</div>
                          ) : (
                            userOptions.map((userOption) => (
                              <button
                                key={userOption.id}
                                type="button"
                                onClick={() => {
                                  setSelectedUserId(userOption.id);
                                  setMemberSearch(`${userOption.name} (${userOption.email})`);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                              >
                                <p className="text-sm font-medium text-slate-900">{userOption.name}</p>
                                <p className="text-xs text-slate-500">{userOption.email}</p>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <select
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#42A090] focus:border-transparent"
                      >
                        <option value="member">Member</option>
                        <option value="lead">Lead</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleAddMember()}
                    disabled={!selectedUserId || isAddingMember}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 bg-[#42A090] hover:bg-[#358070] text-white font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isAddingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    {isAddingMember ? 'Adding...' : 'Add Member'}
                  </button>
                </div>

                <div className="bg-gradient-to-br from-[#42A090] to-[#2f7f71] rounded-2xl border border-teal-300/40 shadow-lg shadow-[#42A090]/25 p-6">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-white" />
                      <h3 className="text-lg font-display font-bold text-white">Team Chat</h3>
                    </div>
                    <span className="text-xs text-teal-100">
                      {isSocketReady ? 'Live' : 'Connecting...'}
                    </span>
                  </div>

                  <div
                    ref={chatContainerRef}
                    className="h-64 overflow-y-auto rounded-xl bg-white/95 border border-white/70 p-3 space-y-2"
                  >
                    {isLoadingMessages ? (
                      <div className="h-full flex items-center justify-center text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center mt-20">No messages yet. Start the conversation.</p>
                    ) : (
                      chatMessages.map((message) => {
                        const isMine = message.sender_id === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-xl px-3 py-2 ${
                                isMine ? 'bg-[#42A090] text-white' : 'bg-slate-100 text-slate-900'
                              }`}
                            >
                              <p className={`text-xs mb-1 ${isMine ? 'text-teal-100' : 'text-slate-500'}`}>
                                {message.sender_name} • {formatChatTime(message.created_at)}
                              </p>
                              <p className="text-sm break-words">{message.message}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-white/70 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-white/70"
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={!chatMessage.trim() || !isSocketReady}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors disabled:opacity-60"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
