import React, { useState, useEffect, useCallback } from 'react';
import { PlanComment, formatCommentTimestamp } from '../domain/plan';
import { PlanRepository } from '../services/planRepository';
import { Send } from 'lucide-react';

export interface DishDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dishName: string;
  dishTag?: string;
  planItemId: string;
  householdCode: string;
  nickname: string;
  planRepository: PlanRepository;
}

export const DishDetailDrawer: React.FC<DishDetailDrawerProps> = ({
  isOpen,
  onClose,
  dishName,
  dishTag,
  planItemId,
  householdCode,
  nickname,
  planRepository,
}) => {
  const [comments, setComments] = useState<PlanComment[]>([]);
  const [commentText, setCommentText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadComments = useCallback(async () => {
    if (!householdCode || !planItemId) {
      setComments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const fetched = await planRepository.getComments(householdCode, planItemId);
      setComments(fetched);
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  }, [householdCode, planItemId, planRepository]);

  useEffect(() => {
    if (isOpen) {
      loadComments();
      setCommentText(''); // Guarantee blank on open
    }
  }, [isOpen, loadComments]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = commentText.trim();
    const author = nickname.trim();
    if (!trimmed || !author || isSubmitting || !householdCode || !planItemId) return;

    try {
      setIsSubmitting(true);
      const created = await planRepository.addComment(householdCode, planItemId, author, trimmed);
      setComments((prev) => [...prev, created]);
      setCommentText('');
    } catch {
      // Ignored
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="dish-detail-drawer"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết Món ăn ${dishName}`}
    >
      <div
        className="w-full max-w-[420px] mx-auto bg-white rounded-t-[32px] p-5 pt-3 shadow-2xl max-h-[85%] flex flex-col border-t border-slate-100 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3" />

        {/* Minimalist Header: Dish Name & Tag */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 data-testid="detail-dish-name" className="text-base font-bold text-[#334E68]">
              {dishName}
            </h3>
            {dishTag && (
              <span
                data-testid="detail-dish-tag"
                className="text-[10px] px-2 py-0.5 rounded-md bg-[#FEF7DC] text-[#334E68] border border-[#EFE4B5] font-semibold"
              >
                {dishTag}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            data-testid="close-dish-detail-btn"
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-xs transition"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Conversation Thread / Comments List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 min-h-[140px] max-h-[280px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-[#5B7C99] border-t-transparent animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div
              data-testid="empty-comments-msg"
              className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center"
            >
              <p className="font-medium text-slate-500">Chưa có dặn dò nào cho Món ăn này</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                data-testid={`comment-item-${comment.id}`}
                className="bg-slate-50 border border-slate-100/80 rounded-2xl p-3 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span data-testid="comment-author" className="font-bold text-[#334E68]">
                    {comment.authorNickname}
                  </span>
                  <span data-testid="comment-time" className="text-[10px] text-slate-400">
                    {formatCommentTimestamp(comment.createdAt)}
                  </span>
                </div>
                <p
                  data-testid="comment-content"
                  className="text-xs text-slate-700 whitespace-pre-wrap break-words leading-relaxed"
                >
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Blank Comment Input Area */}
        <form onSubmit={handleSend} className="pt-2 border-t border-slate-100">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-[#5B7C99] focus-within:bg-white transition">
            <textarea
              data-testid="comment-input"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={2}
              placeholder="Dặn dò cách nấu, chuẩn bị nguyên liệu..."
              className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none p-1"
            />
            <button
              type="submit"
              data-testid="send-comment-btn"
              disabled={!commentText.trim() || !nickname.trim() || isSubmitting}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition active:scale-95 flex-shrink-0 ${
                commentText.trim() && nickname.trim() && !isSubmitting
                  ? 'bg-[#5B7C99] hover:bg-[#46637D] text-white shadow-sm'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              aria-label="Gửi dặn dò"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
