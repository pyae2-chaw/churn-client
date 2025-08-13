import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar.jsx";
import mlApi from "../lib/mlApi.js";

const checklistItems = [
  "File must be in CSV format (.csv)",
  "Must contains at least 50 rows",
  "No empty rows or columns values",
  "All columns must contain valid, non-missing numeric values.",
  `Must include the following columns:\n
- Customer ID\n
- Credit Score\n
- Customer Tenure\n
- Balance\n
- NumOfProducts\n
- Outstanding Loans\n
- Income\n
- Credit History Length\n
- NumComplaints`,
];

// Enrich payload with derived series + numeric summary
function enrich(payload) {
  if (!payload) return null;
  const preds = Array.isArray(payload.predictions) ? payload.predictions : [];

  const churned = preds.filter((p) => Number(p.churn_pred) === 1).length;
  const total = preds.length;
  const retained = total - churned;
  const churnRate = total ? Number(((churned / total) * 100).toFixed(1)) : 0;

  const pieData =
    payload.pieData && Array.isArray(payload.pieData)
      ? payload.pieData
      : [
          { name: "Retained", value: retained },
          { name: "Churned", value: churned },
        ];

  // Small preview table (first 10)
  const preview = preds.slice(0, 10).map((r) => ({
    id: r.index ?? r.id ?? 0,
    prediction: Number(r.churn_pred),
    probability: r.prob != null ? Number(r.prob) : null,
  }));

  return {
    ...payload,
    pieData,
    summary: { total, churned, retained, churnRate },
    preview,
  };
}

function Results() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(
    new Array(checklistItems.length).fill(false)
  );
  const navigate = useNavigate();
  const allChecked = checked.every(Boolean);

  const handleCheck = (index) => {
    const next = [...checked];
    next[index] = !next[index];
    setChecked(next);
  };

  useEffect(() => {
    const fetchLatestResults = async () => {
      setLoading(true);
      try {
        // No cookies for ML API (Option A)
        const res = await mlApi.get("/results/latest", {
          withCredentials: false,
        });

        // API can be either {success:true, data:{...}} or {success:true, ...}
        const payload = res.data?.data ?? res.data;
        if (!res.data?.success || !payload) {
          setData(null);
        } else {
          setData(enrich(payload));
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
          // no results yet
          setData(null);
        } else {
          console.error("Latest results error:", err);
          toast.error(
            err?.response?.data?.error ||
              err?.response?.data?.message ||
              err?.message ||
              "Failed to load results"
          );
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLatestResults();
  }, []);

  const handleDownload = async () => {
    try {
      const url = `${mlApi.defaults.baseURL}/results/download`;
      const response = await fetch(url, { credentials: "omit" });
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const dlUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = dlUrl;
      link.setAttribute("download", "churn_results.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(dlUrl);
      toast.success("CSV downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download failed (endpoint missing?).");
    }
  };

  if (loading) return <p className="text-center mt-10">Loading results...</p>;

  if (!data)
    return (
      <>
        <Navbar />
        <div className="min-h-screen p-8 bg-gradient-to-br from-gray-100 to-pink-100">
          <h1 className="text-3xl font-bold text-center text-rose-500 mb-6">
            ML Prediction Results
          </h1>
          <p className="text-center mt-10 text-gray-700">
            No results found yet. Please upload a CSV on the{" "}
            <button
              onClick={() => navigate("/upload")}
              className="underline text-rose-500 hover:text-rose-600"
            >
              Upload
            </button>{" "}
            page and run a prediction.
          </p>
        </div>
      </>
    );

  const { summary } = data;

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-8 bg-gradient-to-br from-gray-100 to-pink-100">
        <h1 className="text-3xl font-bold text-center text-rose-500 mb-4">
          ML Prediction Results
        </h1>

        {/* Numeric summary chips */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <div className="px-4 py-2 rounded-full bg-white shadow text-gray-700">
            Total: <span className="font-semibold">{summary.total}</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-white shadow text-rose-600">
            Churned: <span className="font-semibold">{summary.churned}</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-white shadow text-rose-400">
            Retained: <span className="font-semibold">{summary.retained}</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-white shadow text-gray-700">
            Churn rate:{" "}
            <span className="font-semibold">{summary.churnRate}%</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pie: Churn vs Retain */}
          {Array.isArray(data.pieData) && (
            <div className="bg-white rounded-2xl p-6 shadow flex flex-col items-center justify-center">
              <h2 className="font-semibold text-lg mb-4 text-center text-rose-500">
                Churn vs Retain
              </h2>
              <ResponsiveContainer width={300} height={300}>
                <PieChart>
                  <Pie
                    dataKey="value"
                    data={data.pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {data.pieData.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={["#fda4af", "#f43f5e"][i % 2]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, "Count"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tenure Bar */}
          {Array.isArray(data.tenureChart) && (
            <div className="bg-white rounded-2xl p-6 shadow">
              <h2 className="font-semibold text-lg mb-4 text-center text-rose-500">
                Customer Tenure vs Churn
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.tenureChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tenure" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="churned" fill="#f43f5e" name="Churned" />
                  <Bar dataKey="retained" fill="#fda4af" name="Retained" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Complaints Line */}
          {Array.isArray(data.complaintsLineChart) && (
            <div className="bg-white rounded-2xl p-6 shadow">
              <h2 className="font-semibold text-lg mb-4 text-center text-rose-500">
                Complaints vs Churn
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.complaintsLineChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="complaints" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="churned"
                    stroke="#f43f5e"
                    name="Churned"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="retained"
                    stroke="#fda4af"
                    name="Retained"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Balance Area */}
          {Array.isArray(data.balanceAreaChart) && (
            <div className="bg-white rounded-2xl p-6 shadow">
              <h2 className="font-semibold text-lg mb-4 text-center text-rose-500">
                Balance vs Churn/Retain
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={data.balanceAreaChart}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRetain"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#fbcfe8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#fbcfe8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="balance" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="retained"
                    stroke="#fbcfe8"
                    fill="url(#colorRetain)"
                    name="Retained"
                  />
                  <Area
                    type="monotone"
                    dataKey="churned"
                    stroke="#f43f5e"
                    fill="url(#colorChurn)"
                    name="Churned"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Credit Score Trend */}
          {Array.isArray(data.creditScoreChart) && (
            <div className="bg-white rounded-2xl p-6 shadow md:col-span-2">
              <h2 className="font-semibold text-lg mb-4 text-center text-rose-500">
                Credit Score Trends
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.creditScoreChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="credit_score" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="churned"
                    stroke="#f43f5e"
                    name="Churned"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="retained"
                    stroke="#fda4af"
                    name="Retained"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Income Band */}
          {Array.isArray(data.incomeBandChart) && (
            <div className="bg-white rounded-2xl p-6 shadow">
              <h2 className="font-semibold text-lg mb-4 text-center text-rose-500">
                Income Band vs Churn
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[...(data.incomeBandChart || [])].sort((a, b) => {
                    const order = [
                      "Very Low",
                      "Low",
                      "Medium",
                      "High",
                      "Very High",
                    ];
                    return order.indexOf(a.band) - order.indexOf(b.band);
                  })}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="band" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="retained" fill="#fda4af" />
                  <Bar dataKey="churned" fill="#f43f5e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Avg Credit Score */}
          {Array.isArray(data.avgCreditScoreByChurn) && (
            <div className="bg-white rounded-2xl p-6 shadow">
              <h2 className="font-semibold text-lg mb-4 text-center text-rose-500">
                Average Credit Score by Churn
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.avgCreditScoreByChurn}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avg_score">
                    {data.avgCreditScoreByChurn.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.label === "Retained" ? "#fda4af" : "#f43f5e"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Predictions preview table */}
        {Array.isArray(data.preview) && data.preview.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow p-6 overflow-x-auto">
            <h2 className="font-semibold text-lg mb-4 text-rose-500">
              Predictions Preview (first 10 rows)
            </h2>
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-600">
                <tr>
                  <th className="py-2 pr-6">Index</th>
                  <th className="py-2 pr-6">Prediction</th>
                  <th className="py-2 pr-6">Probability</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                {data.preview.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2 pr-6">{row.id}</td>
                    <td className="py-2 pr-6">
                      {row.prediction === 1 ? (
                        <span className="text-rose-600 font-medium">Churn</span>
                      ) : (
                        <span className="text-gray-700">Retain</span>
                      )}
                    </td>
                    <td className="py-2 pr-6">
                      {row.prob != null
                        ? `${(row.probability * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Checklist */}
        <div className="max-w-4xl mx-auto mt-12 bg-white/90 rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-rose-400 mb-3 text-center">
            Checklist Before Re-upload
          </h2>
          <ul className="text-left text-gray-700 space-y-3">
            {checklistItems.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={checked[index]}
                  onChange={() => handleCheck(index)}
                  className="mt-1 h-4 w-4 accent-pink-500 focus:ring-pink-400"
                />
                <span>
                  {item.split("\n").map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Buttons */}
        <div className="text-center mt-10 space-y-4">
          <button
            onClick={handleDownload}
            className="bg-rose-400 hover:bg-rose-500 text-gray-800 px-6 py-3 rounded-full font-semibold shadow-lg"
          >
            Download CSV Results
          </button>

          <div className="flex justify-center gap-6 mt-4">
            <button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-rose-200 to-rose-400 hover:brightness-110 text-gray-800 px-6 py-2 rounded-full font-semibold shadow-md transition duration-200"
            >
              Go to Home
            </button>
            <button
              onClick={() => navigate("/upload")}
              disabled={!allChecked}
              className={`${
                allChecked
                  ? "bg-gradient-to-r from-rose-300 to-rose-500 hover:brightness-110"
                  : "bg-gray-300 cursor-not-allowed"
              } text-gray-800 px-6 py-2 rounded-full font-semibold shadow-md transition duration-200`}
            >
              Upload New File
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Results;
