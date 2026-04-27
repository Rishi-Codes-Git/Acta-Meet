import dotenv from 'dotenv';
dotenv.config();

export const config = {
  appName: 'Acta',
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://mom_user:password@localhost:5432/mom_db',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // Ollama (local AI)
  ollama: {
    url: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.2',
  },

  // Local speech-to-text
  stt: {
    model: process.env.STT_MODEL || 'Xenova/whisper-small',
    chunkLengthSeconds: parseInt(process.env.STT_CHUNK_LENGTH_SECONDS || '30'),
    strideLengthSeconds: parseInt(process.env.STT_STRIDE_LENGTH_SECONDS || '5'),
  },
  
  // n8n automation webhooks
  n8n: {
    enabled: process.env.N8N_ENABLED === 'true',
    webhookUrl: process.env.N8N_WEBHOOK_URL || '',
    taskCreatedPath: process.env.N8N_TASK_CREATED_PATH || '/task-created',
    taskUpdatedPath: process.env.N8N_TASK_UPDATED_PATH || '/task-updated',
  },
  
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'),
  },
};
