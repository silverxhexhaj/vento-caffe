"use client";

import { useState, useTransition } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getOrdersChartData } from "@/lib/actions/admin";
import type { OrdersChartDataPoint } from "@/lib/actions/admin";
import { formatPrice } from "@/lib/utils";

interface DashboardChartProps {
  initialData: OrdersChartDataPoint[];
}

const PERIODS = [7, 14, 30] as const;

export default function DashboardChart({ initialData }: DashboardChartProps) {
  const [period, setPeriod] = useState<number>(7);
  const [data, setData] = useState<OrdersChartDataPoint[]>(initialData);
  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = (days: number) => {
    setPeriod(days);
    if (days === 7) {
      setData(initialData);
    } else {
      startTransition(async () => {
        const { data: chartData } = await getOrdersChartData(days);
        setData(chartData);
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  const formatTooltipDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload?.length || !label) return null;
    return (
      <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-neutral-900 mb-2">
          {formatTooltipDate(label)}
        </p>
        <p className="text-neutral-600">
          Orders: <span className="font-medium">{payload[0]?.value ?? 0}</span>
        </p>
        <p className="text-neutral-600">
          Revenue:{" "}
          <span className="font-medium">{formatPrice(payload[1]?.value ?? 0)}</span>
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-neutral-200">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Orders & Revenue
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Daily trends over selected period
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {PERIODS.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => handlePeriodChange(days)}
              disabled={isPending}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                period === days
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>
      <div className="p-6">
        <div className="h-64 w-full">
          {isPending ? (
            <div className="h-full flex items-center justify-center text-neutral-400">
              <svg
                className="animate-spin h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={256} minWidth={300}>
              <LineChart
                data={data}
                margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#a3a3a3"
                  fontSize={12}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#a3a3a3"
                  fontSize={12}
                  tickFormatter={(v) => v.toString()}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#a3a3a3"
                  fontSize={12}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: "#2563eb", r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ fill: "#16a34a", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
