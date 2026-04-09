import { query } from '../db';
import { summarizeDiscussion, extractMeetingInsights } from './openai';
import { generatePDF, generateDocx } from './documentGenerator';
import { createNotification } from './notificationService';
import { triggerTaskCreatedAutomation } from './n8nAutomation';
import { MomContent, Meeting, Participant, AgendaItem, DiscussionPoint, Decision, ActionItem } from '../types';

// Strip markdown formatting for professional display
function stripMarkdownFormatting(text: string | undefined): string {
  if (!text) return '';
  
  return text
    // Remove bold: **text** or __text__ -> text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // Remove italic: *text* or _text_ -> text
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Remove markdown headings: ### text -> text
    .replace(/^#+\s+(.+)$/gm, '$1')
    // Remove bullet points but keep text: - text or * text -> text
    .replace(/^[\*\-]\s+/gm, '')
    .trim();
}

// Parse deadline from AI response
function parseDeadline(deadlineStr: string | undefined): string | null {
  if (!deadlineStr) return null;
  
  // Clean up the string - remove "or null", "or undefined", extra quotes, etc.
  const cleaned = deadlineStr
    .toLowerCase()
    .replace(/\s*(or|,)\s*(null|undefined|none|n\/a)/gi, '')
    .trim()
    .replace(/^["']|["']$/g, ''); // Remove quotes
  
  if (!cleaned || cleaned === 'null' || cleaned === 'undefined') return null;
  
  // Check if it's already in YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(cleaned)) {
    // Validate the date is real
    const date = new Date(cleaned + 'T00:00:00Z');
    if (!isNaN(date.getTime())) {
      return cleaned; // Already correct format
    }
  }
  
  // Try to parse as date
  const date = new Date(cleaned);
  if (isNaN(date.getTime())) return null;
  
  // Return in YYYY-MM-DD format
  return date.toISOString().split('T')[0];
}

// Match assignee name to participant/user
async function matchAssigneeToUser(
  assigneeName: string, 
  meetingId: string
): Promise<{ user_id: string | null; name: string }> {
  if (!assigneeName) return { user_id: null, name: 'Unassigned' };
  
  const nameLower = assigneeName.toLowerCase().trim();
  
  // First, try to match with participants of this meeting (by name or email)
  const participantResult = await query(
    `SELECT p.user_id, p.name, p.email, u.name as user_name 
     FROM participants p 
     LEFT JOIN users u ON p.user_id = u.id
     WHERE p.meeting_id = $1 
       AND (LOWER(p.name) LIKE $2 OR LOWER(u.name) LIKE $2 OR LOWER(p.email) LIKE $2 OR LOWER(u.email) LIKE $2)`,
    [meetingId, `%${nameLower}%`]
  );
  
  if (participantResult.rows.length > 0) {
    const match = participantResult.rows[0];
    return { 
      user_id: match.user_id, 
      name: match.user_name || match.name 
    };
  }
  
  // If not found in participants, search all users (by name or email)
  const userResult = await query(
    `SELECT id, name FROM users WHERE LOWER(name) LIKE $1 OR LOWER(email) LIKE $1`,
    [`%${nameLower}%`]
  );
  
  if (userResult.rows.length > 0) {
    return { 
      user_id: userResult.rows[0].id, 
      name: userResult.rows[0].name 
    };
  }
  
  // No match found - keep original name without user_id
  return { user_id: null, name: assigneeName };
}

export async function generateMoM(meetingId: string, generatedBy?: string): Promise<MomContent> {
  // Fetch meeting data
  const meetingResult = await query('SELECT * FROM meetings WHERE id = $1', [meetingId]);
  if (meetingResult.rows.length === 0) {
    throw new Error('Meeting not found');
  }
  const meeting: Meeting = meetingResult.rows[0];
  
  // Fetch related data
  const [participantsResult, agendaResult, discussionResult] = await Promise.all([
    query('SELECT p.*, u.name as user_name, u.email as user_email FROM participants p LEFT JOIN users u ON p.user_id = u.id WHERE p.meeting_id = $1', [meetingId]),
    query('SELECT * FROM agenda_items WHERE meeting_id = $1 ORDER BY order_index', [meetingId]),
    query('SELECT * FROM discussion_points WHERE meeting_id = $1', [meetingId]),
  ]);
  
  const participants: Participant[] = participantsResult.rows;
  const agenda_items: AgendaItem[] = agendaResult.rows;
  const discussion_points: DiscussionPoint[] = discussionResult.rows;
  
  // Combine discussion text for AI processing
  const discussionText = discussion_points.map(d => 
    `${d.speaker ? `[${d.speaker}]: ` : ''}${d.content}`
  ).join('\n\n');
  
  // Generate AI insights
  let summary = '';
  let key_points: string[] = [];
  let decisions: Decision[] = [];
  let action_items: ActionItem[] = [];
  
  if (discussionText.trim()) {
    // Get AI summary and extraction
    const [summaryResult, extractionResult] = await Promise.all([
      summarizeDiscussion(meeting.type, discussionText),
      extractMeetingInsights(discussionText),
    ]);
    
    // Strip markdown formatting from summary for professional display
    summary = stripMarkdownFormatting(summaryResult.summary);
    key_points = summaryResult.key_points.map(point => stripMarkdownFormatting(point));
    
    // Save decisions
    for (const d of extractionResult.decisions) {
      // Try to match decided_by to a user
      const decidedByMatch = await matchAssigneeToUser(d.decided_by || '', meetingId);
      
      // Strip markdown from decision content
      const cleanDecision = stripMarkdownFormatting(d.decision);
      
      const result = await query(
        'INSERT INTO decisions (meeting_id, content, decided_by, decided_by_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [meetingId, cleanDecision, decidedByMatch.name, decidedByMatch.user_id]
      );
      decisions.push(result.rows[0]);
    }
    
    // Save action items with user matching
    for (const item of extractionResult.action_items) {
      // Match assignee to user account
      const assigneeMatch = await matchAssigneeToUser(item.assignee || '', meetingId);
      
      // Strip markdown from task title
      const cleanTaskTitle = stripMarkdownFormatting(item.task);
      
      // Parse deadline properly
      const deadline = parseDeadline(item.deadline);
      
      const result = await query(
        `INSERT INTO action_items (meeting_id, title, assignee_name, assignee_id, assigned_by, priority, deadline) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [meetingId, cleanTaskTitle, assigneeMatch.name, assigneeMatch.user_id, generatedBy, item.priority, deadline]
      );
      
      const actionItem = result.rows[0];
      action_items.push(actionItem);

      await triggerTaskCreatedAutomation(actionItem.id, 'mom_generation');
      
      // Send notification to assignee if they have a user account
      if (assigneeMatch.user_id) {
        await createNotification({
          user_id: assigneeMatch.user_id,
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: `You have been assigned: "${item.task}"`,
          reference_id: actionItem.id,
          reference_type: 'action_item'
        });
      }
    }
    
    // Update discussion points with summaries
    for (const dp of discussion_points) {
      dp.summary = summary;
    }
  }
  
  const momContent: MomContent = {
    meeting,
    participants,
    agenda_items,
    discussion_points,
    summary,
    key_points,
    decisions,
    action_items,
    generated_at: new Date(),
  };
  
  // Generate documents
  const [pdfPath, docxPath] = await Promise.all([
    generatePDF(momContent, meetingId),
    generateDocx(momContent, meetingId),
  ]);
  
  // Save MoM document record
  await query(
    `INSERT INTO mom_documents (meeting_id, content, pdf_path, docx_path) 
     VALUES ($1, $2, $3, $4)`,
    [meetingId, JSON.stringify(momContent), pdfPath, docxPath]
  );
  
  // Update meeting status
  await query(
    "UPDATE meetings SET status = 'completed', updated_at = NOW() WHERE id = $1",
    [meetingId]
  );
  
  // Notify all participants about MoM generation
  for (const participant of participants) {
    if (participant.user_id) {
      await createNotification({
        user_id: participant.user_id,
        type: 'mom_generated',
        title: 'Meeting Minutes Generated',
        message: `Minutes for "${meeting.title}" are now available`,
        reference_id: meetingId,
        reference_type: 'meeting'
      });
    }
  }
  
  return momContent;
}

export async function getMoM(meetingId: string): Promise<MomContent | null> {
  const result = await query(
    'SELECT * FROM mom_documents WHERE meeting_id = $1 ORDER BY generated_at DESC LIMIT 1',
    [meetingId]
  );
  
  if (result.rows.length === 0) return null;
  
  return result.rows[0].content as MomContent;
}
