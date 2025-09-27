"use client";
import { useState, useEffect } from "react";

export default function OrderPage() {
  const [optimizerData, setOptimizerData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch Optimizer Dashboard Data (from Flask)
  const fetchOptimizerDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5002/dashboard"); // Flask endpoint
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setOptimizerData(data);
    } catch (err) {
      console.error("❌ Failed to fetch optimizer data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptimizerDashboard();
  }, []);

  return (
    <div className="p-6">
      {/* Page Heading */}
      <h1 className="text-2xl font-bold mb-6">⚡ Order Optimizer</h1>

      {/* Optimizer Dashboard */}
      {loading && <p>Loading dashboard...</p>}

      {optimizerData && (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">🔥 Top-selling Products</h3>
            {optimizerData.top_selling?.length > 0 ? (
              <ul className="list-disc ml-5">
                {optimizerData.top_selling.map((p: any, i: number) => (
                  <li key={i}>
                    {p.name} - {p.sales} units sold
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No sales data available</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">🐢 Slow-moving Products</h3>
            {optimizerData.slow_moving?.length > 0 ? (
              <ul className="list-disc ml-5">
                {optimizerData.slow_moving.map((p: any, i: number) => (
                  <li key={i}>
                    {p.name} - {p.sales} units sold
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No slow products found</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">🛒 Order Recommendations</h3>
            {optimizerData.recommendations?.length > 0 ? (
              <ul className="list-disc ml-5">
                {optimizerData.recommendations.map((r: any, i: number) => (
                  <li key={i}>
                    {r.name} - order {r.suggested_qty} units
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No recommendations yet</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">📦 Inventory & Stock Levels</h3>
            {optimizerData.stock_levels?.length > 0 ? (
              <ul className="list-disc ml-5">
                {optimizerData.stock_levels.map((s: any, i: number) => (
                  <li key={i}>
                    {s.name} - {s.qty} units in stock
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Stock data unavailable</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
