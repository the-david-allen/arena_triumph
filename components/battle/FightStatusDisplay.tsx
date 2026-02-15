interface FightStatusDisplayProps {
  statusText: string;
}

export function FightStatusDisplay({ statusText }: FightStatusDisplayProps) {
  return (
    <div className="w-full rounded-lg border border-border bg-card px-4 py-3">
      <p
        className="text-center font-semibold text-foreground"
        aria-live="polite"
      >
        {statusText}
      </p>
    </div>
  );
}
