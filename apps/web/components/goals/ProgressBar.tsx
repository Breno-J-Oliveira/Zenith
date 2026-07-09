interface ProgressBarProps {
  progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="font-mono text-xs text-dim shrink-0">{progress}%</span>
    </div>
  );
}
