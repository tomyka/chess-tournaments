"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import type { TimeControlFilter } from "@/types/tournament";

interface TournamentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  timeControl: TimeControlFilter;
  onTimeControlChange: (value: TimeControlFilter) => void;
  onOpenMobileFilters?: () => void;
}

const timeControlOptions = [
  { value: "STANDARD" as const, label: "Standard" },
  { value: "RAPID" as const, label: "Rapid" },
  { value: "BLITZ" as const, label: "Blitz" },
];

export function TournamentFilters({
  search,
  onSearchChange,
  timeControl,
  onTimeControlChange,
}: TournamentFiltersProps) {
  const toggleType = (type: "STANDARD" | "RAPID" | "BLITZ") => {
    const newValue = timeControl.includes(type)
      ? timeControl.filter((t) => t !== type)
      : [...timeControl, type];
    onTimeControlChange(newValue);
  };

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

      {/* Time Control Filter Buttons */}
      <div className="flex gap-2 items-center flex-wrap">
        {timeControlOptions.map((option) => (
          <Badge
            key={option.value}
            variant={timeControl.includes(option.value) ? "default" : "outline"}
            className="cursor-pointer transition-all hover:scale-105 text-xs px-2 py-0.5 h-9 flex items-center"
            onClick={() => toggleType(option.value)}
          >
            {option.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
