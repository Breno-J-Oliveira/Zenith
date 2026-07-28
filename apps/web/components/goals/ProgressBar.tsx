interface ProgressBarProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

export function ProgressBar({ progress, size = 'sm', showLabel = true, animated = true }: ProgressBarProps) {
  const heightClass = size === 'lg' ? 'h-3' : size === 'md' ? 'h-2.5' : 'h-2';
  
  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 ${heightClass} bg-[var(--color-bg)] rounded-full overflow-hidden border border-[var(--border-subtle)]`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] ${
            animated ? 'transition-all duration-500 ease-out' : ''
          } ${progress > 0 ? 'glow-subtle' : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-xs text-muted shrink-0 min-w-[2.5rem] text-right">
          {progress}%
        </span>
      )}
    </div>
  );
}