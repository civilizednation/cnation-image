export type OutputFormat = 'jpeg' | 'png' | 'webp';

export interface ResizeOptions {
  targetWidth?: number;
  targetHeight?: number;
  format: OutputFormat;
  quality: number; // 1-100, ignored for png
}

export const MIME_TYPES: Record<OutputFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export async function resizeImage(file: File, options: ResizeOptions): Promise<Blob> {
  // imageOrientation: 'from-image' applies the photo's EXIF rotation so
  // iPhone portrait shots don't come out sideways after resizing.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

  const srcWidth = bitmap.width;
  const srcHeight = bitmap.height;
  let targetWidth = options.targetWidth;
  let targetHeight = options.targetHeight;

  if (targetWidth && !targetHeight) {
    targetHeight = Math.round((srcHeight / srcWidth) * targetWidth);
  } else if (targetHeight && !targetWidth) {
    targetWidth = Math.round((srcWidth / srcHeight) * targetHeight);
  } else if (!targetWidth && !targetHeight) {
    targetWidth = srcWidth;
    targetHeight = srcHeight;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth!;
  canvas.height = targetHeight!;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas context를 생성할 수 없습니다.');
  }
  ctx.drawImage(bitmap, 0, 0, targetWidth!, targetHeight!);
  bitmap.close();

  const mimeType = MIME_TYPES[options.format];
  const quality = options.format === 'png' ? undefined : Math.min(Math.max(options.quality, 1), 100) / 100;

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });

  if (!blob) throw new Error('이미지 변환에 실패했습니다.');
  return blob;
}

export function buildOutputFileName(originalName: string, index: number, format: OutputFormat): string {
  const base = originalName.replace(/\.[^/.]+$/, '');
  // Zero-padded prefix keeps zip/share order identical to the order the
  // user picked the photos in, since neither destination sorts by itself.
  const order = String(index + 1).padStart(3, '0');
  return `${order}_${base}.${format}`;
}
