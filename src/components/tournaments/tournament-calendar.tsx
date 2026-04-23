"use client";

import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  format,
  addMonths,
  subMonths,
  isWithinInterval,
} from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Tournament } from "@/types/tournament";

interface TournamentCalendarProps {
  tournaments: Tournament[];
  selectedDateStart: string | null;
  selectedDateEnd: string | null;
  onDateRangeSelect: (start: string | null, end: string | null) => void;
}

export function TournamentCalendar({
  tournaments,
  selectedDateStart,
  selectedDateEnd,
  onDateRangeSelect,
}: TournamentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tempStart, setTempStart] = useState<Date | null>(
    selectedDateStart ? new Date(selectedDateStart) : null
  );
  const [tempEnd, setTempEnd] = useState<Date | null>(
    selectedDateEnd ? new Date(selectedDateEnd) : null
  );

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group tournaments by date
  const tournamentsByDate = new Map<string, Tournament[]>();
  tournaments.forEach((tournament) => {
    if (tournament.startDate) {
      const dateKey = format(new Date(tournament.startDate), "yyyy-MM-dd");
      if (!tournamentsByDate.has(dateKey)) {
        tournamentsByDate.set(dateKey, []);
      }
      tournamentsByDate.get(dateKey)!.push(tournament);
    }
  });

  const timeControlColors: Record<string, string> = {
    STANDARD: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    RAPID: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    BLITZ: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    UNKNOWN: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };

  const timeControlLabels: Record<string, string> = {
    STANDARD: "St",
    RAPID: "Rp",
    BLITZ: "Bz",
    UNKNOWN: "?",
  };

  const handleDayClick = (day: Date) => {
    if (!tempStart) {
      // Set start date
      setTempStart(day);
      setTempEnd(null);
    } else if (!tempEnd) {
      // Set end date
      if (day >= tempStart) {
        setTempEnd(day);
      } else {
        // If clicked date is before start, swap them
        setTempEnd(tempStart);
        setTempStart(day);
      }
    } else {
      // Reset and start a new selection
      setTempStart(day);
      setTempEnd(null);
    }
  };

  const isInRange = (day: Date) => {
    if (!tempStart) return false;
    if (!tempEnd) return isSameDay(day, tempStart);
    return isWithinInterval(day, { start: tempStart, end: tempEnd });
  };

  const handleApplyRange = () => {
    if (tempStart) {
      const start = format(tempStart, "yyyy-MM-dd");
      const end = tempEnd ? format(tempEnd, "yyyy-MM-dd") : start;
      onDateRangeSelect(start, end);
    }
  };

  const handleClearRange = () => {
    setTempStart(null);
    setTempEnd(null);
    onDateRangeSelect(null, null);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-semibold text-sm text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayTournaments = tournamentsByDate.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          const isRangeStart = tempStart && isSameDay(day, tempStart);
          const isRangeEnd = tempEnd && isSameDay(day, tempEnd);
          const isRanged = isInRange(day);

          return (
            <button
              key={dateKey}
              onClick={() => handleDayClick(day)}
              className={`min-h-32 rounded-lg border p-2 text-left transition-all ${
                isRangeStart || isRangeEnd
                  ? "bg-primary text-primary-foreground border-primary"
                  : isRanged
                  ? "bg-primary/20 border-primary/50"
                  : isCurrentMonth
                  ? "bg-background hover:bg-muted/50"
                  : "bg-muted/30"
              } ${
                isToday && !isRanged
                  ? "border-primary/50"
                  : isRanged
                  ? ""
                  : "border-border"
              }`}
            >
              <div className={`text-sm font-semibold mb-1 ${!isCurrentMonth && !isRanged ? "text-muted-foreground" : ""}`}>
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayTournaments.slice(0, 3).map((tournament) => (
                  <a
                    key={tournament.id}
                    href={tournament.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge
                      className={`${timeControlColors[tournament.timeControl]} text-xs cursor-pointer hover:shadow-md transition-all line-clamp-1 w-full justify-center`}
                      variant="secondary"
                    >
                      {timeControlLabels[tournament.timeControl]}
                    </Badge>
                  </a>
                ))}
                {dayTournaments.length > 3 && (
                  <div className="text-xs text-muted-foreground pl-1">
                    +{dayTournaments.length - 3} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t pt-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={timeControlColors.STANDARD}>St</Badge>
          <span>Standard</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={timeControlColors.RAPID}>Rp</Badge>
          <span>Rapid</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={timeControlColors.BLITZ}>Bz</Badge>
          <span>Blitz</span>
        </div>
      </div>

      {/* Date Selection Info and Actions */}
      <div className="border-t pt-4 space-y-3">
        <div className="text-sm">
          {tempStart ? (
            <div className="space-y-2">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Selected range:</span> {format(tempStart, "MMM d, yyyy")}
                {tempEnd && ` – ${format(tempEnd, "MMM d, yyyy")}`}
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleApplyRange}>
                  Apply filter
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTempStart(null)} className="gap-1">
                  <X className="h-3 w-3" />
                  Clear selection
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Click on dates to select a range for filtering tournaments
            </p>
          )}
        </div>
        {(selectedDateStart || selectedDateEnd) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearRange}
            className="gap-1 text-xs"
          >
            <X className="h-3 w-3" />
            Clear active filter
          </Button>
        )}
      </div>
    </div>
  );
}
