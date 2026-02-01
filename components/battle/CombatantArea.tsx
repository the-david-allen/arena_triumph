import Image from "next/image";

interface CombatantAreaProps {
  imageUrl: string | null;
  name: string;
  currentHealth: number;
  maxHealth: number;
  isPlayer?: boolean;
}

export function CombatantArea({
  imageUrl,
  name,
  currentHealth,
  maxHealth,
  isPlayer = false,
}: CombatantAreaProps) {
  const healthPercent = maxHealth > 0 ? (currentHealth / maxHealth) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-stretch gap-2">
        <div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:w-40 md:w-48">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              unoptimized={imageUrl.startsWith("http")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              {isPlayer ? "You" : name}
            </div>
          )}
        </div>
        <div
          className="flex w-4 flex-col justify-end rounded bg-muted"
          role="progressbar"
          aria-valuenow={currentHealth}
          aria-valuemin={0}
          aria-valuemax={maxHealth}
          aria-label={`${name} health`}
        >
          <div
            className="w-full rounded bg-red-600 transition-all duration-300"
            style={{ height: `${Math.max(0, healthPercent)}%` }}
          />
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{name}</span>
    </div>
  );
}
