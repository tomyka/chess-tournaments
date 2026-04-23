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
  isBefore,
  isAfter,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const handleDayClick = (day: Date) => {
    if (!tempStart) {
      setTempStart(day);
      setTempEnd(null);
    } else if (!tempEnd) {
      if (isBefore(day, tempStart)) {
        setTempStart(day);
      } else {
        setTempEnd(day);
      }
    } else {
      setTempStart(day);
      setTempEnd(null);
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

  const renderCalendar = (date: Date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

    return (
      <div className="w-full sm:w-80">
        {/* Month/Year Header */}
        <div className="mb-4 text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {format(date, "MMMM yyyy")}
          </h3>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const inMonth = isSameMonth(day, date);
            const isStart = tempStart && isSameDay(day, tempStart);
            const isEnd = tempEnd && isSameDay(day, tempEnd);
            const inRange = isDateInRange(day);
            const isToday = isSameDay(day, new Date());

            let bgColor = "";
            let textColor = "";

            if (isStart || isEnd) {
              bgColor = "bg-blue-600";
              textColor = "text-white";
            } else if (inRange) {
              bgColor = "bg-blue-100";
              textColor = "text-gray-900";
            } else if (!inMonth) {
              bgColor = "";
              textColor = "text-gray-300";
            } else if (isToday) {
              bgColor = "";
              textColor = "text-blue-600 font-semibold";
            } else {
              bgColor = "hover:bg-gray-100";
              textColor = "text-gray-700";
            }

            return (
              <button
                key={day.toString()}
                onClick={() => inMonth && handleDayClick(day)}
                disabled={!inMonth}
                className={`
                  h-10 text-sm transition-all rounded-md
                  ${bgColor} ${textColor}
                  ${inMonth && !isStart && !isEnd && !inRange ? "cursor-pointer hover:bg-gray-100" : ""}
                  ${!inMonth ? "cursor-default" : ""}
                  ${(isStart || isEnd) && inRange && tempStart !== tempEnd ? "rounded-none" : ""}
                  ${isStart ? "rounded-l-md" : ""}
                  ${isEnd ? "rounded-r-md" : ""}
                `}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const nextMonth = addMonths(currentDate, 1);

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 p-6 shadow-sm">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          className="h-9 w-9 p-0"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </Button>
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {selectedDateStart && selectedDateEnd
            ? `${format(new Date(selectedDateStart), "MMM d")} - ${format(new Date(selectedDateEnd), "MMM d, yyyy")}`
            : selectedDateStart
            ? `From ${format(new Date(selectedDateStart), "MMM d, yyyy")}`
            : "Select dates"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="h-9 w-9 p-0"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </Button>
      </div>

      {/* Two Calendars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
        {renderCalendar(currentDate)}
        {renderCalendar(nextMonth)}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        {(tempStart || tempEnd) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="flex-1"
          >
            Clear
          </Button>
        )}
        <Button
          onClick={handleApply}
          disabled={!tempStart}
          size="sm"
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          Done
        </Button>
      </div>
    </div>
  );
}
