"use client";

import { useEffect, useState, useCallback } from "react";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { TournamentFilters } from "@/components/tournaments/tournament-filters";
import { TournamentListSkeleton } from "@/components/tournaments/tournament-skeleton";
import { TournamentCalendar } from "@/components/tournaments/tournament-calendar";
import { ViewToggle } from "@/components/tournaments/view-toggle";
import { ResultsCounter } from "@/components/tournaments/results-counter";
import { ActiveFilters } from "@/components/tournaments/active-filters";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react";
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

function getDefaultDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // Calculate next next Sunday
  const nextNextSunday = new Date(today);
  const daysUntilSunday = (7 - today.getDay()) % 7 || 7; // Days until next Sunday
  nextNextSunday.setDate(nextNextSunday.getDate() + daysUntilSunday + 7); // Add another week for "next next"
  const nextNextSundayStr = nextNextSunday.toISOString().split("T")[0];

  return { todayStr, nextNextSundayStr };
}

export default function TournamentsPage() {
  const { todayStr, nextNextSundayStr } = getDefaultDates();
  
  const [data, setData] = useState<TournamentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [timeControl, setTimeControl] = useState<TimeControlFilter>("ALL");
  const [dateStart, setDateStart] = useState<string>(todayStr);
  const [dateEnd, setDateEnd] = useState<string>(nextNextSundayStr);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "calendar">("grid");

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (timeControl !== "ALL") params.set("timeControl", timeControl);
      if (dateStart) params.set("dateStart", dateStart);
      if (dateEnd) params.set("dateEnd", dateEnd);
      
      // For calendar view, fetch all tournaments; for grid, use pagination
      if (view === "calendar") {
        params.set("limit", "1000");
        params.set("page", "1");
      } else {
        params.set("page", page.toString());
        params.set("limit", "18");
      }

      const res = await fetch(`/api/tournaments?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to load tournaments:", error);
    } finally {
      setLoading(false);
    }
  }, [search, timeControl, dateStart, dateEnd, page, view]);

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

  const handleDateRangeChange = useCallback(
    (start: string | null, end: string | null) => {
      setDateStart(start || todayStr);
      setDateEnd(end || nextNextSundayStr);
      setPage(1);
    },
    [todayStr, nextNextSundayStr]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header with View Toggle */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-7 w-7 text-amber-500" />
            <h1 className="text-3xl font-bold tracking-tight">Tournaments</h1>
          </div>
          <p className="text-muted-foreground">
            Browse FIDE-registered chess tournaments in Lithuania
          </p>
        </div>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {/* Filters Above Cards */}
      <div className="mb-8">
        <TournamentFilters
          search={search}
          onSearchChange={handleSearchChange}
          timeControl={timeControl}
          onTimeControlChange={handleTimeControlChange}
          dateStart={dateStart}
          dateEnd={dateEnd}
          onDateRangeChange={handleDateRangeChange}
        />
      </div>

      {/* Results Counter */}
      <ResultsCounter
        found={data?.tournaments.length || 0}
        total={data?.pagination.total || 0}
        isFiltered={!!search || timeControl !== "ALL"}
      />

      {/* Active Filters Summary */}
      <ActiveFilters
        search={search}
        timeControl={timeControl}
        dateStart={dateStart}
        dateEnd={dateEnd}
        onRemoveFilter={(filterType) => {
          if (filterType === "search") handleSearchChange("");
          else if (filterType === "timeControl") handleTimeControlChange("ALL");
          else if (filterType === "dateRange") handleDateRangeChange(null, null);
        }}
        onClearAll={() => {
          handleSearchChange("");
          handleTimeControlChange("ALL");
          handleDateRangeChange(null, null);
        }}
      />

      {/* Results */}
      {loading ? (
        <TournamentListSkeleton />
      ) : data && data.tournaments.length > 0 ? (
        <>
          {view === "calendar" ? (
            <TournamentCalendar
              tournaments={data.tournaments}
              selectedDateStart={dateStart}
              selectedDateEnd={dateEnd}
              onDateRangeSelect={handleDateRangeChange}
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.tournaments.map((tournament, index) => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    index={index}
                  />
                ))}
              </div>

              {/* Sticky Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="sticky bottom-0 z-10 mt-8 rounded-lg bg-background/80 backdrop-blur-sm border border-border p-4 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground font-medium">
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
