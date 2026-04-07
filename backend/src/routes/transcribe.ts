import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { transcribeAudio } from '../services/openai';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Configure multer for audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `audio_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxSize },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm', 'audio/m4a'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|m4a|webm|mp4)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

// Transcribe audio
router.post('/', upload.single('audio'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    const filePath = req.file.path;
    
    console.log(`Transcribing audio: ${filePath}`);
    
    const transcription = await transcribeAudio(filePath);
    
    res.json({
      transcription,
      file: req.file.filename,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

export default router;
