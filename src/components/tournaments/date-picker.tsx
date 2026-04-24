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
} from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DatePickerProps {
  selectedDateStart: string;
  selectedDateEnd: string;
  onDateRangeSelect: (start: string | null, end: string | null) => void;
}

export function DatePicker({
  selectedDateStart,
  selectedDateEnd,
  onDateRangeSelect,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
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
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setTempStart(null);
    setTempEnd(null);
    onDateRangeSelect(null, null);
    setIsOpen(false);
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
    const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

    return (
      <div className="w-72">
        {/* Month/Year Header */}
        <div className="mb-4 text-center">
          <h3 className="text-base font-semibold text-gray-900">
            {format(date, "MMMM yyyy")}
          </h3>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-700 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-0">
          {days.map((day) => {
            const inMonth = isSameMonth(day, date);
            const isStart = tempStart && isSameDay(day, tempStart);
            const isEnd = tempEnd && isSameDay(day, tempEnd);
            const inRange = isDateInRange(day);
            const isToday = isSameDay(day, new Date());

            let bgColor = "";
            let textColor = "text-gray-700";

            if (!inMonth) {
              bgColor = "";
              textColor = "text-gray-300";
            } else if (isStart || isEnd) {
              bgColor = "bg-amber-600 text-white";
              textColor = "text-white";
            } else if (inRange) {
              bgColor = "bg-gray-200";
              textColor = "text-gray-700";
            } else if (isToday) {
              bgColor = "border-2 border-amber-600";
              textColor = "text-gray-900 font-semibold";
            } else {
              bgColor = "hover:bg-gray-100";
            }

            return (
              <button
                key={day.toString()}
                onClick={() => inMonth && handleDayClick(day)}
                disabled={!inMonth}
                className={`
                  aspect-square text-sm font-medium transition-all
                  ${bgColor} ${textColor}
                  ${inMonth && !isStart && !isEnd && !inRange && !isToday ? "cursor-pointer" : ""}
                  ${!inMonth ? "cursor-default" : ""}
                  rounded
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
    <div className="relative inline-block">
      {/* Input/Trigger - Airbnb style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-full bg-white hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-center gap-4">
          {/* Check-in */}
          <div className="text-left">
            <div className="text-xs font-semibold text-gray-700 uppercase">
              Check-in
            </div>
            <div className="text-sm text-gray-900 font-medium">
              {selectedDateStart
                ? format(new Date(selectedDateStart), "MMM d")
                : "Add dates"}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-300" />

          {/* Check-out */}
          <div className="text-left">
            <div className="text-xs font-semibold text-gray-700 uppercase">
              Check-out
            </div>
            <div className="text-sm text-gray-900 font-medium">
              {selectedDateEnd
                ? format(new Date(selectedDateEnd), "MMM d")
                : "Add dates"}
            </div>
          </div>

          {/* Clear button */}
          {selectedDateStart && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Calendar Panel */}
          <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 z-50 bg-white rounded-3xl border border-gray-200 shadow-2xl p-6">
            {/* Header with Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </Button>
              <span className="text-lg font-semibold text-gray-900 flex-1 text-center">
                {tempStart && tempEnd
                  ? `${format(tempStart, "MMM d")} - ${format(tempEnd, "MMM d")}`
                  : tempStart
                  ? `From ${format(tempStart, "MMM d")}`
                  : "Select dates"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </Button>
            </div>

            {/* Two Calendars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              {renderCalendar(currentDate)}
              {renderCalendar(nextMonth)}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {(tempStart || tempEnd) && (
                <Button
                  variant="outline"
                  onClick={handleClear}
                  className="flex-1 h-10 text-sm font-semibold rounded-lg"
                >
                  Clear
                </Button>
              )}
              <Button
                onClick={handleApply}
                disabled={!tempStart}
                className="flex-1 h-10 text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
              >
                Search
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
