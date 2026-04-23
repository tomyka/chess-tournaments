"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TimeControlFilter } from "@/types/tournament";

interface TournamentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  timeControl: TimeControlFilter;
  onTimeControlChange: (value: TimeControlFilter) => void;
  onOpenMobileFilters?: () => void;
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
}: TournamentFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
      {/* Search Bar - Narrow */}
      <div className="relative w-full sm:w-48">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-9 text-sm"
        />
      </div>

      {/* Time Control Filters */}
      <div className="flex gap-2 items-center flex-wrap">
        {timeControlOptions.map((option) => (
          <Badge
            key={option.value}
            variant={timeControl === option.value ? "default" : "outline"}
            className="cursor-pointer transition-all hover:scale-105 text-xs px-2 py-0.5 h-9 flex items-center"
            onClick={() => onTimeControlChange(option.value)}
          >
            {option.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
