"use client";

import { useState, useEffect, useCallback } from "react";
import { getProjectionData } from "@/lib/actions/admin";
import type { ProjectionMonth } from "@/lib/actions/admin";
import ProjectionChart from "@/components/admin/ProjectionChart";
import { formatPrice } from "@/lib/utils";

const GROWTH_RATES = [
  { value: 0, label: "0%" },
  { value: 0.05, label: "5%" },
  { value: 0.1, label: "10%" },
] as const;

const HORIZONS = [
  { value: 6, label: "6 months" },
  { value: 12, label: "1 year" },
] as const;

const CLIENT_GROWTH_MODES = [
  { value: "compound" as const, label: "Compound" },
  { value: "progressive" as const, label: "Progressive" },
] as const;

const DEFAULT_ALLOCATION = {
  stock: 20,
  marketing: 10,
  operations: 7,
  reserve: 12,
};

export default function ProjectionsContent() {
  const [growthRate, setGrowthRate] = useState(0.05);
  const [months, setMonths] = useState(12);
  const [clientGrowthMode, setClientGrowthMode] = useState<"compound" | "progressive">("progressive");
  const [monthlyNewClients, setMonthlyNewClients] = useState(2);
  const [projectionData, setProjectionData] = useState<ProjectionMonth[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [allocation, setAllocation] = useState(DEFAULT_ALLOCATION);

  const fetchProjections = useCallback(async () => {
    setIsPending(true);
    const { data, error } = await getProjectionData({
      growthRate,
      months,
      clientGrowthMode,
      monthlyNewClients,
    });
    if (!error && data) {
      setProjectionData(data);
    } else {
      setProjectionData([]);
    }
    setIsPending(false);
  }, [growthRate, months, clientGrowthMode, monthlyNewClients]);

  useEffect(() => {
    fetchProjections();
  }, [fetchProjections]);

  const totalAllocation =
    allocation.stock +
    allocation.marketing +
    allocation.operations +
    allocation.reserve;

  return (
    <div className="space-y-8">
      {/* Projection Controls */}
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-neutral-200">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Projected Growth
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Monthly extrapolation from first month baseline
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">Growth:</span>
              <div className="flex gap-1">
                {GROWTH_RATES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGrowthRate(value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      growthRate === value
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">Horizon:</span>
              <div className="flex gap-1">
                {HORIZONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMonths(value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      months === value
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">Clients:</span>
              <div className="flex gap-1">
                {CLIENT_GROWTH_MODES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setClientGrowthMode(value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      clientGrowthMode === value
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {clientGrowthMode === "progressive" && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-600">
                  New clients/month:
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={monthlyNewClients}
                  onChange={(e) =>
                    setMonthlyNewClients(
                      Math.min(20, Math.max(1, Number(e.target.value) || 1))
                    )
                  }
                  className="w-16 px-2 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1"
                />
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {isPending ? (
            <div className="h-64 flex items-center justify-center text-neutral-400">
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
          ) : projectionData.length > 0 ? (
            <ProjectionChart data={projectionData} />
          ) : (
            <div className="h-64 flex items-center justify-center text-neutral-500">
              No projection data available
            </div>
          )}
        </div>
        {months === 12 && projectionData.length > 0 && (() => {
          const totalRevenue = projectionData.reduce((sum, m) => sum + m.revenue, 0);
          const totalCogs = projectionData.reduce(
            (sum, m) => sum + (m.costOfGoodsSold ?? 0),
            0
          );
          const netProfit = totalRevenue - totalCogs;
          return (
            <div className="p-6 border-t border-neutral-200 bg-neutral-50">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">
                Year 1 Summary
              </h3>
              <div className="flex flex-wrap gap-6">
                <div>
                  <span className="text-xs text-neutral-500">Total revenue</span>
                  <p className="text-lg font-semibold text-neutral-900">
                    {formatPrice(totalRevenue)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-neutral-500">Total orders</span>
                  <p className="text-lg font-semibold text-neutral-900">
                    {projectionData.reduce((sum, m) => sum + m.orders, 0)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-neutral-500">
                    Clients at end of year
                  </span>
                  <p className="text-lg font-semibold text-neutral-900">
                    {projectionData[projectionData.length - 1]?.activeClients ?? 0}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-neutral-500">
                    Cost of goods (COGS)
                  </span>
                  <p className="text-lg font-semibold text-neutral-900">
                    {formatPrice(totalCogs)}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Based on product cost prices
                  </p>
                </div>
                <div>
                  <span className="text-xs text-neutral-500">Net profit</span>
                  <p className="text-lg font-semibold text-neutral-900">
                    {formatPrice(netProfit)}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Revenue minus COGS (real product costs)
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Investment Allocation */}
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            Investment Allocation
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            COGS = cost of goods sold (from product cost prices). Stock =
            planned investment allocation (% of revenue).
          </p>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Stock / Inventory ({allocation.stock}%)
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={allocation.stock}
                onChange={(e) =>
                  setAllocation((a) => ({
                    ...a,
                    stock: Number(e.target.value),
                  }))
                }
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Marketing ({allocation.marketing}%)
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={allocation.marketing}
                onChange={(e) =>
                  setAllocation((a) => ({
                    ...a,
                    marketing: Number(e.target.value),
                  }))
                }
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Operations ({allocation.operations}%)
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={allocation.operations}
                onChange={(e) =>
                  setAllocation((a) => ({
                    ...a,
                    operations: Number(e.target.value),
                  }))
                }
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Reserve / Buffer ({allocation.reserve}%)
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={allocation.reserve}
                onChange={(e) =>
                  setAllocation((a) => ({
                    ...a,
                    reserve: Number(e.target.value),
                  }))
                }
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
              />
            </div>
          </div>
          {totalAllocation > 100 && (
            <p className="text-sm text-amber-600">
              Total allocation ({totalAllocation}%) exceeds 100%. Consider
              reducing to stay within revenue.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">
                    Month
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-700">
                    Revenue
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-700">
                    COGS
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-700">
                    Stock
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-700">
                    Marketing
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-700">
                    Operations
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-700">
                    Reserve
                  </th>
                </tr>
              </thead>
              <tbody>
                {projectionData.map((row) => (
                  <tr
                    key={row.month}
                    className="border-b border-neutral-100 hover:bg-neutral-50"
                  >
                    <td className="py-3 px-4 font-medium text-neutral-900">
                      {row.month}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-700">
                      {formatPrice(row.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-600">
                      {formatPrice(row.costOfGoodsSold ?? 0)}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-600">
                      {formatPrice(
                        Math.round((row.revenue * allocation.stock) / 100)
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-600">
                      {formatPrice(
                        Math.round((row.revenue * allocation.marketing) / 100)
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-600">
                      {formatPrice(
                        Math.round((row.revenue * allocation.operations) / 100)
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-600">
                      {formatPrice(
                        Math.round((row.revenue * allocation.reserve) / 100)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
