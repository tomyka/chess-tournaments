"use client";

import { useEffect, useState, useCallback } from "react";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { TournamentFilters } from "@/components/tournaments/tournament-filters";
import { TournamentListSkeleton } from "@/components/tournaments/tournament-skeleton";
import { TournamentCalendar } from "@/components/tournaments/tournament-calendar";
import { ViewToggle } from "@/components/tournaments/view-toggle";
import { FilterDrawer } from "@/components/tournaments/filter-drawer";
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

function getDefaultDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const nextNextSunday = new Date(today);
  const daysUntilSunday = (7 - today.getDay()) % 7 || 7;
  nextNextSunday.setDate(nextNextSunday.getDate() + daysUntilSunday + 7);
  const nextNextSundayStr = nextNextSunday.toISOString().split("T")[0];

  return { todayStr, nextNextSundayStr };
}

export default function TournamentsPage() {
  // Initialize with null to avoid hydration mismatch
  const [defaultDates, setDefaultDates] = useState<{ todayStr: string; nextNextSundayStr: string } | null>(null);
  
  const [data, setData] = useState<TournamentsResponse | null>(null);
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [timeControl, setTimeControl] = useState<TimeControlFilter>("ALL");
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "calendar">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Initialize dates after hydration
  useEffect(() => {
    const dates = getDefaultDates();
    setDefaultDates(dates);
    setDateStart(dates.todayStr);
    setDateEnd(dates.nextNextSundayStr);
  }, []);

  const todayStr = defaultDates?.todayStr || "";
  const nextNextSundayStr = defaultDates?.nextNextSundayStr || "";
  
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
      if (timeControl !== "ALL") params.set("timeControl", timeControl);
      if (dateStart) params.set("dateStart", dateStart);
      if (dateEnd) params.set("dateEnd", dateEnd);
      
      if (view === "calendar") {
        params.set("limit", "1000");
        params.set("page", "1");
      } else {
        params.set("page", pageNum.toString());
        params.set("limit", "18");
      }

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
  }, [search, timeControl, dateStart, dateEnd, view]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1);
      setAllTournaments([]);
    }, 300);
    return () => clearTimeout(debounce);
  }, [search, timeControl, dateStart, dateEnd, view]);

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
      setDateStart(start || todayStr);
      setDateEnd(end || nextNextSundayStr);
    },
    [todayStr, nextNextSundayStr]
  );

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setTimeControl("ALL");
    setDateStart(todayStr);
    setDateEnd(nextNextSundayStr);
  }, [todayStr, nextNextSundayStr]);

  const hasMore = data ? page < data.pagination.totalPages : false;
  const displayTournaments = view === "calendar" ? data?.tournaments || [] : allTournaments;

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          {/* Title & View Toggle */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" />
              <h1 className="text-2xl font-bold tracking-tight">Tournaments</h1>
            </div>
            <ViewToggle view={view} onViewChange={setView} />
          </div>

          {/* Filters */}
          <TournamentFilters
            search={search}
            onSearchChange={handleSearchChange}
            timeControl={timeControl}
            onTimeControlChange={handleTimeControlChange}
            dateStart={dateStart}
            dateEnd={dateEnd}
            onDateRangeChange={handleDateRangeChange}
            onOpenMobileFilters={() => setMobileFiltersOpen(true)}
          />
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <FilterDrawer
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        search={search}
        onSearchChange={handleSearchChange}
        timeControl={timeControl}
        onTimeControlChange={handleTimeControlChange}
        dateStart={dateStart}
        dateEnd={dateEnd}
        onDateRangeChange={handleDateRangeChange}
        onClearAll={handleClearFilters}
      />

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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
              {(search || timeControl !== "ALL") && (
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

            {view === "calendar" ? (
              <TournamentCalendar
                tournaments={displayTournaments}
                selectedDateStart={dateStart}
                selectedDateEnd={dateEnd}
                onDateRangeSelect={handleDateRangeChange}
              />
            ) : (
              <>
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
    </div>
  );
}
