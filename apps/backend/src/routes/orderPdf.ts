import type { Request, Response } from 'express';
import { Router } from 'express';
import type { ExtraOption, OrderFormData, PrintZone } from '@garment/shared-types';
import { renderOrderPdf, type OrderPdfInput } from '../services/orderPdf.js';

const REQUIRED_FIELDS: Array<keyof OrderFormData> = [
  'productType',
  'fabric',
  'care',
  'printMethod',
  'bodyColor',
  'trimColor',
  'printZone',
];

function parsePdfExportBody(body: Record<string, unknown>): OrderPdfInput | null {
  for (const field of REQUIRED_FIELDS) {
    if (typeof body[field] !== 'string' || body[field] === '') return null;
  }
  if (body.sizes !== undefined && (typeof body.sizes !== 'object' || body.sizes === null)) return null;
  if (body.options !== undefined && !Array.isArray(body.options)) return null;

  return {
    productType: body.productType as OrderFormData['productType'],
    fabric: body.fabric as OrderFormData['fabric'],
    care: body.care as OrderFormData['care'],
    printMethod: body.printMethod as OrderFormData['printMethod'],
    bodyColor: body.bodyColor as string,
    trimColor: body.trimColor as string,
    sizes: (body.sizes as OrderFormData['sizes']) ?? {},
    options: (body.options as ExtraOption[]) ?? [],
    printZone: body.printZone as PrintZone,
    comment: typeof body.comment === 'string' ? body.comment : '',
    layoutFileName: typeof body.layoutFileName === 'string' ? body.layoutFileName : undefined,
  };
}

async function handlePdfExport(req: Request, res: Response): Promise<void> {
  const order = parsePdfExportBody(req.body as Record<string, unknown>);
  if (!order) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ORDER_DATA', message: 'Не заполнены обязательные поля заказа' },
    });
    return;
  }

  try {
    const pdfBuffer = await renderOrderPdf(order);
    res.status(200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="order-blank.pdf"');
    res.send(pdfBuffer);
  } catch {
    res.status(502).json({
      success: false,
      error: { code: 'PDF_EXPORT_FAILED', message: 'Не удалось сформировать PDF бланка заказа' },
    });
  }
}

export const orderPdfRouter = Router();

orderPdfRouter.post('/', (req, res, next) => {
  handlePdfExport(req, res).catch(next);
});
