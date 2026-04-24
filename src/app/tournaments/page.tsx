"use client";

import { useEffect, useState, useCallback } from "react";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { TournamentListSkeleton } from "@/components/tournaments/tournament-skeleton";
import { FilterDrawer } from "@/components/tournaments/filter-drawer";
import { LoadMoreButton } from "@/components/tournaments/load-more-button";
import { TournamentFilters } from "@/components/tournaments/tournament-filters";
import { CountryFilter } from "@/components/tournaments/country-filter";
import { DatePickerV2 } from "@/components/tournaments/date-picker-v2";
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

      {/* Sticky Header - Responsive layout */}
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          {/* Mobile layout: search + filter drawer */}
          <div className="lg:hidden flex flex-col gap-2">
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

            {/* Filter summary bar + Filters button */}
            <div className="flex items-center gap-2">
              <div className="flex-1 text-sm text-gray-500 truncate">
                <span className="text-gray-400">Filters: </span>
                {filterSummary || "All"}
              </div>
              <button
                onClick={() => setFilterDrawerOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors whitespace-nowrap ${
                  hasActiveFilters
                    ? "border-amber-600 bg-amber-600 text-white shadow-md"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
              </button>
            </div>
          </div>

          {/* Desktop layout: inline filters next to search */}
          <div className="hidden lg:block">
            {/* Search + Inline filters on one compact row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search tournaments..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 h-10 text-sm w-full"
                />
              </div>

              {/* Time Control Filter - Fixed width badges */}
              <div className="flex gap-1.5">
                {[
                  { value: "STANDARD" as const, label: "⏱" },
                  { value: "RAPID" as const, label: "♟" },
                  { value: "BLITZ" as const, label: "⚡" },
                ].map((option) => {
                  const isActive = timeControl.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        const newValue = isActive
                          ? timeControl.filter((t) => t !== option.value)
                          : [...timeControl, option.value];
                        setTimeControl(newValue);
                      }}
                      title={option.value}
                      className={`w-10 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-amber-600 text-white shadow-md hover:shadow-lg hover:bg-amber-700 active:shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 shadow-sm hover:shadow-md"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {/* Country Filter */}
              <div className="flex gap-1.5">
                {[
                  { value: "Lithuania" as const, label: "🇱🇹" },
                  { value: "Latvia" as const, label: "🇱🇻" },
                ].map((option) => {
                  const isSelected = country.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        const newSelected = isSelected
                          ? country.filter((c) => c !== option.value)
                          : [...country, option.value];
                        setCountry(newSelected);
                      }}
                      title={option.value}
                      className={`px-2 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isSelected
                          ? "bg-amber-600 text-white shadow-md hover:shadow-lg hover:bg-amber-700 active:shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 shadow-sm hover:shadow-md"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {/* Date Range Picker */}
              <div className="flex-shrink-0">
                <DatePickerV2
                  selectedDateStart={dateStart}
                  selectedDateEnd={dateEnd}
                  onDateRangeSelect={handleDateRangeChange}
                />
              </div>

              {/* Sort By */}
              <div className="flex gap-1.5">
                {[
                  { value: "date-asc" as const, label: "📅 Upcoming" },
                  { value: "date-desc" as const, label: "📅 Recent" },
                  { value: "players-desc" as const, label: "👥 Most" },
                ].map((option) => {
                  const isActive = sortBy === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      title={option.value}
                      className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                        isActive
                          ? "bg-amber-600 text-white shadow-md hover:shadow-lg hover:bg-amber-700 active:shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 shadow-sm hover:shadow-md"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
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
