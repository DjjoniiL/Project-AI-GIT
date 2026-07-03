import { useEffect, useState } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const RASTER_EXTENSIONS = ['png', 'jpg', 'jpeg'];

function extensionOf(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

async function renderPdfFirstPageToDataUrl(file: File): Promise<string | null> {
  try {
    const buffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: buffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Живой предпросмотр загруженного макета для наложения в зоне печати
 * (specification.md, раздел 4.1): .png/.jpg — через FileReader, .pdf — через
 * рендер первой страницы в канвас (pdf.js). Для .ai/.eps клиентского способа
 * рендера нет — возвращается null, вызывающий код показывает плашку-заглушку.
 */
export function useFilePreviewUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    let cancelled = false;
    const ext = extensionOf(file.name);

    async function load() {
      if (!file) return;
      let result: string | null = null;
      if (RASTER_EXTENSIONS.includes(ext)) {
        result = await readAsDataUrl(file);
      } else if (ext === 'pdf') {
        result = await renderPdfFirstPageToDataUrl(file);
      }
      if (!cancelled) setUrl(result);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [file]);

  return url;
}
