import { Link } from 'react-router-dom';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  backTo?: string;
  backLabel?: string;
}

export default function ErrorState({
  message = '加载失败，请稍后重试',
  onRetry,
  backTo,
  backLabel = '返回',
}: ErrorStateProps) {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 px-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-center" style={{ color: 'var(--text-muted)' }}>
        {message}
      </p>
      <div className="flex gap-4">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 border hover:opacity-70 transition-opacity"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            重试
          </button>
        )}
        {backTo && (
          <Link to={backTo} className="text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>
            ← {backLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
