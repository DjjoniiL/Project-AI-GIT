import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { identityMiddleware } from './middleware/identity.js';
import { orderRouter } from './routes/order.js';
import { orderPdfRouter } from './routes/orderPdf.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Собранный фронтенд лежит рядом как готовые статические файлы (specification.md,
 * раздел 8, Этап 2) — деплой-архив включает уже собранный `apps/frontend/dist`,
 * серверу не нужны исходники/toolchain фронтенда (Vite и т.п.), только раздать статику.
 */
const frontendDistPath = path.join(__dirname, '../../frontend/dist');

export function createApp() {
  const app = express();

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/order', identityMiddleware, orderRouter);
  app.use('/api/order-pdf', identityMiddleware, express.json(), orderPdfRouter);

  app.use(express.static(frontendDistPath));
  // SPA-фолбэк: плейсмент CRM_DEAL_DETAIL_TAB открывает базовый URL приложения
  // с query-параметрами (placement_options и т.д.), не отдельными путями —
  // любой не-/api GET должен вернуть index.html, а не 404 (specification.md, раздел 7).
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });

  return app;
}
