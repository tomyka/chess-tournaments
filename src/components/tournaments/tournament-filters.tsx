"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TimeControlFilter } from "@/types/tournament";

interface TournamentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  timeControl: TimeControlFilter;
  onTimeControlChange: (value: TimeControlFilter) => void;
  dateStart: string | null;
  dateEnd: string | null;
  onDateRangeChange: (start: string | null, end: string | null) => void;
  onOpenMobileFilters?: () => void;
}

const timeControlOptions: { value: TimeControlFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "STANDARD", label: "St" },
  { value: "RAPID", label: "Rp" },
  { value: "BLITZ", label: "Bz" },
];

export function TournamentFilters({
  search,
  onSearchChange,
  timeControl,
  onTimeControlChange,
  dateStart,
  dateEnd,
  onDateRangeChange,
  onOpenMobileFilters,
}: TournamentFiltersProps) {
  const hasFilters = search || timeControl !== "ALL" || dateStart || dateEnd;

  return (
    <div className="space-y-3">
      {/* Search Bar - Always visible */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tournaments..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-9"
        />
      </div>

      {/* Compact Filter Row - Desktop only, with Mobile filter button */}
      <div className="flex gap-2 items-center flex-wrap">
        {/* Desktop filters - hidden on mobile */}
        <div className="hidden sm:flex gap-1.5 items-center">
          {timeControlOptions.map((option) => (
            <Badge
              key={option.value}
              variant={timeControl === option.value ? "default" : "outline"}
              className="cursor-pointer transition-all hover:scale-105 text-xs px-2 py-0.5"
              onClick={() => onTimeControlChange(option.value)}
            >
              {option.label}
            </Badge>
          ))}
        </div>

        {/* Desktop date inputs - hidden on mobile */}
        <div className="hidden sm:flex gap-1.5 items-end">
          <div className="flex gap-1 items-end">
            <input
              type="date"
              value={dateStart || ""}
              onChange={(e) =>
                onDateRangeChange(e.target.value || null, dateEnd)
              }
              className="h-9 text-sm border border-input rounded px-2 bg-background"
            />
            <input
              type="date"
              value={dateEnd || ""}
              onChange={(e) =>
                onDateRangeChange(dateStart, e.target.value || null)
              }
              className="h-9 text-sm border border-input rounded px-2 bg-background"
            />
          </div>
        </div>

        {/* Mobile filter button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenMobileFilters}
          className="sm:hidden h-9 gap-1"
        >
          Filters
        </Button>

        {/* Clear filters button - only show if filters active */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange("");
              onTimeControlChange("ALL");
              onDateRangeChange(null, null);
            }}
            className="h-9 gap-1 text-xs ml-auto"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
