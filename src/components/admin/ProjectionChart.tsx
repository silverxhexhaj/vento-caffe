"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ProjectionMonth } from "@/lib/actions/admin";
import { formatPrice } from "@/lib/utils";

interface ProjectionChartProps {
  data: ProjectionMonth[];
}

export default function ProjectionChart({ data }: ProjectionChartProps) {
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
        <p className="font-medium text-neutral-900 mb-2">{label}</p>
        <p className="text-neutral-600">
          Orders: <span className="font-medium">{payload[0]?.value ?? 0}</span>
        </p>
        <p className="text-neutral-600">
          Revenue:{" "}
          <span className="font-medium">
            {formatPrice(payload[1]?.value ?? 0)}
          </span>
        </p>
        <p className="text-neutral-600">
          Clients: <span className="font-medium">{payload[2]?.value ?? 0}</span>
        </p>
      </div>
    );
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%" minHeight={256} minWidth={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis
            dataKey="month"
            stroke="#a3a3a3"
            fontSize={12}
            tick={{ transform: "translate(0, 6)" }}
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
          <Bar
            yAxisId="left"
            dataKey="orders"
            name="Orders"
            fill="#2563eb"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="right"
            dataKey="revenue"
            name="Revenue"
            fill="#16a34a"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
