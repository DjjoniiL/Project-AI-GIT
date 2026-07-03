import express from 'express';
import { identityMiddleware } from './middleware/identity.js';
import { orderRouter } from './routes/order.js';

export function createApp() {
  const app = express();

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/order', identityMiddleware, orderRouter);

  return app;
}
