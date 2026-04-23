"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleType = (type: "STANDARD" | "RAPID" | "BLITZ") => {
    const newValue = timeControl.includes(type)
      ? timeControl.filter((t) => t !== type)
      : [...timeControl, type];
    onTimeControlChange(newValue);
  };

  const getDisplayLabel = () => {
    if (timeControl.length === 0) return "Laiko kontrolė";
    if (timeControl.length === 3) return "Visos rūšys";
    return timeControl.map((t) => t.charAt(0) + t.slice(1).toLowerCase()).join(", ");
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

      {/* Time Control Multiselect Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-xs">{getDisplayLabel()}</span>
          <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>

        {isOpen && (
          <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
            <div className="p-2 space-y-1">
              {timeControlOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={timeControl.includes(option.value)}
                    onChange={() => toggleType(option.value)}
                    className="w-4 h-4 rounded"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
