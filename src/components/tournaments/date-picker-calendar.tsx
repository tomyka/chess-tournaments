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

interface DatePickerCalendarProps {
  selectedDateStart: string;
  selectedDateEnd: string;
  onDateRangeSelect: (start: string | null, end: string | null) => void;
}

export function DatePickerCalendar({
  selectedDateStart,
  selectedDateEnd,
  onDateRangeSelect,
}: DatePickerCalendarProps) {
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

  const handleDayClick = (day: Date) => {
    if (!tempStart || (tempStart && tempEnd)) {
      // Start new range
      setTempStart(day);
      setTempEnd(null);
    } else if (day < tempStart) {
      // Click before start: swap
      setTempEnd(tempStart);
      setTempStart(day);
    } else {
      // Click after start: set end
      setTempEnd(day);
    }
  };

  const handleApply = () => {
    if (tempStart) {
      const startStr = format(tempStart, "yyyy-MM-dd");
      const endStr = tempEnd ? format(tempEnd, "yyyy-MM-dd") : startStr;
      onDateRangeSelect(startStr, endStr);
    }
  };

  const handleClear = () => {
    setTempStart(null);
    setTempEnd(null);
    onDateRangeSelect(null, null);
  };

  const isDateInRange = (day: Date) => {
    if (!tempStart) return false;
    if (!tempEnd) return isSameDay(day, tempStart);
    return isWithinInterval(day, { start: tempStart, end: tempEnd });
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full space-y-4 rounded-lg border bg-card p-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{format(currentDate, "MMMM yyyy")}</h3>
        <div className="flex gap-1">
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
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Week day headers */}
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}

        {/* Days */}
        {days.map((day) => {
          const inMonth = isSameMonth(day, currentDate);
          const isStart = tempStart && isSameDay(day, tempStart);
          const isEnd = tempEnd && isSameDay(day, tempEnd);
          const inRange = isDateInRange(day);

          return (
            <button
              key={day.toString()}
              onClick={() => inMonth && handleDayClick(day)}
              disabled={!inMonth}
              className={`
                aspect-square rounded text-sm font-medium transition-colors
                ${!inMonth ? "text-muted-foreground/30" : "hover:bg-accent cursor-pointer"}
                ${isStart || isEnd ? "bg-primary text-primary-foreground" : ""}
                ${inRange && !isStart && !isEnd ? "bg-primary/20" : ""}
                ${inMonth && !inRange ? "hover:bg-accent" : ""}
              `}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      {/* Selected Range Display */}
      {(tempStart || tempEnd) && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {tempStart ? format(tempStart, "MMM d, yyyy") : "Start"}
          </Badge>
          {tempEnd && (
            <>
              <span className="text-sm text-muted-foreground">to</span>
              <Badge variant="secondary">{format(tempEnd, "MMM d, yyyy")}</Badge>
            </>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          onClick={handleApply}
          disabled={!tempStart}
          className="flex-1"
        >
          Apply
        </Button>
        {tempStart && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleClear}
            className="flex-1"
          >
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
