"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { DatePickerV2 } from "./date-picker-v2";
import type { TimeControlFilter, CountryFilter } from "@/types/tournament";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  timeControl: TimeControlFilter;
  onTimeControlChange: (value: TimeControlFilter) => void;
  country: CountryFilter;
  onCountryChange: (value: CountryFilter) => void;
  dateStart: string;
  dateEnd: string;
  onDateRangeChange: (start: string | null, end: string | null) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  onClearAll: () => void;
}

const timeControlOptions = [
  { value: "STANDARD" as const, label: "⏱ Standard" },
  { value: "RAPID" as const, label: "♟ Rapid" },
  { value: "BLITZ" as const, label: "⚡ Blitz" },
];

const countryOptions = [
  { value: "Lithuania" as const, label: "🇱🇹 Lithuania" },
  { value: "Latvia" as const, label: "🇱🇻 Latvia" },
];

const sortOptions = [
  { value: "date-asc", label: "Upcoming first" },
  { value: "date-desc", label: "Recent first" },
  { value: "rating-desc", label: "Highest rating" },
  { value: "players-desc", label: "Most players" },
];

export function FilterDrawer({
  isOpen,
  onClose,
  timeControl,
  onTimeControlChange,
  country,
  onCountryChange,
  dateStart,
  dateEnd,
  onDateRangeChange,
  sortBy,
  onSortByChange,
  onClearAll,
}: FilterDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl overflow-y-auto max-h-[85vh]"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Filters</h2>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6 p-4 pb-10">
              {/* Time Control */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Time Control
                </label>
                <div className="flex flex-wrap gap-2">
                  {timeControlOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant={timeControl.includes(option.value) ? "default" : "outline"}
                      className="cursor-pointer transition-all text-sm px-3 py-1.5 h-auto"
                      onClick={() => {
                        const newValue = timeControl.includes(option.value)
                          ? timeControl.filter((t) => t !== option.value)
                          : [...timeControl, option.value];
                        onTimeControlChange(newValue);
                      }}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Country */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Country
                </label>
                <div className="flex flex-wrap gap-2">
                  {countryOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant={country.includes(option.value) ? "default" : "outline"}
                      className="cursor-pointer transition-all text-sm px-3 py-1.5 h-auto"
                      onClick={() => {
                        const newValue = country.includes(option.value)
                          ? country.filter((c) => c !== option.value)
                          : [...country, option.value];
                        onCountryChange(newValue as CountryFilter);
                      }}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Date Range
                </label>
                <DatePickerV2
                  selectedDateStart={dateStart}
                  selectedDateEnd={dateEnd}
                  onDateRangeSelect={onDateRangeChange}
                />
              </div>

              {/* Sort by */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Sort by
                </label>
                <div className="flex flex-col gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onSortByChange(option.value)}
                      className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg border transition-colors text-left ${
                        sortBy === option.value
                          ? "border-amber-600 bg-amber-600 text-white"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      {sortBy === option.value && <span>✓</span>}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear All */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  onClearAll();
                  onClose();
                }}
              >
                Clear All Filters
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
