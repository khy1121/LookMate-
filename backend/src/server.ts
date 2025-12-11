import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import aiRoutes from './routes/ai';
import dataRoutes from './routes/data';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/ai', aiRoutes);
app.use('/api/data', dataRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Server error:', err);
  
  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      error: 'File too large', 
      message: 'Maximum file size is 5MB' 
    });
  }
  
  // Multer file type error
  if (err.message && err.message.includes('Only image files')) {
    return res.status(400).json({ 
      error: 'Invalid file type', 
      message: err.message 
    });
  }
  
  // Generic error
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LookMate AI Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 Static uploads: http://localhost:${PORT}/uploads`);
});
