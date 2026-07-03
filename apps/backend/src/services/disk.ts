import { vibeRequest } from '../vibecode/client.js';

/**
 * 52 МБ — реальный лимит исходного файла для POST /v1/files/upload (base64 в JSON-теле,
 * лимит тела запроса 70 МБ). Расчёт и обоснование — specification.md, раздел 4.
 */
export const MAX_LAYOUT_FILE_BYTES = 52 * 1024 * 1024;

export class FileTooLargeError extends Error {
  readonly sizeBytes: number;
  readonly maxBytes: number;

  constructor(sizeBytes: number, maxBytes: number) {
    super(`Размер файла ${sizeBytes} байт превышает лимит ${maxBytes} байт`);
    this.name = 'FileTooLargeError';
    this.sizeBytes = sizeBytes;
    this.maxBytes = maxBytes;
  }
}

export interface DiskFile {
  id: number;
  downloadUrl: string;
  [key: string]: unknown;
}

export interface LayoutFileInput {
  filename: string;
  content: Buffer;
}

/**
 * Загружает файл макета на Диск Битрикс24 (POST /v1/files/upload). Проверка размера —
 * ДО base64-кодирования, чтобы не тратить время на заведомо неудачную загрузку
 * (специфика метода — только base64 в JSON, без streaming/multipart, раздел 2).
 */
export async function uploadFileToDisk(
  file: LayoutFileInput,
  folderId: number,
): Promise<DiskFile> {
  if (file.content.byteLength > MAX_LAYOUT_FILE_BYTES) {
    throw new FileTooLargeError(file.content.byteLength, MAX_LAYOUT_FILE_BYTES);
  }

  return vibeRequest<DiskFile>('POST', '/v1/files/upload', {
    body: {
      folderId,
      filename: file.filename,
      content: file.content.toString('base64'),
    },
  });
}
