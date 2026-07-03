export function loadImageBitmapFromFile(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

export function drawScaledImageData(bitmap: ImageBitmap, scale: number): ImageData {
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D-контекст недоступен');
  }
  context.drawImage(bitmap, 0, 0, width, height);
  return context.getImageData(0, 0, width, height);
}

export function canvasFromImageData(imageData: ImageData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D-контекст недоступен');
  }
  context.putImageData(imageData, 0, 0);
  return canvas;
}

export function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Не удалось выполнить JPEG-кодирование'));
        }
      },
      'image/jpeg',
      quality,
    );
  });
}
