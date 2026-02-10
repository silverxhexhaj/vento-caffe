export function calculateProfitMargin(
  sellingPrice: number,
  costPrice: number
): number {
  if (!sellingPrice || sellingPrice === 0) return 0;
  return ((sellingPrice - costPrice) / sellingPrice) * 100;
}

export function calculateProfit(
  sellingPrice: number,
  costPrice: number
): number {
  return sellingPrice - costPrice;
}

export function formatProfitMargin(margin: number): {
  value: string;
  color: "green" | "yellow" | "red";
} {
  const color = margin > 20 ? "green" : margin > 10 ? "yellow" : "red";
  return {
    value: `${margin.toFixed(2)}%`,
    color,
  };
}
