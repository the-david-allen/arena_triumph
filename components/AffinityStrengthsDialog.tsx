"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchAllAffinities,
  fetchAffinityMatchups,
  type Affinity,
} from "@/lib/leggings-game";
import Image from "next/image";

const CDN_BASE_URL =
  "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities";

interface AffinityStrengthsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function buildMatchupTable(
  allAffinities: Affinity[],
  affinityMatchups: Map<string, Set<string>>
): Array<{ affinity: Affinity; strongAgainst: Affinity[]; weakAgainst: Affinity[] }> {
  const tableData: Array<{
    affinity: Affinity;
    strongAgainst: Affinity[];
    weakAgainst: Affinity[];
  }> = [];

  for (const affinity of allAffinities) {
    const strongAgainst: Affinity[] = [];
    const weakAgainst: Affinity[] = [];

    const strongAgainstSet = affinityMatchups.get(affinity.id);
    if (strongAgainstSet) {
      for (const strongId of strongAgainstSet) {
        const strongAffinity = allAffinities.find((a) => a.id === strongId);
        if (strongAffinity) strongAgainst.push(strongAffinity);
      }
    }

    for (const [otherId, otherStrongSet] of affinityMatchups.entries()) {
      if (otherStrongSet.has(affinity.id)) {
        const weakAffinity = allAffinities.find((a) => a.id === otherId);
        if (weakAffinity) weakAgainst.push(weakAffinity);
      }
    }

    tableData.push({ affinity, strongAgainst, weakAgainst });
  }
  return tableData;
}

export function AffinityStrengthsDialog({
  open,
  onOpenChange,
}: AffinityStrengthsDialogProps) {
  const [affinities, setAffinities] = React.useState<Affinity[]>([]);
  const [matchups, setMatchups] = React.useState<Map<string, Set<string>>>(
    new Map()
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    Promise.all([fetchAllAffinities(), fetchAffinityMatchups()])
      .then(([a, m]) => {
        setAffinities(a);
        setMatchups(m);
      })
      .catch((err) => {
        console.error("Failed to load affinities:", err);
        setError("Failed to load affinity data.");
      })
      .finally(() => setLoading(false));
  }, [open]);

  const tableData = React.useMemo(
    () => buildMatchupTable(affinities, matchups),
    [affinities, matchups]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Affinity Strengths</DialogTitle>
          <DialogDescription>
            Relationship between affinities
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {error && (
            <p className="text-danger text-sm">{error}</p>
          )}
          {loading && (
            <p className="text-muted-foreground text-sm">Loading…</p>
          )}
          {!loading && !error && tableData.length > 0 && (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="p-2 text-left text-text">Affinity</th>
                  <th className="p-2 pl-8 text-left text-text">Strong Against:</th>
                  <th className="p-2 pl-6 text-left text-text">Weak Against:</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row) => {
                  const affinityName = (
                    row.affinity.affinity_name as string
                  ).toLowerCase();
                  return (
                    <tr
                      key={row.affinity.id}
                      className="border-b border-border"
                    >
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Image
                            src={`${CDN_BASE_URL}/${affinityName}.jpg`}
                            alt={row.affinity.affinity_name as string}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded object-cover"
                            unoptimized
                          />
                          <span className="font-semibold text-text">
                            {row.affinity.affinity_name as string}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 pl-8 text-text">
                        {row.strongAgainst.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                            {row.strongAgainst.map((a) => {
                              const strongName = (
                                a.affinity_name as string
                              ).toLowerCase();
                              return (
                                <div
                                  key={a.id}
                                  className="flex w-28 shrink-0 items-center gap-1"
                                >
                                  <Image
                                    src={`${CDN_BASE_URL}/${strongName}.jpg`}
                                    alt={a.affinity_name as string}
                                    width={24}
                                    height={24}
                                    className="h-6 w-6 shrink-0 rounded object-cover"
                                    unoptimized
                                  />
                                  <span className="truncate">{a.affinity_name as string}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          "None"
                        )}
                      </td>
                      <td className="p-2 pl-6 text-text">
                        {row.weakAgainst.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                            {row.weakAgainst.map((a) => {
                              const weakName = (
                                a.affinity_name as string
                              ).toLowerCase();
                              return (
                                <div
                                  key={a.id}
                                  className="flex w-28 shrink-0 items-center gap-1"
                                >
                                  <Image
                                    src={`${CDN_BASE_URL}/${weakName}.jpg`}
                                    alt={a.affinity_name as string}
                                    width={24}
                                    height={24}
                                    className="h-6 w-6 shrink-0 rounded object-cover"
                                    unoptimized
                                  />
                                  <span className="truncate">{a.affinity_name as string}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          "None"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
