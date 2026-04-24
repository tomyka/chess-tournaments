"use client";

import { Input } from "@/components/ui/input";
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
  { value: "STANDARD" as const, label: "⏱ Standard" },
  { value: "RAPID" as const, label: "♟ Rapid" },
  { value: "BLITZ" as const, label: "⚡ Blitz" },
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
      {/* Search Bar */}
      <div className="relative w-full sm:w-48">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 text-sm border-gray-300 rounded-lg focus:ring-amber-600"
        />
      </div>

      {/* Time Control Filter Buttons - Modern Style */}
      <div className="flex gap-2 items-center flex-wrap">
        {timeControlOptions.map((option) => {
          const isActive = timeControl.includes(option.value);
          return (
            <button
              key={option.value}
              onClick={() => toggleType(option.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
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
  );
}
