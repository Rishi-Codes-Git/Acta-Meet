import { useEffect, useState } from 'react';
import {
  CheckSquare,
  AlertCircle,
  Loader2,
  Plus,
  Calendar,
  User,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { actionItemsApi } from '@/services/api';
import toast from 'react-hot-toast';

// Priority Badge Component
function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    blocked: 'bg-orange-100 text-orange-700',
  };

  const labels: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    blocked: 'Blocked',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}

// Action Item Card Component
interface ActionItemCardProps {
  item: ActionItem;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: ActionItem) => void;
}

function ActionItemCard({ item, onStatusChange, onDelete, onEdit }: ActionItemCardProps) {
  const isOverdue = item.deadline && new Date(item.deadline) < new Date() && item.status !== 'completed';
  const daysUntilDue = item.deadline 
    ? Math.ceil((new Date(item.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
          {item.description && (
            <p className="text-sm text-slate-500 line-clamp-2">{item.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-slate-400 hover:text-[#42A090] hover:bg-teal-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <PriorityBadge priority={item.priority} />
        <StatusBadge status={item.status} />
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
        {item.assignee_name && (
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {item.assignee_name}
          </span>
        )}
        {item.deadline && (
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
            <Calendar className="w-4 h-4" />
            {formatDate(item.deadline)}
            {daysUntilDue !== null && (
              <span className="ml-1">
                {isOverdue ? `(${Math.abs(daysUntilDue)} days overdue)` : `(${daysUntilDue} days)`}
              </span>
            )}
          </span>
        )}
      </div>

      {item.meeting_title && (
        <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">
          From: {item.meeting_title}
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
        <select
          value={item.status}
          onChange={(e) => onStatusChange(item.id, e.target.value)}
          className="text-xs px-2 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:border-slate-300 cursor-pointer"
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>
    </div>
  );
}

// Filter Section Component
interface FilterState {
  status: string;
  priority: string;
  assignee: string;
  search: string;
}

interface FilterSectionProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

function FilterSection({ filters, onFiltersChange }: FilterSectionProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
      <h3 className="font-semibold text-slate-900 mb-4">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-2 block">Search</label>
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#42A090]"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-2 block">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#42A090]"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-2 block">Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#42A090]"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-2 block">Assignee</label>
          <select
            value={filters.assignee}
            onChange={(e) => onFiltersChange({ ...filters, assignee: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#42A090]"
          >
            <option value="">All Assignees</option>
            <option value="me">Assigned to Me</option>
            <option value="others">Assigned by Me</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Create/Edit Modal Component
interface CreateEditModalProps {
  isOpen: boolean;
  item?: ActionItem;
  onClose: () => void;
  onSave: (data: Partial<ActionItem>) => void;
  loading?: boolean;
}

function CreateEditModal({ isOpen, item, onClose, onSave, loading }: CreateEditModalProps) {
  const [formData, setFormData] = useState<Partial<ActionItem>>(
    item || {
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      deadline: '',
    }
  );

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        deadline: '',
      });
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast.error('Title is required');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-display font-bold text-slate-900">
            {item ? 'Edit Action Item' : 'New Action Item'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Title *</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Action item title"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#42A090]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add details..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#42A090] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Priority</label>
              <select
                value={formData.priority || 'medium'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#42A090]"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Status</label>
              <select
                value={formData.status || 'pending'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#42A090]"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Deadline</label>
            <input
              type="date"
              value={formData.deadline ? formData.deadline.split('T')[0] : ''}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#42A090]"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-[#42A090] text-white font-medium hover:bg-[#389080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ActionItem {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  deadline?: string;
  meeting_title?: string;
  assignee_name?: string;
  assignee_id?: string;
  assigned_by?: string;
  created_at?: string;
  completed_at?: string;
}

interface ActionItemsResponse {
  all?: ActionItem[];
  my_tasks?: ActionItem[];
  assigned_by_me?: ActionItem[];
  overdue?: ActionItem[];
  pending?: ActionItem[];
  in_progress?: ActionItem[];
  completed?: ActionItem[];
}

export default function ActionItemsPage() {
  const [loading, setLoading] = useState(true);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [myActionItems, setMyActionItems] = useState<ActionItem[]>([]);
  const [assignedByMe, setAssignedByMe] = useState<ActionItem[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    priority: '',
    assignee: '',
    search: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | undefined>();
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    void loadActionItems();

    const onFocus = () => {
      void loadActionItems();
    };

    window.addEventListener('focus', onFocus);
    const refreshTimer = window.setInterval(() => {
      void loadActionItems();
    }, 30000);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(refreshTimer);
    };
  }, []);

  const loadActionItems = async () => {
    setLoading(true);
    try {
      const [allRes, myRes, assignedRes] = await Promise.all([
        actionItemsApi.getAll().catch(() => ({ data: [] })),
        actionItemsApi.getMy().catch(() => ({ data: [] })),
        actionItemsApi.getAssignedByMe().catch(() => ({ data: [] })),
      ]);

      const allData = allRes.data as ActionItemsResponse;
      const myData = myRes.data as ActionItemsResponse;
      const assignedData = assignedRes.data as ActionItemsResponse;

      setActionItems(Array.isArray(allData) ? allData : (allData?.all || []));
      setMyActionItems(Array.isArray(myData) ? myData : (myData?.my_tasks || []));
      setAssignedByMe(Array.isArray(assignedData) ? assignedData : (assignedData?.assigned_by_me || []));
    } catch (error) {
      console.error('Failed to load action items:', error);
      toast.error('Failed to load action items');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await actionItemsApi.updateStatus(id, status);
      await loadActionItems();
      toast.success('Status updated');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this action item?')) return;

    try {
      await actionItemsApi.delete(id);
      await loadActionItems();
      toast.success('Action item deleted');
    } catch (error) {
      console.error('Failed to delete action item:', error);
      toast.error('Failed to delete action item');
    }
  };

  const handleSaveItem = async (data: Partial<ActionItem>) => {
    setModalLoading(true);
    try {
      if (editingItem) {
        await actionItemsApi.update(editingItem.id, data);
        toast.success('Action item updated');
      } else {
        await actionItemsApi.create(data);
        toast.success('Action item created');
      }
      setIsModalOpen(false);
      setEditingItem(undefined);
      await loadActionItems();
    } catch (error) {
      console.error('Failed to save action item:', error);
      toast.error('Failed to save action item');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditItem = (item: ActionItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingItem(undefined);
    setIsModalOpen(true);
  };

  // Filter items
  const filteredItems = actionItems.filter((item) => {
    if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && item.status !== filters.status) {
      return false;
    }
    if (filters.priority && item.priority !== filters.priority) {
      return false;
    }
    return true;
  });

  const stats = {
    total: actionItems.length,
    pending: actionItems.filter((a) => a.status === 'pending').length,
    inProgress: actionItems.filter((a) => a.status === 'in_progress').length,
    completed: actionItems.filter((a) => a.status === 'completed').length,
    overdue: actionItems.filter((a) => a.deadline && new Date(a.deadline) < new Date() && a.status !== 'completed').length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <MainLayout title="Action Items" subtitle="Manage and track all action items from your meetings">
      {/* Create Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 bg-[#42A090] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#389080] transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Action Item
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-2">Total Items</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-2">Pending</p>
          <p className="text-2xl font-bold text-slate-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-2">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-2">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-2">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
        </div>
      </div>

      {/* Filters */}
      <FilterSection filters={filters} onFiltersChange={setFilters} />

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Tasks - Left Column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-display font-bold text-slate-900">My Tasks</h2>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300 mx-auto" />
                <p className="text-slate-400 mt-2">Loading tasks...</p>
              </div>
            ) : myActionItems.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">No tasks assigned</h3>
                <p className="text-slate-500 text-sm">You have no tasks assigned to you yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-6">
                {myActionItems.slice(0, 3).map((item) => (
                  <ActionItemCard
                    key={item.id}
                    item={item}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onEdit={handleEditItem}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Assigned by Me */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-xl">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-display font-bold text-slate-900">Assigned by Me</h2>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300 mx-auto" />
                <p className="text-slate-400 mt-2">Loading tasks...</p>
              </div>
            ) : assignedByMe.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">No delegated tasks</h3>
                <p className="text-slate-500 text-sm">You haven't assigned any tasks yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-6">
                {assignedByMe.slice(0, 3).map((item) => (
                  <ActionItemCard
                    key={item.id}
                    item={item}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onEdit={handleEditItem}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* All Action Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#42A090]/10 rounded-xl">
                  <CheckSquare className="w-5 h-5 text-[#42A090]" />
                </div>
                <h2 className="text-lg font-display font-bold text-slate-900">All Items</h2>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No action items found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors border-l-4 border-slate-200 hover:border-[#42A090]"
                    onClick={() => handleEditItem(item)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-slate-900 text-sm line-clamp-1">{item.title}</h4>
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <StatusBadge status={item.status} />
                    </div>
                    {item.assignee_name && (
                      <p className="text-xs text-slate-500">{item.assignee_name}</p>
                    )}
                    {item.deadline && (
                      <p className="text-xs text-slate-400">
                        Due: {new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {filteredItems.length > 0 && (
              <div className="p-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500 mb-2">Showing {filteredItems.length} items</p>
              </div>
            )}
          </div>

          {/* Completion Stats */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-4">Completion Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Overall Rate</span>
                  <span className="text-2xl font-bold text-[#42A090]">{completionRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-[#42A090] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Pending</p>
                  <p className="text-lg font-bold text-slate-600">{stats.pending}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">In Progress</p>
                  <p className="text-lg font-bold text-blue-600">{stats.inProgress}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <CreateEditModal
        isOpen={isModalOpen}
        item={editingItem}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(undefined);
        }}
        onSave={handleSaveItem}
        loading={modalLoading}
      />
    </MainLayout>
  );
}
