"use client";

import { useEffect, useState, useCallback } from "react";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { TournamentFilters } from "@/components/tournaments/tournament-filters";
import { TournamentListSkeleton } from "@/components/tournaments/tournament-skeleton";
import { DatePickerV2 } from "@/components/tournaments/date-picker-v2";
import { LoadMoreButton } from "@/components/tournaments/load-more-button";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import type {
  Tournament,
  TimeControlFilter,
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
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [timeControl, setTimeControl] = useState<TimeControlFilter>([
    "STANDARD",
    "RAPID",
    "BLITZ",
  ]);
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");
  const [page, setPage] = useState(1);
  
  const fetchTournaments = useCallback(async (pageNum: number = 1) => {
    const isFirstPage = pageNum === 1;
    if (isFirstPage) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (timeControl.length > 0) params.set("timeControl", timeControl.join(","));
      if (dateStart) params.set("dateStart", dateStart);
      if (dateEnd) params.set("dateEnd", dateEnd);
      
      params.set("page", pageNum.toString());
      params.set("limit", "18");

      const res = await fetch(`/api/tournaments?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();

      if (isFirstPage) {
        setData(json);
        setAllTournaments(json.tournaments);
      } else {
        setAllTournaments((prev) => [...prev, ...json.tournaments]);
        setData(json);
      }
    } catch (error) {
      console.error("Failed to load tournaments:", error);
    } finally {
      if (isFirstPage) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [search, timeControl, dateStart, dateEnd]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1);
      setAllTournaments([]);
    }, 300);
    return () => clearTimeout(debounce);
  }, [search, timeControl, dateStart, dateEnd]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchTournaments(1);
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchTournaments]);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTournaments(nextPage);
  }, [page, fetchTournaments]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleTimeControlChange = useCallback((value: TimeControlFilter) => {
    setTimeControl(value);
  }, []);

  const handleDateRangeChange = useCallback(
    (start: string | null, end: string | null) => {
      setDateStart(start || "");
      setDateEnd(end || "");
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setTimeControl([]);
  }, []);

  const hasMore = data ? page < data.pagination.totalPages : false;
  const displayTournaments = allTournaments;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Title */}
          <div className="py-6">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="h-8 w-8 text-amber-500" />
              <h1 className="text-3xl font-bold text-gray-900">
                Chess Tournaments in Lithuania
              </h1>
            </div>

            {/* All Filters in One Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <TournamentFilters
                search={search}
                onSearchChange={handleSearchChange}
                timeControl={timeControl}
                onTimeControlChange={handleTimeControlChange}
              />

              <DatePickerV2
                selectedDateStart={dateStart}
                selectedDateEnd={dateEnd}
                onDateRangeSelect={handleDateRangeChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <TournamentListSkeleton />
        ) : displayTournaments.length > 0 ? (
          <>
            {/* Results summary */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {displayTournaments.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {data?.pagination.total || 0}
                </span>{" "}
                tournaments
              </p>
              {(search || timeControl.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-8 text-xs"
                >
                  Clear filters
                </Button>
              )}
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {displayTournaments.map((tournament, index) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  index={index}
                />
              ))}
            </div>

            <LoadMoreButton
              onClick={handleLoadMore}
              isLoading={loadingMore}
              hasMore={hasMore}
            />
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
    </div>
  );
}
