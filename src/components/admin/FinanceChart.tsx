"use client";

import type { FinanceMonthPoint } from "@/lib/actions/admin";
import { formatPrice } from "@/lib/utils";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface FinanceChartProps {
  data: FinanceMonthPoint[];
}

function FinanceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    dataKey?: string;
    color?: string;
  }>;
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;
  const labelByKey: Record<string, string> = {
    revenue: "Revenue",
    estimatedCogs: "Estimated product spend (COGS)",
    grossProfit: "Gross profit",
    receiptExpenses: "Reviewed supplier receipts",
    netProfit: "Net profit (after supplier receipts)",
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3 text-sm space-y-1">
      <p className="font-medium text-neutral-900 mb-1">{label}</p>
      {payload.map((entry) => {
        const key = entry.dataKey as string | undefined;
        const title =
          (key && labelByKey[key]) || entry.name || key || "";
        const isMoney =
          entry.dataKey !== undefined &&
          ["revenue", "estimatedCogs", "grossProfit", "receiptExpenses", "netProfit"].includes(
            entry.dataKey as string
          );
        return (
          <p key={String(entry.dataKey ?? entry.name)} className="text-neutral-600">
            {title}:{" "}
            <span className="font-medium">
              {isMoney
                ? formatPrice(entry.value ?? 0)
                : String(entry.value ?? 0)}
            </span>
          </p>
        );
      })}
    </div>
  );
}

export default function FinanceChart({ data }: FinanceChartProps) {
  return (
    <div className="min-w-0 bg-white rounded-xl border border-neutral-200">
      <div className="p-6 border-b border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900">
          Monthly earnings
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Orders by <code className="text-xs bg-neutral-100 px-1 rounded">created_at</code>; supplier receipts by{" "}
          <code className="text-xs bg-neutral-100 px-1 rounded">receipt_date</code> (UTC) or upload time.
        </p>
      </div>
      <div className="p-6">
        <div className="h-80 w-full">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-neutral-400 text-sm">
              No monthly data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={320} minWidth={280}>
              <LineChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  stroke="#a3a3a3"
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  stroke="#a3a3a3"
                  fontSize={12}
                  tickFormatter={(v) =>
                    `${Math.round(Number(v)).toLocaleString("en-GB")}`
                  }
                />
                <Tooltip content={<FinanceTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ fill: "#16a34a", r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="estimatedCogs"
                  name="Estimated product spend"
                  stroke="#d97706"
                  strokeWidth={2}
                  dot={{ fill: "#d97706", r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="grossProfit"
                  name="Gross profit"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: "#2563eb", r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="receiptExpenses"
                  name="Supplier receipts (reviewed)"
                  stroke="#57534e"
                  strokeWidth={2}
                  dot={{ fill: "#57534e", r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="netProfit"
                  name="Net profit (after receipts)"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{ fill: "#7c3aed", r: 3 }}
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
