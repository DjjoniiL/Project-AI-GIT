import { PDFDocument } from 'pdf-lib';

/** Максимальный размер страницы PDF в пунктах (условность формата, ~200 дюймов на сторону). */
const MAX_PDF_POINTS = 14400;

/**
 * Упаковывает JPEG в одностраничный PDF (specification.md, раздел 4.1) — стандартные
 * PDF-библиотеки не embed-ят AVIF-поток напрямую, поэтому итоговый производственный
 * файл несёт растровые данные как JPEG. Если пиксельные размеры превышают допустимый
 * размер страницы PDF, картинка масштабируется в PDF-«пункты» без повторного кодирования.
 */
export async function buildSingleImagePdf(jpegBytes: ArrayBuffer): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const jpegImage = await pdfDoc.embedJpg(jpegBytes);

  const pointsScale = Math.min(1, MAX_PDF_POINTS / jpegImage.width, MAX_PDF_POINTS / jpegImage.height);
  const pageWidth = jpegImage.width * pointsScale;
  const pageHeight = jpegImage.height * pointsScale;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  page.drawImage(jpegImage, { x: 0, y: 0, width: pageWidth, height: pageHeight });

  return pdfDoc.save();
}
