import express from 'express';
import cors from 'cors';
import pdfRoutes from './routes/pdfRoutes';

const app = express();
const PORT = process.env.PORT || 3000;
const POWER_PAGES_ORIGIN = process.env.POWER_PAGES_ORIGIN || '*';

// Middleware
app.use(cors({
  origin: POWER_PAGES_ORIGIN,
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'DFSA PDF Generation Service'
  });
});

// API routes
app.use('/api/pdf', pdfRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`=== DFSA PDF Service ===`);
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for: ${POWER_PAGES_ORIGIN}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoint: http://localhost:${PORT}/api/pdf/generate`);
  console.log('========================');
});

export default app;
