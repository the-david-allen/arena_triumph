import type { CombatStats } from "@/lib/battle";

interface DebugWindowProps {
  stats: CombatStats | null;
}

export function DebugWindow({ stats }: DebugWindowProps) {
  if (!stats) return null;

  return (
    <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-4">
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
        Debug
      </h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">playerAttack</dt>
          <dd className="font-mono">{stats.playerAttack.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">numPlayerHits</dt>
          <dd className="font-mono">{stats.numPlayerHits.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">playerSwingDamage</dt>
          <dd className="font-mono">{stats.playerSwingDamage}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">playerDefense</dt>
          <dd className="font-mono">{stats.playerDefense.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">numBossHits</dt>
          <dd className="font-mono">{stats.numBossHits.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">bossSwingDamage</dt>
          <dd className="font-mono">{stats.bossSwingDamage}</dd>
        </div>
      </dl>
    </div>
  );
}
