import OpenAI from 'openai';
import { config } from '../config';
import { AIExtractionResult, PriorityLevel } from '../types';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

// Summarize discussion points
export async function summarizeDiscussion(
  meetingType: string,
  discussionText: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a professional meeting summarizer for Acta, a meeting management tool. 
Create concise, actionable summaries in a professional tone.`,
      },
      {
        role: 'user',
        content: `Summarize this ${meetingType.replace('_', ' ')} meeting discussion:

${discussionText}

Provide:
1. A 2-3 sentence executive summary
2. Key points discussed (as bullet points)

Keep it concise and professional.`,
      },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content || 'Unable to generate summary.';
}

// Extract action items, decisions from discussion
export async function extractMeetingInsights(
  discussionText: string
): Promise<AIExtractionResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an AI assistant for Acta that extracts structured data from meeting discussions.
Always respond with valid JSON only.`,
      },
      {
        role: 'user',
        content: `Extract action items and decisions from this meeting discussion:

${discussionText}

Return ONLY valid JSON in this exact format:
{
  "summary": "2-3 sentence summary of the discussion",
  "decisions": [
    {"decision": "What was decided", "decided_by": "Person or Team"}
  ],
  "action_items": [
    {
      "task": "Clear task description",
      "assignee": "Person name or null",
      "deadline": "YYYY-MM-DD or null",
      "priority": "high" | "medium" | "low"
    }
  ]
}

Rules:
- Priority: urgent/critical/ASAP = high, normal = medium, nice-to-have = low
- Deadline: infer from "by Friday", "next week", "end of month" etc.
- If no clear assignee, use null
- Extract ALL action items mentioned`,
      },
    ],
    temperature: 0.2,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  try {
    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    
    return {
      summary: parsed.summary || '',
      decisions: parsed.decisions || [],
      action_items: (parsed.action_items || []).map((item: any) => ({
        task: item.task,
        assignee: item.assignee || undefined,
        deadline: item.deadline || undefined,
        priority: (['high', 'medium', 'low'].includes(item.priority) 
          ? item.priority 
          : 'medium') as PriorityLevel,
      })),
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return { summary: '', decisions: [], action_items: [] };
  }
}

// Transcribe audio using Whisper
export async function transcribeAudio(audioFilePath: string): Promise<string> {
  const fs = await import('fs');
  
  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioFilePath),
    model: 'whisper-1',
    response_format: 'text',
  });

  return response;
}
