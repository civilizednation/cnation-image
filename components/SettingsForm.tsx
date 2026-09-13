'use client';

import type { OutputFormat } from '@/lib/imageProcessing';

export type SaveTarget = 'photos' | 'files';

interface SettingsFormProps {
  width: string;
  height: string;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  format: OutputFormat;
  onFormatChange: (value: OutputFormat) => void;
  quality: number;
  onQualityChange: (value: number) => void;
  saveTarget: SaveTarget;
  onSaveTargetChange: (value: SaveTarget) => void;
  disabled?: boolean;
}

const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: 'jpeg', label: 'JPG' },
  { value: 'webp', label: 'WEBP' },
  { value: 'png', label: 'PNG' },
];

export default function SettingsForm({
  width,
  height,
  onWidthChange,
  onHeightChange,
  format,
  onFormatChange,
  quality,
  onQualityChange,
  saveTarget,
  onSaveTargetChange,
  disabled,
}: SettingsFormProps) {
  const onlyDigits = (value: string) => value.replace(/[^0-9]/g, '');

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">
          크기 (픽셀) — 가로 또는 세로 중 하나만 입력하면 비율을 유지한 채 리사이징합니다
        </p>
        <div className="flex items-center gap-3">
          <label className="flex-1">
            <span className="mb-1 block text-xs text-gray-500">가로</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="예: 1000"
              value={width}
              disabled={disabled}
              onChange={(e) => {
                onWidthChange(onlyDigits(e.target.value));
                if (e.target.value) onHeightChange('');
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base disabled:bg-gray-100"
            />
          </label>
          <span className="mt-4 text-gray-400">×</span>
          <label className="flex-1">
            <span className="mb-1 block text-xs text-gray-500">세로</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="예: 1000"
              value={height}
              disabled={disabled}
              onChange={(e) => {
                onHeightChange(onlyDigits(e.target.value));
                if (e.target.value) onWidthChange('');
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base disabled:bg-gray-100"
            />
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">출력 포맷</p>
        <div className="grid grid-cols-3 gap-2">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onFormatChange(opt.value)}
              className={`rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                format === opt.value
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-300 bg-white text-gray-700'
              } disabled:opacity-50`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            이미지 품질{format === 'png' ? ' (PNG는 무손실이라 적용되지 않음)' : ''}
          </span>
          <span className="text-sm text-gray-500">{quality}%</span>
        </div>
        <input
          type="range"
          min={1}
          max={100}
          value={quality}
          disabled={disabled || format === 'png'}
          onChange={(e) => onQualityChange(Number(e.target.value))}
          className="w-full disabled:opacity-50"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">
          사진을 가져온 곳 (저장될 위치와 동일하게 지정됩니다)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSaveTargetChange('photos')}
            className={`rounded-lg border px-3 py-3 text-sm font-semibold ${
              saveTarget === 'photos' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700'
            } disabled:opacity-50`}
          >
            📷 사진 보관함
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSaveTargetChange('files')}
            className={`rounded-lg border px-3 py-3 text-sm font-semibold ${
              saveTarget === 'files' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700'
            } disabled:opacity-50`}
          >
            📁 파일
          </button>
        </div>
      </div>
    </div>
  );
}
