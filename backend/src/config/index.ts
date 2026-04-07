import dotenv from 'dotenv';
dotenv.config();

export const config = {
  appName: 'Acta',
  port: process.env.PORT || 3000,
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
  
  // OpenAI (optional, for cloud fallback)
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'),
  },
};
