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
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
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
    const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

    return (
      <div className="w-56">
        {/* Month/Year Header */}
        <div className="mb-2 text-center">
          <h3 className="text-xs font-semibold text-gray-900">
            {format(date, "MMM yyyy")}
          </h3>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-0.5">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-600 py-0.5"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-0.5">
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
                  h-7 text-xs transition-all rounded
                  ${bgColor} ${textColor}
                  ${inMonth && !isStart && !isEnd && !inRange ? "cursor-pointer hover:bg-gray-100" : ""}
                  ${!inMonth ? "cursor-default" : ""}
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
      {/* Input/Trigger - Booking.com style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-0 border border-gray-300 rounded-lg bg-white hover:border-gray-400 transition-colors shadow-sm overflow-hidden"
      >
        {/* Check-in */}
        <div className="flex items-center gap-2 px-3 py-2 border-r border-gray-200 min-w-[140px]">
          <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <div className="text-left text-sm">
            <div className="text-xs text-gray-500 font-medium">Check-in</div>
            <div className="text-sm font-medium text-gray-900">
              {selectedDateStart
                ? format(new Date(selectedDateStart), "d MMM")
                : "Add date"}
            </div>
          </div>
        </div>

        {/* Check-out */}
        <div className="flex items-center gap-2 px-3 py-2 min-w-[140px]">
          <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <div className="text-left text-sm">
            <div className="text-xs text-gray-500 font-medium">Check-out</div>
            <div className="text-sm font-medium text-gray-900">
              {selectedDateEnd
                ? format(new Date(selectedDateEnd), "d MMM")
                : "Add date"}
            </div>
          </div>
        </div>

        {/* Clear button */}
        {selectedDateStart && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="px-2 py-2 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
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
          <div className="absolute top-full mt-2 z-50 bg-white rounded-lg border border-gray-200 shadow-lg p-4 w-full sm:w-auto sm:left-0">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="h-6 w-6 p-0"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </Button>
              <span className="text-xs text-gray-600 font-medium flex-1 text-center">
                {tempStart && tempEnd
                  ? `${format(tempStart, "d MMM")} - ${format(tempEnd, "d MMM")}`
                  : tempStart
                  ? `From ${format(tempStart, "d MMM")}`
                  : "Select dates"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="h-6 w-6 p-0"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </Button>
            </div>

            {/* Two Calendars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {renderCalendar(currentDate)}
              {renderCalendar(nextMonth)}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              {(tempStart || tempEnd) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="flex-1 h-7 text-xs"
                >
                  Clear
                </Button>
              )}
              <Button
                onClick={handleApply}
                disabled={!tempStart}
                size="sm"
                className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700"
              >
                Done
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
