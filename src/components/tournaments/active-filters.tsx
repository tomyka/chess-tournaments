"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ActiveFiltersProps {
  search: string;
  timeControl: string;
  dateStart: string | null;
  dateEnd: string | null;
  onRemoveFilter: (filterType: string) => void;
  onClearAll: () => void;
}

export function ActiveFilters({
  search,
  timeControl,
  dateStart,
  dateEnd,
  onRemoveFilter,
  onClearAll,
}: ActiveFiltersProps) {
  const filters: Array<{ id: string; label: string; value: string }> = [];

  if (search) {
    filters.push({
      id: "search",
      label: "Search",
      value: search,
    });
  }

  if (timeControl !== "ALL") {
    filters.push({
      id: "timeControl",
      label: "Time Control",
      value: timeControl,
    });
  }

  if (dateStart) {
    // Format dates consistently without locale dependency
    const [, startMonth, startDay] = dateStart.split("-");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const startFormatted = `${monthNames[parseInt(startMonth, 10) - 1]} ${parseInt(startDay, 10)}`;
    
    let endFormatted = "today";
    if (dateEnd) {
      const [, endMonth, endDay] = dateEnd.split("-");
      endFormatted = `${monthNames[parseInt(endMonth, 10) - 1]} ${parseInt(endDay, 10)}`;
    }
    
    filters.push({
      id: "dateRange",
      label: "Date",
      value: `${startFormatted} – ${endFormatted}`,
    });
  }

  if (filters.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Active Filters</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 text-xs gap-1"
        >
          <X className="h-3 w-3" />
          Clear all
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Badge
            key={filter.id}
            variant="secondary"
            className="px-2.5 py-1 text-xs gap-1.5 cursor-pointer hover:bg-secondary/80 transition-colors"
          >
            <span>{filter.label}:</span>
            <span className="font-semibold">{filter.value}</span>
            <button
              onClick={() => onRemoveFilter(filter.id)}
              className="ml-1 hover:text-destructive"
              aria-label={`Remove ${filter.label} filter`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
