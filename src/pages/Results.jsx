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
import Navbar from "../components/Navbar";
import mlApi from "..src/lib/mlApi";

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

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7f50",
  "#8dd1e1",
  "#d0ed57",
];

function Results() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(
    new Array(checklistItems.length).fill(false)
  );
  const allChecked = checked.every((item) => item === true);

  const handleCheck = (index) => {
    const next = [...checked];
    next[index] = !next[index];
    setChecked(next);
  };

  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatestResults = async () => {
      setLoading(true);
      try {
        const user_id = localStorage.getItem("user_id") || "anonymous";
        const res = await mlApi.get("/results/latest", { params: { user_id } });
        setData(res.data);
      } catch (error) {
        console.error("Latest results error:", error);
        const msg =
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to load results";
        toast.error(msg);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestResults();
  }, []);

  const handleDownload = async () => {
    try {
      const user_id = localStorage.getItem("user_id") || "anonymous";
      // Build a direct download URL from the mlApi baseURL
      const url = `${
        mlApi.defaults.baseURL
      }/results/download?user_id=${encodeURIComponent(user_id)}`;
      const response = await fetch(url, { method: "GET" });
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const dlUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = dlUrl;
      link.setAttribute(
        "download",
        (data && data.csv_url) || "churn_results.csv"
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(dlUrl);

      toast.success("CSV downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download failed.");
    }
  };

  if (loading) return <p className="text-center mt-10">Loading results...</p>;
  if (!data)
    return <p className="text-center mt-10 text-red-500">No results found</p>;

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-8 bg-gradient-to-br from-gray-100 to-pink-100">
        <h1 className="text-3xl font-bold text-center text-rose-500 mb-6">
          ML Prediction Results
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pie Chart */}
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
                  label
                >
                  {data.pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={["#fda4af", "#f43f5e"][index % 2]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Tenure Chart */}
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

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Complaints Line Chart */}
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

            {/* Balance Area Chart */}
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
          </div>

          {/* Credit Score Trend */}
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
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Income Band Chart */}
          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="font-semibold text-lg mb-4 text-center text-rose-500">
              Income Band vs Churn
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[...data.incomeBandChart].sort((a, b) => {
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

          {/* Avg Credit Score */}
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
                      fill={entry.label === "Retained" ? "#fda4af" : "#f43f5e"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

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
              onClick={() => allChecked && navigate("/upload")}
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
