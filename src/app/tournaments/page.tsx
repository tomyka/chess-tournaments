"use client";

import { useEffect, useState, useCallback } from "react";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { TournamentFilters } from "@/components/tournaments/tournament-filters";
import { TournamentListSkeleton } from "@/components/tournaments/tournament-skeleton";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import type {
  Tournament,
  TimeControlFilter,
  StatusFilter,
} from "@/types/tournament";

interface TournamentsResponse {
  tournaments: Tournament[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function TournamentsPage() {
  const [data, setData] = useState<TournamentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [timeControl, setTimeControl] = useState<TimeControlFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (timeControl !== "ALL") params.set("timeControl", timeControl);
      if (status !== "ALL") params.set("status", status);
      params.set("page", page.toString());
      params.set("limit", "18");

      const res = await fetch(`/api/tournaments?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to load tournaments:", error);
    } finally {
      setLoading(false);
    }
  }, [search, timeControl, status, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchTournaments, 300);
    return () => clearTimeout(debounce);
  }, [fetchTournaments]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleTimeControlChange = useCallback((value: TimeControlFilter) => {
    setTimeControl(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: StatusFilter) => {
    setStatus(value);
    setPage(1);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-7 w-7 text-amber-500" />
          <h1 className="text-3xl font-bold tracking-tight">Tournaments</h1>
        </div>
        <p className="text-muted-foreground">
          Browse FIDE-registered chess tournaments in Lithuania
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <TournamentFilters
          search={search}
          onSearchChange={handleSearchChange}
          timeControl={timeControl}
          onTimeControlChange={handleTimeControlChange}
          status={status}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Results */}
      {loading ? (
        <TournamentListSkeleton />
      ) : data && data.tournaments.length > 0 ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            Showing {data.tournaments.length} of {data.pagination.total}{" "}
            tournaments
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.tournaments.map((tournament, index) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                index={index}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Trophy className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold">No tournaments found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your filters or search term.
          </p>
        </div>
      )}
    </div>
  );
}
