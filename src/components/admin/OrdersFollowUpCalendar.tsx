"use client";

import Link from "next/link";
import {
  useMemo,
  useCallback,
  useState,
  useTransition,
  useEffect,
  useRef,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { AdminFollowUpRow } from "@/lib/actions/admin";

type EventFilter = "both" | "last" | "followup";
type DateScope = "all" | "overdue" | "thisWeek" | "thisMonth" | "next30Days";

interface OrdersFollowUpCalendarProps {
  locale: string;
  rows: AdminFollowUpRow[];
  error: string | null;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function localYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeekMonday(ref: Date): Date {
  const day = ref.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const s = new Date(ref);
  s.setDate(ref.getDate() + diff);
  s.setHours(0, 0, 0, 0);
  return s;
}

function addLocalDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

function isoToLocalYmd(iso: string): string {
  return localYmd(new Date(iso));
}

interface CalendarProps {
  viewYear: number;
  viewMonth: number;
  /** yyyy-mm-dd -> { last: count, follow: count } */
  dayCounts: Map<string, { last: number; follow: number }>;
  selectedYmd: string | null;
  onSelectYmd: (ymd: string | null) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function AdminMonthCalendar({
  viewYear,
  viewMonth,
  dayCounts,
  selectedYmd,
  onSelectYmd,
  onPrevMonth,
  onNextMonth,
}: CalendarProps) {
  const t = useTranslations("admin.calendar");

  const firstDay = new Date(viewYear, viewMonth - 1, 1);
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(viewYear, viewMonth - 1, d));
  }

  const monthLabel = firstDay.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onPrevMonth}
          className="rounded-lg border border-neutral-200 px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-50"
          aria-label={t("prevMonth")}
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-neutral-900 capitalize">
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={onNextMonth}
          className="rounded-lg border border-neutral-200 px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-50"
          aria-label={t("nextMonth")}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-medium text-neutral-400 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((date, idx) => {
          if (!date) {
            return <div key={`e-${idx}`} className="h-14" />;
          }
          const ymd = localYmd(date);
          const counts = dayCounts.get(ymd);
          const lastC = counts?.last ?? 0;
          const followC = counts?.follow ?? 0;
          const selected = selectedYmd === ymd;

          return (
            <button
              key={ymd}
              type="button"
              onClick={() => onSelectYmd(selected ? null : ymd)}
              className={`h-14 rounded-lg border text-left p-1 transition-colors ${
                selected
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 text-neutral-900"
              }`}
            >
              <span className="text-xs font-medium">{date.getDate()}</span>
              <div className="mt-0.5 flex flex-wrap gap-0.5">
                {lastC > 0 ? (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      selected ? "bg-sky-300" : "bg-sky-500"
                    }`}
                    title={t("dotLastOrder")}
                  />
                ) : null}
                {followC > 0 ? (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      selected ? "bg-amber-200" : "bg-amber-500"
                    }`}
                    title={t("dotFollowUp")}
                  />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          {t("legendLastOrder")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          {t("legendFollowUp")}
        </span>
      </div>
    </div>
  );
}

function matchesDateScope(
  scope: DateScope,
  viewYear: number,
  viewMonth: number,
  lastYmd: string,
  followYmd: string,
  eventFilter: EventFilter
): boolean {
  const today = startOfLocalDay(new Date());
  const todayYmd = localYmd(today);

  const consider = (which: "last" | "follow"): boolean => {
    if (eventFilter === "last" && which !== "last") return false;
    if (eventFilter === "followup" && which !== "follow") return false;
    return true;
  };

  const hasInRange = (
    startYmd: string,
    endYmd: string
  ): boolean => {
    const start = parseYmd(startYmd);
    const end = parseYmd(endYmd);
    if (consider("last")) {
      const d = parseYmd(lastYmd);
      if (d >= start && d <= end) return true;
    }
    if (consider("follow")) {
      const d = parseYmd(followYmd);
      if (d >= start && d <= end) return true;
    }
    return false;
  };

  switch (scope) {
    case "all":
      return true;
    case "overdue": {
      if (!consider("follow")) return false;
      return parseYmd(followYmd) < today;
    }
    case "thisWeek": {
      const ws = startOfWeekMonday(today);
      const we = addLocalDays(ws, 6);
      return hasInRange(localYmd(ws), localYmd(we));
    }
    case "thisMonth": {
      const start = new Date(viewYear, viewMonth - 1, 1);
      const end = new Date(viewYear, viewMonth, 0);
      return hasInRange(localYmd(start), localYmd(end));
    }
    case "next30Days": {
      const end = addLocalDays(today, 30);
      return hasInRange(todayYmd, localYmd(end));
    }
    default:
      return true;
  }
}

export default function OrdersFollowUpCalendar({
  locale,
  rows,
  error,
}: OrdersFollowUpCalendarProps) {
  const t = useTranslations("admin.calendar");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [selectedYmd, setSelectedYmd] = useState<string | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const now = new Date();
  const viewYear = parseInt(
    searchParams.get("y") || String(now.getFullYear()),
    10
  );
  const viewMonth = parseInt(
    searchParams.get("m") || String(now.getMonth() + 1),
    10
  );

  const searchFromUrl = (searchParams.get("search") || "").trim();
  const searchQ = searchFromUrl.toLowerCase();
  const [searchDraft, setSearchDraft] = useState(searchFromUrl);

  useEffect(() => {
    setSearchDraft(searchFromUrl);
  }, [searchFromUrl]);
  const btype = searchParams.get("btype") || "all";
  const eventFilter = (searchParams.get("event") || "both") as EventFilter;
  const dateScope = (searchParams.get("scope") || "all") as DateScope;
  const statusScope = searchParams.get("statusScope") || "non_cancelled";

  const pushParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === "") p.delete(k);
        else p.set(k, v);
      }
      startTransition(() => {
        router.push(`/${locale}/admin/calendar?${p.toString()}`);
      });
    },
    [router, searchParams, locale]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const lastYmd = isoToLocalYmd(r.lastOrderAt);
      const followYmd = isoToLocalYmd(r.followUpAt);

      if (btype !== "all" && (r.businessType || "") !== btype) {
        return false;
      }

      if (searchQ) {
        const hay = [
          r.businessName,
          r.contactName ?? "",
          r.phone ?? "",
          r.email ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(searchQ)) return false;
      }

      if (
        !matchesDateScope(
          dateScope,
          viewYear,
          viewMonth,
          lastYmd,
          followYmd,
          eventFilter
        )
      ) {
        return false;
      }

      return true;
    });
  }, [rows, btype, searchQ, dateScope, viewYear, viewMonth, eventFilter]);

  const businessTypes = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) {
      if (r.businessType) s.add(r.businessType);
    }
    return Array.from(s).sort();
  }, [rows]);

  const dayCounts = useMemo(() => {
    const map = new Map<string, { last: number; follow: number }>();
    const monthStart = new Date(viewYear, viewMonth - 1, 1);
    const monthEnd = new Date(viewYear, viewMonth, 0);

    const inMonth = (ymd: string) => {
      const d = parseYmd(ymd);
      return d >= monthStart && d <= monthEnd;
    };

    for (const r of filteredRows) {
      const lastYmd = isoToLocalYmd(r.lastOrderAt);
      const followYmd = isoToLocalYmd(r.followUpAt);

      if (eventFilter !== "followup" && inMonth(lastYmd)) {
        const cur = map.get(lastYmd) || { last: 0, follow: 0 };
        cur.last += 1;
        map.set(lastYmd, cur);
      }
      if (eventFilter !== "last" && inMonth(followYmd)) {
        const cur = map.get(followYmd) || { last: 0, follow: 0 };
        cur.follow += 1;
        map.set(followYmd, cur);
      }
    }
    return map;
  }, [filteredRows, viewYear, viewMonth, eventFilter]);

  const selectedDayRows = useMemo(() => {
    if (!selectedYmd) return [];
    return filteredRows.filter((r) => {
      const lastYmd = isoToLocalYmd(r.lastOrderAt);
      const followYmd = isoToLocalYmd(r.followUpAt);
      if (eventFilter !== "followup" && lastYmd === selectedYmd) return true;
      if (eventFilter !== "last" && followYmd === selectedYmd) return true;
      return false;
    });
  }, [filteredRows, selectedYmd, eventFilter]);

  const goMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth - 1 + delta, 1);
    pushParams({
      y: String(d.getFullYear()),
      m: String(d.getMonth() + 1),
    });
  };

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {t("loadError")}: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t("title")}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t("subtitle")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <label className="block text-xs font-medium text-neutral-600">
            {t("filterSearch")}
            <input
              type="search"
              value={searchDraft}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              placeholder={t("filterSearchPlaceholder")}
              onChange={(e) => {
                const v = e.target.value;
                setSearchDraft(v);
                if (searchDebounceRef.current) {
                  clearTimeout(searchDebounceRef.current);
                }
                searchDebounceRef.current = setTimeout(() => {
                  const trimmed = v.trim();
                  pushParams({ search: trimmed || undefined });
                }, 350);
              }}
            />
          </label>

          <label className="block text-xs font-medium text-neutral-600">
            {t("filterBusinessType")}
            <select
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              value={btype}
              onChange={(e) =>
                pushParams({
                  btype: e.target.value === "all" ? undefined : e.target.value,
                })
              }
            >
              <option value="all">{t("filterAllTypes")}</option>
              {businessTypes.map((bt) => (
                <option key={bt} value={bt}>
                  {bt}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-neutral-600">
            {t("filterOrderStatus")}
            <select
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              value={statusScope}
              onChange={(e) =>
                pushParams({
                  statusScope:
                    e.target.value === "non_cancelled"
                      ? undefined
                      : e.target.value,
                })
              }
            >
              <option value="non_cancelled">{t("statusNonCancelled")}</option>
              <option value="all">{t("statusAll")}</option>
            </select>
          </label>

          <label className="block text-xs font-medium text-neutral-600">
            {t("filterEventType")}
            <select
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              value={eventFilter}
              onChange={(e) =>
                pushParams({
                  event: e.target.value === "both" ? undefined : e.target.value,
                })
              }
            >
              <option value="both">{t("eventBoth")}</option>
              <option value="last">{t("eventLastOrder")}</option>
              <option value="followup">{t("eventFollowUp")}</option>
            </select>
          </label>

          <label className="block text-xs font-medium text-neutral-600">
            {t("filterDateScope")}
            <select
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              value={dateScope}
              onChange={(e) =>
                pushParams({
                  scope: e.target.value === "all" ? undefined : e.target.value,
                })
              }
            >
              <option value="all">{t("scopeAll")}</option>
              <option value="overdue">{t("scopeOverdue")}</option>
              <option value="thisWeek">{t("scopeThisWeek")}</option>
              <option value="thisMonth">{t("scopeThisMonth")}</option>
              <option value="next30Days">{t("scopeNext30")}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminMonthCalendar
          viewYear={viewYear}
          viewMonth={viewMonth}
          dayCounts={dayCounts}
          selectedYmd={selectedYmd}
          onSelectYmd={setSelectedYmd}
          onPrevMonth={() => goMonth(-1)}
          onNextMonth={() => goMonth(1)}
        />

        <div className="rounded-xl border border-neutral-200 bg-white p-4 min-h-[320px]">
          <h2 className="text-sm font-semibold text-neutral-900 mb-3">
            {selectedYmd
              ? t("panelDayTitle", { date: selectedYmd })
              : t("panelSelectDay")}
          </h2>
          {!selectedYmd ? (
            <p className="text-sm text-neutral-500">{t("panelHint")}</p>
          ) : selectedDayRows.length === 0 ? (
            <p className="text-sm text-neutral-500">{t("panelEmpty")}</p>
          ) : (
            <ul className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {selectedDayRows.map((r) => {
                const lastYmd = isoToLocalYmd(r.lastOrderAt);
                const followYmd = isoToLocalYmd(r.followUpAt);
                const onLast = lastYmd === selectedYmd;
                const onFollow = followYmd === selectedYmd;
                return (
                  <li
                    key={`${r.businessId}-${r.orderId}-${selectedYmd}`}
                    className="rounded-lg border border-neutral-100 p-3 text-sm"
                  >
                    <div className="font-medium text-neutral-900">
                      <Link
                        href={`/${locale}/admin/businesses/${r.businessId}`}
                        className="hover:underline"
                      >
                        {r.businessName}
                      </Link>
                    </div>
                    <div className="mt-1 text-xs text-neutral-500 space-y-0.5">
                      {r.contactName ? <div>{r.contactName}</div> : null}
                      {r.phone ? <div>{r.phone}</div> : null}
                      {r.email ? <div>{r.email}</div> : null}
                      {r.businessType ? (
                        <div>
                          {t("typeLabel")}: {r.businessType}
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {onLast && eventFilter !== "followup" ? (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-800">
                          {t("badgeLastOrder")}{" "}
                          {new Date(r.lastOrderAt).toLocaleString()}
                        </span>
                      ) : null}
                      {onFollow && eventFilter !== "last" ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">
                          {t("badgeFollowUp")}{" "}
                          {new Date(r.followUpAt).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2">
                      <Link
                        href={`/${locale}/admin/orders/${r.orderId}`}
                        className="text-xs font-medium text-neutral-700 hover:underline"
                      >
                        {t("openOrder")} #{r.orderId.slice(0, 8)}…
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-6 border-t border-neutral-100 pt-4">
            <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">
              {t("listFilteredTitle")} ({filteredRows.length})
            </h3>
            <ul className="space-y-2 max-h-40 overflow-y-auto text-xs text-neutral-600">
              {filteredRows.slice(0, 50).map((r) => (
                <li key={r.businessId} className="flex justify-between gap-2">
                  <Link
                    href={`/${locale}/admin/businesses/${r.businessId}`}
                    className="truncate hover:underline"
                  >
                    {r.businessName}
                  </Link>
                  <span className="shrink-0 text-neutral-400">
                    {isoToLocalYmd(r.lastOrderAt)}
                  </span>
                </li>
              ))}
              {filteredRows.length > 50 ? (
                <li className="text-neutral-400 italic">
                  {t("listTruncated")}
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
