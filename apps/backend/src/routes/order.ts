import type { Request, Response } from 'express';
import { Router } from 'express';
import multer from 'multer';
import type { ExtraOption, OrderFormData, PrintZone } from '@garment/shared-types';
import { createOrUpdateDeal } from '../services/deals.js';
import { FileTooLargeError, MAX_LAYOUT_FILE_BYTES, uploadFileToDisk } from '../services/disk.js';
import { VibeApiRequestError } from '../vibecode/client.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_LAYOUT_FILE_BYTES },
});

const REQUIRED_FIELDS: Array<keyof OrderFormData> = [
  'productType',
  'fabric',
  'care',
  'printMethod',
  'bodyColor',
  'trimColor',
  'printZone',
];

function parseOrderBody(body: Record<string, unknown>): OrderFormData | null {
  for (const field of REQUIRED_FIELDS) {
    if (typeof body[field] !== 'string' || body[field] === '') return null;
  }

  let sizes: OrderFormData['sizes'];
  let options: ExtraOption[];
  try {
    sizes = typeof body.sizes === 'string' && body.sizes ? JSON.parse(body.sizes) : {};
    options = typeof body.options === 'string' && body.options ? JSON.parse(body.options) : [];
  } catch {
    return null;
  }

  return {
    productType: body.productType as OrderFormData['productType'],
    fabric: body.fabric as OrderFormData['fabric'],
    care: body.care as OrderFormData['care'],
    printMethod: body.printMethod as OrderFormData['printMethod'],
    bodyColor: body.bodyColor as string,
    trimColor: body.trimColor as string,
    sizes,
    options,
    printZone: body.printZone as PrintZone,
    comment: typeof body.comment === 'string' ? body.comment : '',
  };
}

async function handleOrder(req: Request, res: Response): Promise<void> {
  const order = parseOrderBody(req.body as Record<string, unknown>);
  if (!order) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ORDER_DATA', message: 'Не заполнены обязательные поля заказа' },
    });
    return;
  }

  const dealId =
    typeof (req.body as Record<string, unknown>).dealId === 'string' && req.body.dealId
      ? (req.body.dealId as string)
      : undefined;

  try {
    if (req.file) {
      // Целевая папка на Диске — открытый вопрос до живого теста (GET /v1/storages);
      // на MVP это фиксированный folderId из окружения (specification.md, раздел 8, Этап 1).
      const folderId = Number(process.env.VIBE_LAYOUT_FOLDER_ID ?? '');
      if (!folderId) {
        res.status(500).json({
          success: false,
          error: {
            code: 'FOLDER_NOT_CONFIGURED',
            message: 'Переменная окружения VIBE_LAYOUT_FOLDER_ID не задана',
          },
        });
        return;
      }

      const diskFile = await uploadFileToDisk(
        { filename: req.file.originalname, content: req.file.buffer },
        folderId,
      );
      order.designFileId = String(diskFile.id);
    }

    const deal = await createOrUpdateDeal(order, dealId);
    res.status(200).json({ success: true, data: { dealId: deal.id } });
  } catch (err) {
    if (err instanceof FileTooLargeError) {
      res.status(413).json({ success: false, error: { code: 'FILE_TOO_LARGE', message: err.message } });
      return;
    }
    if (err instanceof VibeApiRequestError) {
      res.status(err.status).json({ success: false, error: { code: err.code, message: err.message } });
      return;
    }
    res.status(502).json({
      success: false,
      error: { code: 'VIBE_API_UNREACHABLE', message: 'Не удалось связаться с VibeCode API' },
    });
  }
}

export const orderRouter = Router();

orderRouter.post('/', (req, res, next) => {
  upload.single('layoutFile')(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `Файл больше лимита ${MAX_LAYOUT_FILE_BYTES} байт`,
          },
        });
        return;
      }
      next(err);
      return;
    }
    handleOrder(req, res).catch(next);
  });
});
