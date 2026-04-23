"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import type { TimeControlFilter } from "@/types/tournament";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  timeControl: TimeControlFilter;
  onTimeControlChange: (value: TimeControlFilter) => void;
  onClearAll: () => void;
}

const timeControlOptions = [
  { value: "STANDARD" as const, label: "Standard" },
  { value: "RAPID" as const, label: "Rapid" },
  { value: "BLITZ" as const, label: "Blitz" },
];

export function FilterDrawer({
  isOpen,
  onClose,
  search,
  onSearchChange,
  timeControl,
  onTimeControlChange,
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

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed left-0 top-0 z-50 h-full w-full max-w-sm bg-background shadow-lg overflow-y-auto"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 backdrop-blur-sm p-4">
              <h2 className="font-semibold">Filters</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6 p-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  Search
                </label>
                <Input
                  placeholder="Tournament name or city..."
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>

              {/* Time Control */}
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  Time Control
                </label>
                <div className="flex flex-wrap gap-2">
                  {timeControlOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant={
                        timeControl.includes(option.value) ? "default" : "outline"
                      }
                      className="cursor-pointer transition-all"
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
