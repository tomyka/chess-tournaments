"use client";

import { useState, useRef, useEffect } from "react";
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

interface DatePickerProps {
  selectedDateStart: string;
  selectedDateEnd: string;
  onDateRangeSelect: (start: string | null, end: string | null) => void;
}

export function DatePickerV2({
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleDayClick = (day: Date) => {
    if (!tempStart) {
      setTempStart(day);
      setTempEnd(null);
    } else if (!tempEnd) {
      if (isBefore(day, tempStart)) {
        setTempStart(day);
        setTempEnd(null);
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
      <div>
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
              className="text-center text-xs font-semibold text-gray-700 py-2 h-8"
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
            let textColor = "text-gray-700";

            if (!inMonth) {
              textColor = "text-gray-300";
            } else if (isStart || isEnd) {
              bgColor = "bg-black text-white font-semibold";
              textColor = "text-white";
            } else if (inRange) {
              bgColor = "bg-gray-200";
              textColor = "text-gray-700";
            } else if (isToday) {
              bgColor = "border-2 border-black";
              textColor = "text-gray-900 font-semibold";
            }

            return (
              <button
                key={day.toString()}
                onClick={() => inMonth && handleDayClick(day)}
                disabled={!inMonth}
                className={`
                  h-10 w-10 flex items-center justify-center text-sm font-medium 
                  rounded-lg transition-all
                  ${bgColor} ${textColor}
                  ${inMonth ? "cursor-pointer hover:bg-gray-100" : "cursor-default"}
                  ${isStart || isEnd ? "" : ""}
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
    <div className="relative" ref={containerRef}>
      {/* Trigger Button - Airbnb style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-4 px-6 py-3 border-2 border-gray-300 rounded-full bg-white hover:shadow-lg hover:border-gray-400 transition-all cursor-pointer"
      >
        <div>
          <div className="text-xs font-bold text-gray-700 uppercase">
            Check-in
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {selectedDateStart
              ? format(new Date(selectedDateStart), "MMM d, yyyy")
              : "Add dates"}
          </div>
        </div>

        <div className="h-6 w-px bg-gray-300" />

        <div>
          <div className="text-xs font-bold text-gray-700 uppercase">
            Check-out
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {selectedDateEnd
              ? format(new Date(selectedDateEnd), "MMM d, yyyy")
              : "Add dates"}
          </div>
        </div>

        {selectedDateStart && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="ml-2 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </button>

      {/* Calendar Popover - Full Width on Mobile, Centered on Desktop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-12">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsOpen(false)}
          />

          {/* Calendar Container */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 m-4 max-w-2xl w-full sm:w-auto">
            {/* Header with Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>

              <div className="flex-1 text-center">
                <h2 className="text-lg font-bold text-gray-900">
                  {tempStart && tempEnd
                    ? `${format(tempStart, "MMM d")} - ${format(
                        tempEnd,
                        "MMM d"
                      )}`
                    : tempStart
                    ? `From ${format(tempStart, "MMM d")}`
                    : "Select dates"}
                </h2>
              </div>

              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            {/* Two Calendars - Stack on mobile, side by side on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div className="flex justify-center">
                {renderCalendar(currentDate)}
              </div>
              <div className="flex justify-center">
                {renderCalendar(nextMonth)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-300">
              {(tempStart || tempEnd) && (
                <button
                  onClick={handleClear}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleApply}
                disabled={!tempStart}
                className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                  tempStart
                    ? "bg-black text-white hover:bg-gray-800"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
