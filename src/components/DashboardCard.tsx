'use client';

import { UserProduct } from '@/lib/userProducts';

const typeColors: Record<string, string> = {
  Planner: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Checklist: 'bg-blue-100 text-blue-700 border-blue-200',
  Guide: 'bg-violet-100 text-violet-700 border-violet-200',
  Workbook: 'bg-amber-100 text-amber-700 border-amber-200',
  Journal: 'bg-pink-100 text-pink-700 border-pink-200',
  Tracker: 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

const templateEmoji: Record<string, string> = {
  modern: '🌿',
  professional: '💼',
  fresh: '🌸',
  minimal: '⚪',
  magazine: '🔥',
};

function formatDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface DashboardCardProps {
  product: UserProduct;
  onDelete: (id: string) => void;
  onRegenerate?: (product: UserProduct) => void;
}

export default function DashboardCard({ product, onDelete, onRegenerate }: DashboardCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeColors[product.productType] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {product.productType}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              {templateEmoji[product.templateId] || '📄'} {product.templateId}
            </span>
            <span className="text-xs text-gray-300">•</span>
            <span className="text-xs text-gray-400">{formatDate(product.createdAt)}</span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.productTitle}</h3>

          {/* Niche */}
          <p className="text-sm text-gray-500 truncate">
            <span className="text-gray-400">Niche:</span> {product.niche}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:shrink-0">
          {onRegenerate && (
            <button
              onClick={() => onRegenerate(product)}
              className="text-xs min-h-[32px] px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-800 transition-colors"
              title="Regenerate"
            >
              🔄 Regenerate
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('Delete this record?')) {
                onDelete(product.id);
              }
            }}
            className="text-xs min-h-[32px] px-3 py-1.5 bg-red-50 border border-red-100 text-red-500 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
            title="Delete"
          >
            🗑 Delete
          </button>
        </div>
      </div>
    </div>
  );
}
