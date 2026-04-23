"use client";

import { useEffect, useState, useCallback } from "react";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { TournamentFilters } from "@/components/tournaments/tournament-filters";
import { TournamentListSkeleton } from "@/components/tournaments/tournament-skeleton";
import { DatePickerV2 } from "@/components/tournaments/date-picker-v2";
import { LoadMoreButton } from "@/components/tournaments/load-more-button";
import { Button } from "@/components/ui/button";
import { X, Trophy } from "lucide-react";
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

type SortOption = "date-asc" | "date-desc" | "rating-desc" | "players-desc";

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
  const [sortBy, setSortBy] = useState<SortOption>("date-asc");
  
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

      // Apply sorting
      const sorted = sortTournaments([...json.tournaments], sortBy);

      if (isFirstPage) {
        setData(json);
        setAllTournaments(sorted);
      } else {
        setAllTournaments((prev) => {
          const combined = [...prev, ...sorted];
          return sortTournaments(combined, sortBy);
        });
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
  }, [search, timeControl, dateStart, dateEnd, sortBy]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1);
      setAllTournaments([]);
    }, 300);
    return () => clearTimeout(debounce);
  }, [search, timeControl, dateStart, dateEnd, sortBy]);

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
    setTimeControl(["STANDARD", "RAPID", "BLITZ"]);
    setDateStart("");
    setDateEnd("");
  }, []);

  const hasMore = data ? page < data.pagination.totalPages : false;
  const displayTournaments = allTournaments;

  // Calculate status breakdown
  const statusBreakdown = {
    upcoming: displayTournaments.filter((t) => t.status === "NOT_STARTED").length,
    inProgress: displayTournaments.filter((t) => t.status === "IN_PROGRESS").length,
    finished: displayTournaments.filter((t) => t.status === "FINISHED").length,
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            {/* Title */}
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="h-8 w-8 text-amber-500" />
              <h1 className="text-3xl font-bold text-gray-900">
                Chess Tournaments in Lithuania
              </h1>
            </div>

            {/* Filter Section */}
            <div className="space-y-3">
              {/* Search and main filters */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex-1 sm:flex-none">
                  <TournamentFilters
                    search={search}
                    onSearchChange={handleSearchChange}
                    timeControl={timeControl}
                    onTimeControlChange={handleTimeControlChange}
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <DatePickerV2
                    selectedDateStart={dateStart}
                    selectedDateEnd={dateEnd}
                    onDateRangeSelect={handleDateRangeChange}
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="h-9 px-3 text-sm border border-gray-200 rounded-md bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="date-asc">Date (Soon)</option>
                    <option value="date-desc">Date (Recent)</option>
                    <option value="rating-desc">Rating (High)</option>
                    <option value="players-desc">Players (Most)</option>
                  </select>
                </div>
              </div>

              {/* Active filters pills */}
              {(search || timeControl.length < 3 || dateStart || sortBy !== "date-asc") && (
                <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-gray-100">
                  {search && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                      Search: {search}
                      <button
                        onClick={() => setSearch("")}
                        className="hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {timeControl.length < 3 && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                      {timeControl.join(", ")}
                      <button
                        onClick={() =>
                          setTimeControl(["STANDARD", "RAPID", "BLITZ"])
                        }
                        className="hover:text-purple-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {(dateStart || dateEnd) && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                      {dateStart && dateEnd
                        ? `${dateStart} - ${dateEnd}`
                        : dateStart || dateEnd}
                      <button
                        onClick={() => {
                          setDateStart("");
                          setDateEnd("");
                        }}
                        className="hover:text-green-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {sortBy !== "date-asc" && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs rounded-full">
                      Sort: {getSortLabel(sortBy)}
                      <button
                        onClick={() => setSortBy("date-asc")}
                        className="hover:text-amber-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
        {loading ? (
          <TournamentListSkeleton />
        ) : displayTournaments.length > 0 ? (
          <>
            {/* Results summary with breakdown */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
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
                <p className="text-xs text-muted-foreground mt-1">
                  {statusBreakdown.upcoming > 0 && (
                    <span className="inline-block mr-3">
                      <span className="font-semibold">{statusBreakdown.upcoming}</span> Upcoming
                    </span>
                  )}
                  {statusBreakdown.inProgress > 0 && (
                    <span className="inline-block mr-3">
                      <span className="font-semibold">{statusBreakdown.inProgress}</span> In Progress
                    </span>
                  )}
                  {statusBreakdown.finished > 0 && (
                    <span className="inline-block">
                      <span className="font-semibold">{statusBreakdown.finished}</span> Finished
                    </span>
                  )}
                </p>
              </div>
              {(search || timeControl.length < 3 || dateStart || dateEnd) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="w-full sm:w-auto"
                >
                  Clear all filters
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

function sortTournaments(tournaments: Tournament[], sortBy: SortOption): Tournament[] {
  const sorted = [...tournaments];
  
  switch (sortBy) {
    case "date-desc":
      return sorted.sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateB - dateA;
      });
    case "rating-desc":
      return sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    case "players-desc":
      return sorted.sort((a, b) => (b.playerCount || 0) - (a.playerCount || 0));
    case "date-asc":
    default:
      return sorted.sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : Infinity;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : Infinity;
        return dateA - dateB;
      });
  }
}

function getSortLabel(sortBy: SortOption): string {
  const labels: Record<SortOption, string> = {
    "date-asc": "Date (Soon)",
    "date-desc": "Date (Recent)",
    "rating-desc": "Rating (High)",
    "players-desc": "Players (Most)",
  };
  return labels[sortBy];
}
