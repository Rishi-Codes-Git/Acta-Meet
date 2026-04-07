import { config } from '../config';
import { AIExtractionResult, PriorityLevel } from '../types';

// Ollama API endpoint
const OLLAMA_URL = config.ollama?.url || 'http://localhost:11434';
const OLLAMA_MODEL = config.ollama?.model || 'llama3.2';

// Ollama response type
interface OllamaResponse {
  response: string;
  done: boolean;
}

// Helper to call Ollama
async function callOllama(prompt: string, systemPrompt?: string): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: systemPrompt ? `${systemPrompt}\n\nUser: ${prompt}` : prompt,
      stream: false,
      options: {
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as OllamaResponse;
  return data.response || '';
}

// Summarize discussion points
export async function summarizeDiscussion(
  meetingType: string,
  discussionText: string
): Promise<string> {
  const systemPrompt = `You are a professional meeting summarizer for Acta, a meeting management tool. Create concise, actionable summaries in a professional tone.`;
  
  const prompt = `Summarize this ${meetingType.replace('_', ' ')} meeting discussion:

${discussionText}

Provide:
1. A 2-3 sentence executive summary
2. Key points discussed (as bullet points)

Keep it concise and professional.`;

  try {
    return await callOllama(prompt, systemPrompt);
  } catch (error) {
    console.error('Ollama summarize error:', error);
    return 'Unable to generate summary. Please ensure Ollama is running.';
  }
}

// Extract action items, decisions from discussion
export async function extractMeetingInsights(
  discussionText: string
): Promise<AIExtractionResult> {
  const prompt = `You are an AI assistant that extracts structured data from meeting discussions.

Extract action items and decisions from this meeting discussion:

${discussionText}

Return ONLY valid JSON in this exact format (no other text):
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
      "priority": "high"
    }
  ]
}

Rules:
- Priority must be: "high", "medium", or "low"
- urgent/critical/ASAP = high, normal = medium, nice-to-have = low
- Deadline: infer from "by Friday", "next week", "end of month" etc. Use YYYY-MM-DD format
- If no clear assignee, use null
- Extract ALL action items mentioned
- ONLY output the JSON, nothing else`;

  try {
    const response = await callOllama(prompt);
    
    // Try to extract JSON from response
    let jsonStr = response;
    
    // Find JSON in response (handle markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    const parsed = JSON.parse(jsonStr);
    
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
    console.error('Failed to parse Ollama response:', error);
    return { summary: '', decisions: [], action_items: [] };
  }
}

// Transcribe audio - for now returns placeholder (whisper.cpp integration later)
export async function transcribeAudio(audioFilePath: string): Promise<string> {
  // TODO: Integrate with whisper.cpp for local transcription
  // For now, we'll return a message indicating manual transcription is needed
  console.log('Audio transcription requested for:', audioFilePath);
  return `[Audio transcription is not yet available locally. Please paste the meeting notes manually or integrate whisper.cpp for local transcription.]`;
}

// Check if Ollama is running
export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}
