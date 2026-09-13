'use client';

export interface ThumbnailItem {
  id: string;
  url: string;
  label: string;
}

interface ThumbnailGridProps {
  title: string;
  items: ThumbnailItem[];
  onRemove?: (id: string) => void;
}

export default function ThumbnailGrid({ title, items, onRemove }: ThumbnailGridProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700">
        {title} ({items.length}장 · 선택한 순서대로 표시됩니다)
      </p>
      <div className="grid grid-cols-4 gap-2">
        {items.map((item, index) => (
          <div key={item.id} className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
            <img src={item.url} alt={item.label} className="h-full w-full object-cover" />
            <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {index + 1}
            </span>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label="제거"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
