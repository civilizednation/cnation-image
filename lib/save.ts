import JSZip from 'jszip';

export interface ProcessedImage {
  name: string;
  blob: Blob;
  mimeType: string;
}

export type ShareResult = 'shared' | 'cancelled' | 'unsupported';

/**
 * iOS has no web API that saves a file straight into Photos. The
 * supported path is the native share sheet: navigator.share() with
 * File objects lets the user tap "이미지 저장" there, which drops them
 * into the Photo Library.
 */
export async function shareToPhotos(images: ProcessedImage[]): Promise<ShareResult> {
  const filesForShare = images.map((img) => new File([img.blob], img.name, { type: img.mimeType }));

  if (typeof navigator === 'undefined' || !navigator.canShare || !navigator.canShare({ files: filesForShare })) {
    return 'unsupported';
  }

  try {
    await navigator.share({ files: filesForShare });
    return 'shared';
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return 'cancelled';
    throw err;
  }
}

export async function downloadAsZip(images: ProcessedImage[], zipName = 'resized-images.zip'): Promise<void> {
  const zip = new JSZip();
  images.forEach((img) => {
    zip.file(img.name, img.blob);
  });
  const zipBlob = await zip.generateAsync({ type: 'blob' });

  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
