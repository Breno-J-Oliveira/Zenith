export function ZenithMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 15.5 10 7.5 10 14.7 19 7" opacity="0.34" />
    <path d="M3 18 12 9 12 17 22 7" opacity="1" />
    <path d="M5 19 14 10.3 14 18 21 11" opacity="0.55" />
    </svg>
  );
}
