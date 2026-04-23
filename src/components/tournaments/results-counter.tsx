"use client";

import { Info } from "lucide-react";

interface ResultsCounterProps {
  found: number;
  total: number;
  isFiltered: boolean;
}

export function ResultsCounter({
  found,
  total,
  isFiltered,
}: ResultsCounterProps) {
  if (!found && !total) return null;

  return (
    <div className="mb-6 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 flex items-start gap-3">
      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-semibold text-blue-900 dark:text-blue-100">
          {found === 0 ? (
            <>
              No tournaments found
              {isFiltered && " matching your criteria"}
            </>
          ) : found === 1 ? (
            <>
              <span className="font-bold">{found}</span> tournament found
              {isFiltered && " matching your filters"}
            </>
          ) : (
            <>
              <span className="font-bold">{found}</span> tournaments found
              {isFiltered && " matching your filters"}
              {total !== found && ` (${total} total)`}
            </>
          )}
        </p>
        {isFiltered && found > 0 && (
          <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
            {found} of {total} tournaments
          </p>
        )}
      </div>
    </div>
  );
}
