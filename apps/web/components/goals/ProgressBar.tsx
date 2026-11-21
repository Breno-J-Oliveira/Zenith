interface ProgressBarProps {
  progress: number;
  label: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-3)]"
      >
        <div
          className="h-full rounded-full bg-[var(--color-primary)] motion-safe:transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="min-w-[2.75rem] shrink-0 text-right font-mono text-xs text-dim" aria-hidden="true">
        {progress}%
      </span>
    </div>
  );
}
