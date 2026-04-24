"use client";

import { useEffect, useState, useCallback } from "react";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { TournamentFilters } from "@/components/tournaments/tournament-filters";
import { TournamentListSkeleton } from "@/components/tournaments/tournament-skeleton";
import { DatePickerV2 } from "@/components/tournaments/date-picker-v2";
import { CountryFilter } from "@/components/tournaments/country-filter";
import { FilterDrawer } from "@/components/tournaments/filter-drawer";
import { LoadMoreButton } from "@/components/tournaments/load-more-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Trophy, SlidersHorizontal } from "lucide-react";
import type {
  Tournament,
  TimeControlFilter,
  CountryFilter as CountryFilterType,
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
  const [country, setCountry] = useState<CountryFilterType>(["Lithuania", "Latvia"]);
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("date-asc");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  
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
      if (country.length > 0) params.set("country", country.join(","));
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
  }, [search, timeControl, country, dateStart, dateEnd, sortBy]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1);
      setAllTournaments([]);
    }, 300);
    return () => clearTimeout(debounce);
  }, [search, timeControl, country, dateStart, dateEnd, sortBy]);

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
    setCountry(["Lithuania", "Latvia"]);
    setDateStart("");
    setDateEnd("");
  }, []);

  const hasMore = data ? page < data.pagination.totalPages : false;
  const displayTournaments = allTournaments;

  // Build active-filter summary for mobile bar
  const timeControlLabels: Record<string, string> = { STANDARD: "Standard", RAPID: "Rapid", BLITZ: "Blitz" };
  const filterSummaryParts = [
    timeControl.length < 3 ? timeControl.map((t) => timeControlLabels[t]).join(", ") : null,
    country.length < 2 ? country.join(", ") : null,
    dateStart ? new Date(dateStart).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : null,
    sortBy !== "date-asc" ? getSortLabel(sortBy) : null,
  ].filter(Boolean);
  const filterSummary = filterSummaryParts.join(" · ");
  const hasActiveFilters = filterSummaryParts.length > 0 || search;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Mobile Filter Drawer */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        timeControl={timeControl}
        onTimeControlChange={handleTimeControlChange}
        country={country}
        onCountryChange={setCountry}
        dateStart={dateStart}
        dateEnd={dateEnd}
        onDateRangeChange={handleDateRangeChange}
        sortBy={sortBy}
        onSortByChange={(v) => setSortBy(v as SortOption)}
        onClearAll={handleClearFilters}
      />

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">

          {/* ── Mobile layout (hidden on sm+) ── */}
          <div className="flex flex-col gap-2 sm:hidden">
            {/* Full-width search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search tournaments..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-11 text-sm w-full"
              />
            </div>

            {/* Filter summary bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 text-sm text-gray-500 truncate">
                <span className="text-gray-400">Filters: </span>
                {filterSummary || "All"}
              </div>
              <button
                onClick={() => setFilterDrawerOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors whitespace-nowrap ${
                  hasActiveFilters
                    ? "border-amber-600 bg-amber-600 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
              </button>
            </div>
          </div>

          {/* ── Desktop layout (hidden on mobile) ── */}
          <div className="hidden sm:flex flex-col gap-3">
            <div className="flex flex-row gap-3 items-center flex-wrap">
              <TournamentFilters
                search={search}
                onSearchChange={handleSearchChange}
                timeControl={timeControl}
                onTimeControlChange={handleTimeControlChange}
              />
              <div className="hidden sm:block h-6 w-px bg-gray-200" />
              <CountryFilter selected={country} onChange={setCountry} />
              <div className="hidden sm:block h-6 w-px bg-gray-200" />
              <DatePickerV2
                selectedDateStart={dateStart}
                selectedDateEnd={dateEnd}
                onDateRangeSelect={handleDateRangeChange}
              />
              <div className="hidden sm:block h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2 sm:ml-auto">
                <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="h-9 px-3 text-sm border border-gray-200 rounded-md bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                >
                  <option value="date-asc">Upcoming First</option>
                  <option value="date-desc">Recent First</option>
                  <option value="rating-desc">Highest Rating</option>
                  <option value="players-desc">Most Players</option>
                </select>
              </div>
            </div>

            {/* Active filter pills (desktop) — simplified to match mobile */}
            {(search || timeControl.length < 3 || country.length < 2 || dateStart || sortBy !== "date-asc") && (
              <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-gray-100">
                {search && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 transition-colors">
                    🔍 {search}
                    <button onClick={() => setSearch("")} className="ml-1 text-gray-500 hover:text-gray-900">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {timeControl.length < 3 && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 transition-colors">
                    {timeControl.map((t) => ({STANDARD: "⏱", RAPID: "♟", BLITZ: "⚡"}[t])).join("")} {timeControl.join(", ")}
                    <button onClick={() => setTimeControl(["STANDARD", "RAPID", "BLITZ"])} className="ml-1 text-gray-500 hover:text-gray-900">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {country.length < 2 && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 transition-colors">
                    🌍 {country.join(", ")}
                    <button onClick={() => setCountry(["Lithuania", "Latvia"])} className="ml-1 text-gray-500 hover:text-gray-900">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {(dateStart || dateEnd) && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 transition-colors">
                    📅 {dateStart && dateEnd ? `${dateStart} - ${dateEnd}` : dateStart || dateEnd}
                    <button onClick={() => { setDateStart(""); setDateEnd(""); }} className="ml-1 text-gray-500 hover:text-gray-900">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {sortBy !== "date-asc" && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 transition-colors">
                    ↑ {getSortLabel(sortBy)}
                    <button onClick={() => setSortBy("date-asc")} className="ml-1 text-gray-500 hover:text-gray-900">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8 w-full">
        {loading ? (
          <TournamentListSkeleton />
        ) : displayTournaments.length > 0 ? (
          <>
            {(search || timeControl.length < 3 || country.length < 2 || dateStart || dateEnd) && (
              <div className="mb-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear all filters
                </Button>
              </div>
            )}

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {displayTournaments.map((tournament, index) => (
                <TournamentCard key={tournament.id} tournament={tournament} index={index} />
              ))}
            </div>

            <LoadMoreButton onClick={handleLoadMore} isLoading={loadingMore} hasMore={hasMore} />
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
    "date-asc": "Upcoming First",
    "date-desc": "Recent First",
    "rating-desc": "Highest Rating",
    "players-desc": "Most Players",
  };
  return labels[sortBy];
}
