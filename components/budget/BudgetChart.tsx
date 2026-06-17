"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface BudgetChartDatum {
  label: string;
  total: number;
  color: string;
}

function usd(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

export default function BudgetChart({
  data,
  totalCost,
}: {
  data: BudgetChartDatum[];
  totalCost: number;
}) {
  const chartData = data.filter((d) => d.total > 0);

  return (
    <div className="relative h-56 w-56 flex-none sm:h-64 sm:w-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="total"
            nameKey="label"
            innerRadius="65%"
            outerRadius="100%"
            paddingAngle={chartData.length > 1 ? 2 : 0}
            stroke="none"
          >
            {chartData.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => usd(value)}
            contentStyle={{
              borderRadius: 8,
              fontSize: 12,
              border: "1px solid #e4e4e7",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center total */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
          Total
        </span>
        <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
          {usd(totalCost)}
        </span>
      </div>
    </div>
  );
}
