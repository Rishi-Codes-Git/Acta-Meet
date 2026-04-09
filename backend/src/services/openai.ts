import { config } from '../config';
import { AIExtractionResult, PriorityLevel } from '../types';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { execFile } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import { WaveFile } from 'wavefile';

// Ollama API endpoint
const OLLAMA_URL = config.ollama?.url || 'http://localhost:11434';
const OLLAMA_MODEL = config.ollama?.model || 'llama3.2';

// Ollama response type
interface OllamaResponse {
  response: string;
  done: boolean;
}

const execFileAsync = promisify(execFile);
let asrPipelinePromise: Promise<any> | null = null;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isConnectionRefusedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const maybeCause = error as Error & { cause?: unknown };
  if ((maybeCause.cause as { code?: string } | undefined)?.code === 'ECONNREFUSED') {
    return true;
  }

  const cause = maybeCause.cause as { errors?: Array<{ code?: string }> } | undefined;
  return Array.isArray(cause?.errors) && cause.errors.some((e) => e?.code === 'ECONNREFUSED');
}

async function getAsrPipeline() {
  if (!asrPipelinePromise) {
    asrPipelinePromise = (async () => {
      const transformers = await import('@xenova/transformers');
      transformers.env.allowLocalModels = true;
      transformers.env.allowRemoteModels = true;

      return transformers.pipeline(
        'automatic-speech-recognition',
        config.stt.model
      );
    })();
  }

  return asrPipelinePromise;
}

async function convertToWav16kMono(inputPath: string): Promise<string> {
  if (!ffmpegPath) {
    throw new Error('ffmpeg executable not found');
  }

  const tempWavPath = path.join(
    os.tmpdir(),
    `acta_stt_${Date.now()}_${Math.random().toString(36).slice(2)}.wav`
  );

  await execFileAsync(ffmpegPath, [
    '-y',
    '-i',
    inputPath,
    '-ac',
    '1',
    '-ar',
    '16000',
    '-f',
    'wav',
    tempWavPath,
  ]);

  return tempWavPath;
}

function readWavAsFloat32(wavPath: string): Float32Array {
  const wavBuffer = fs.readFileSync(wavPath);
  const wav = new WaveFile(wavBuffer);

  wav.toBitDepth('32f');
  wav.toSampleRate(16000);

  const samples = wav.getSamples(false, Float32Array) as Float64Array | Float32Array;
  return samples instanceof Float32Array ? samples : new Float32Array(samples);
}

// Helper to call Ollama
async function callOllama(prompt: string, systemPrompt?: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${OLLAMA_URL}/api/generate`, {
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
  } catch (error) {
    if (isConnectionRefusedError(error)) {
      throw new Error(`Ollama is not reachable at ${OLLAMA_URL}. Start Ollama and try again.`);
    }
    throw new Error(`Failed to call Ollama: ${getErrorMessage(error)}`);
  }

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
    console.warn(`Ollama summary unavailable: ${getErrorMessage(error)}`);
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
    console.warn(`Ollama insights unavailable: ${getErrorMessage(error)}`);
    return { summary: '', decisions: [], action_items: [] };
  }
}

// Transcribe audio - for now returns placeholder (whisper.cpp integration later)
export async function transcribeAudio(audioFilePath: string): Promise<string> {
  console.log('Audio transcription requested for:', audioFilePath);

  let tempWavPath: string | null = null;
  try {
    tempWavPath = await convertToWav16kMono(audioFilePath);
    const audioData = readWavAsFloat32(tempWavPath);
    const asr = await getAsrPipeline();

    const result = await asr(audioData, {
      chunk_length_s: config.stt.chunkLengthSeconds,
      stride_length_s: config.stt.strideLengthSeconds,
      return_timestamps: false,
    });

    const text = typeof result?.text === 'string' ? result.text.trim() : '';
    if (!text) {
      throw new Error('No transcription text returned');
    }

    return text;
  } catch (error) {
    console.error('Local transcription error:', error);
    throw new Error('Failed to transcribe audio locally. Ensure ffmpeg is available and STT model can be loaded.');
  } finally {
    if (tempWavPath && fs.existsSync(tempWavPath)) {
      fs.unlinkSync(tempWavPath);
    }
  }
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
