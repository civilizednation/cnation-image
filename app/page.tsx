'use client';

import { useEffect, useRef, useState } from 'react';
import SettingsForm, { SaveTarget } from '@/components/SettingsForm';
import ThumbnailGrid, { ThumbnailItem } from '@/components/ThumbnailGrid';
import { buildOutputFileName, MIME_TYPES, OutputFormat, resizeImage } from '@/lib/imageProcessing';
import { downloadAsZip, ProcessedImage, shareToPhotos } from '@/lib/save';

interface SelectedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

interface ResultPhoto extends ProcessedImage {
  id: string;
  previewUrl: string;
}

let uid = 0;
const nextId = () => `${Date.now()}-${uid++}`;

export default function HomePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [width, setWidth] = useState('1000');
  const [height, setHeight] = useState('');
  const [format, setFormat] = useState<OutputFormat>('jpeg');
  const [quality, setQuality] = useState(80);
  const [saveTarget, setSaveTarget] = useState<SaveTarget>('photos');

  const [results, setResults] = useState<ResultPhoto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  // Selected/result previews are object URLs; revoke them when replaced or unmounted.
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, [photos]);

  useEffect(() => {
    return () => {
      results.forEach((r) => URL.revokeObjectURL(r.previewUrl));
    };
  }, [results]);

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newPhotos: SelectedPhoto[] = Array.from(fileList).map((file) => ({
      id: nextId(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    setResults([]);
    setStatusMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearAll = () => {
    setPhotos([]);
    setResults([]);
    setStatusMessage('');
  };

  const canProcess = photos.length > 0 && (width !== '' || height !== '') && !isProcessing;

  const handleProcess = async () => {
    if (photos.length === 0) return;
    setIsProcessing(true);
    setStatusMessage('');
    setResults([]);
    setProgress(0);

    const targetWidth = width ? Number(width) : undefined;
    const targetHeight = height ? Number(height) : undefined;
    const mimeType = MIME_TYPES[format];

    const processed: ResultPhoto[] = [];
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      try {
        const blob = await resizeImage(photo.file, { targetWidth, targetHeight, format, quality });
        const name = buildOutputFileName(photo.file.name, i, format);
        processed.push({
          id: photo.id,
          name,
          blob,
          mimeType,
          previewUrl: URL.createObjectURL(blob),
        });
      } catch (err) {
        console.error('resize failed', photo.file.name, err);
      }
      setProgress(i + 1);
    }

    setResults(processed);
    setIsProcessing(false);
    setStatusMessage(`${processed.length}장 변환 완료. 저장할 위치를 눌러주세요.`);
  };

  const handleSave = async () => {
    if (results.length === 0) return;
    const plain: ProcessedImage[] = results.map(({ name, blob, mimeType }) => ({ name, blob, mimeType }));

    if (saveTarget === 'photos') {
      const result = await shareToPhotos(plain);
      if (result === 'shared') {
        setStatusMessage('공유 시트에서 "이미지 저장"을 선택하면 사진 보관함에 저장됩니다.');
      } else if (result === 'cancelled') {
        setStatusMessage('저장이 취소되었습니다.');
      } else {
        setStatusMessage('이 브라우저는 공유 저장을 지원하지 않아 zip 파일로 대신 다운로드합니다.');
        await downloadAsZip(plain);
      }
    } else {
      await downloadAsZip(plain);
      setStatusMessage('zip 파일이 다운로드되었습니다. "파일" 앱 > 다운로드 폴더에서 압축을 풀어 확인하세요.');
    }
  };

  const selectedThumbnails: ThumbnailItem[] = photos.map((p) => ({ id: p.id, url: p.previewUrl, label: p.file.name }));
  const resultThumbnails: ThumbnailItem[] = results.map((r) => ({ id: r.id, url: r.previewUrl, label: r.name }));

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-4 pb-16 pt-8">
      <header>
        <h1 className="text-xl font-bold">이미지 일괄 리사이저</h1>
        <p className="mt-1 text-sm text-gray-500">
          사진 보관함이나 파일에서 여러 장을 선택하면, 고른 순서 그대로 리사이징 & 포맷 변환합니다.
        </p>
      </header>

      <section>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
          id="photo-input"
        />
        <label
          htmlFor="photo-input"
          className="flex w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-6 text-sm font-semibold text-gray-700 active:bg-gray-100"
        >
          + 사진 선택 (사진 보관함 / 파일)
        </label>
      </section>

      {photos.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <ThumbnailGrid title="선택된 사진" items={selectedThumbnails} onRemove={isProcessing ? undefined : handleRemovePhoto} />
          </div>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={isProcessing}
            className="text-xs font-medium text-gray-400 underline disabled:opacity-50"
          >
            전체 지우기
          </button>
        </section>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <SettingsForm
          width={width}
          height={height}
          onWidthChange={setWidth}
          onHeightChange={setHeight}
          format={format}
          onFormatChange={setFormat}
          quality={quality}
          onQualityChange={setQuality}
          saveTarget={saveTarget}
          onSaveTargetChange={setSaveTarget}
          disabled={isProcessing}
        />
      </section>

      <button
        type="button"
        onClick={handleProcess}
        disabled={!canProcess}
        className="w-full rounded-xl bg-gray-900 px-4 py-4 text-base font-bold text-white disabled:opacity-40"
      >
        {isProcessing ? `변환 중... (${progress}/${photos.length})` : `변환 시작 (${photos.length}장)`}
      </button>

      {results.length > 0 && (
        <section className="space-y-3">
          <ThumbnailGrid title="변환 결과" items={resultThumbnails} />
          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-xl border-2 border-gray-900 bg-white px-4 py-4 text-base font-bold text-gray-900"
          >
            {saveTarget === 'photos' ? '📷 사진 보관함에 저장' : '📁 파일에 저장'}
          </button>
        </section>
      )}

      {statusMessage && <p className="text-center text-sm text-gray-600">{statusMessage}</p>}
    </main>
  );
}
