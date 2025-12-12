import React from 'react';
import { TagBadge } from './TagBadge';

interface LookCardProps {
  snapshotUrl: string | null;
  name: string;
  tags?: string[];
  likesCount?: number;
  bookmarksCount?: number;
  onClick?: () => void;
  footerSlot?: React.ReactNode;
  itemCount?: number;
  createdAt?: number;
  className?: string;
  children?: React.ReactNode;
}

export const LookCard: React.FC<LookCardProps> = ({ 
  snapshotUrl,
  name,
  tags = [],
  likesCount,
  bookmarksCount,
  onClick,
  footerSlot,
  itemCount,
  createdAt,
  className = '',
  children
}) => {
  // 카드 전체를 클릭 가능하게 만들기 위한 키보드 이벤트 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  const interactiveClass = onClick 
    ? 'cursor-pointer hover:shadow-md transition-shadow' 
    : '';

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`${name} 코디 상세보기`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${interactiveClass} ${className} w-full text-left`}
    >
      {/* Snapshot */}
      <div className="aspect-[3/4] bg-gray-100 relative">
        {snapshotUrl ? (
          <img 
            src={snapshotUrl} 
            alt={`${name} 코디 스냅샷`}
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            이미지 없음
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h4 className="font-bold text-gray-800 text-sm mb-2 truncate">
          {name}
        </h4>

        {/* children 영역: 내부 버튼 중첩 방지 및 별도 렌더링 */}
        {children && (
          <div className="mt-3 flex gap-2">
            {children}
          </div>
        )}

        {/* Stats */}
        {(likesCount !== undefined || bookmarksCount !== undefined || itemCount !== undefined) && (
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
            {likesCount !== undefined && <span>❤️ {likesCount}</span>}
            {bookmarksCount !== undefined && <span>🔖 {bookmarksCount}</span>}
            {itemCount !== undefined && <span>{itemCount} items</span>}
          </div>
        )}

        {/* Date */}
        {createdAt && (
          <div className="text-xs text-gray-400 mb-2">
            {new Date(createdAt).toLocaleDateString('ko-KR')}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-2">
            {tags.slice(0, 3).map((tag, idx) => (
              <TagBadge key={idx} label={tag} variant="default" />
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-gray-400">+{tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer Slot */}
        {footerSlot && (
          <div className="mt-3">
            {footerSlot}
          </div>
        )}
      </div>
    </article>
  );
};
