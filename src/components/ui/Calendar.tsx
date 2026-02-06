"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";

interface CalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  minDate: Date;
}

const DAY_LABELS: Record<string, string[]> = {
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  it: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"],
  sq: ["Hën", "Mar", "Mër", "Enj", "Pre", "Sht", "Die"],
};

const MONTH_LABELS: Record<string, string[]> = {
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
  it: [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
  ],
  sq: [
    "Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor",
    "Korrik", "Gusht", "Shtator", "Tetor", "Nëntor", "Dhjetor",
  ],
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeDay(a: Date, b: Date) {
  const aDate = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bDate = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return aDate < bDate;
}

export default function Calendar({ selectedDate, onSelectDate, minDate }: CalendarProps) {
  const locale = useLocale();
  const days = DAY_LABELS[locale] || DAY_LABELS.en;
  const months = MONTH_LABELS[locale] || MONTH_LABELS.en;

  const [viewDate, setViewDate] = useState(() => {
    return new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    // getDay() returns 0 for Sunday; we want Monday=0
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];

    // Empty cells before first day
    for (let i = 0; i < startOffset; i++) {
      cells.push(null);
    }
    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    return cells;
  }, [year, month]);

  const canGoPrev = (() => {
    const prevMonth = new Date(year, month - 1, 1);
    const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    return prevMonth >= minMonth;
  })();

  const goToPrevMonth = () => {
    if (canGoPrev) {
      setViewDate(new Date(year, month - 1, 1));
    }
  };

  const goToNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={goToPrevMonth}
          disabled={!canGoPrev}
          className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-white">
          {months[month]} {year}
        </span>
        <button
          type="button"
          onClick={goToNextMonth}
          className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          aria-label="Next month"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {days.map((day) => (
          <div key={day} className="text-center text-[10px] font-medium text-white/50 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="h-8" />;
          }

          const disabled = isBeforeDay(date, minDate);
          const isSunday = date.getDay() === 0;
          const isDisabled = disabled || isSunday;
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDate(date)}
              className={`
                h-8 text-xs rounded-md transition-all duration-150 font-medium
                ${isDisabled
                  ? "text-white/20 cursor-not-allowed"
                  : isSelected
                    ? "bg-white text-black"
                    : "text-white/80 hover:bg-white/20 hover:text-white cursor-pointer"
                }
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
