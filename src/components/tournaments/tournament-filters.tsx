"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./date-range-picker";
import type { TimeControlFilter } from "@/types/tournament";

interface TournamentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  timeControl: TimeControlFilter;
  onTimeControlChange: (value: TimeControlFilter) => void;
  dateStart: string | null;
  dateEnd: string | null;
  onDateRangeChange: (start: string | null, end: string | null) => void;
}

const timeControlOptions: { value: TimeControlFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "STANDARD", label: "Standard" },
  { value: "RAPID", label: "Rapid" },
  { value: "BLITZ", label: "Blitz" },
];

export function TournamentFilters({
  search,
  onSearchChange,
  timeControl,
  onTimeControlChange,
  dateStart,
  dateEnd,
  onDateRangeChange,
}: TournamentFiltersProps) {
  const hasFilters = search || timeControl !== "ALL" || dateStart || dateEnd;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tournaments by name or city..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-6">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Time Control
          </p>
          <div className="flex flex-wrap gap-1.5">
            {timeControlOptions.map((option) => (
              <Badge
                key={option.value}
                variant={timeControl === option.value ? "default" : "outline"}
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() => onTimeControlChange(option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        startDate={dateStart}
        endDate={dateEnd}
        onDateRangeChange={onDateRangeChange}
      />

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onSearchChange("");
            onTimeControlChange("ALL");
            onDateRangeChange(null, null);
          }}
          className="text-xs"
        >
          <X className="mr-1 h-3 w-3" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
