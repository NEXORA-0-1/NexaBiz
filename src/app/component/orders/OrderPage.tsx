"use client";
import { useState, useEffect } from "react";

export default function OrderPage() {
  const [activeTab, setActiveTab] = useState<"history" | "optimizer">("history");
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

  // Automatically fetch dashboard when tab changes
  useEffect(() => {
    if (activeTab === "optimizer") fetchOptimizerDashboard();
  }, [activeTab]);

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex mb-4 border-b border-gray-300">
        {["history", "optimizer"].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 -mb-px font-semibold rounded-t ${
              activeTab === tab
                ? "bg-white border border-b-0 border-gray-300"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab(tab as any)}
          >
            {tab === "history" ? "Order History" : "Order Optimizer"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {/* Order History */}
        {activeTab === "history" && (
          <div>
            <h2 className="text-xl font-bold mb-2">📜 Order History</h2>
            <p className="text-gray-600 mb-2">
              This should fetch from your <code>transactions</code> collection instead of dummy data.
            </p>
            <p className="italic">🔧 TODO: Hook into Firestore/MySQL API</p>
          </div>
        )}

        {/* Order Optimizer Dashboard */}
        {activeTab === "optimizer" && (
          <div>
            <h2 className="text-xl font-bold mb-4">⚡ Order Optimizer Dashboard</h2>

            {loading && <p>Loading dashboard...</p>}

            {optimizerData && (
              <div className="space-y-4">
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
        )}
      </div>
    </div>
  );
}
