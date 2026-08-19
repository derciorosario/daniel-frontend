import { useState } from "react";
import SimpleChart from "./SimpleChart";

const WatchHealthDisplay = ({ readings, loading, onViewAll }) => {
  const [chartMetric, setChartMetric] = useState("heartRate");
  const [chartType, setChartType] = useState("line");

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 Health Readings</h3>
        <p className="text-xs text-gray-500">Loading readings...</p>
      </div>
    );
  }

  if (!readings || readings.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 Health Readings</h3>
        <p className="text-xs text-gray-500">No readings available yet.</p>
      </div>
    );
  }

  const latest = readings[0];
  const recent = readings.slice(0, 6);
  const chartData = readings
    .slice()
    .reverse()
    .map((r) => ({
      time: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "",
      level:
        chartMetric === "heartRate"
          ? r.heartRate
          : chartMetric === "spo2"
          ? r.spo2
          : r.systolic,
    }))
    .filter((d) => d.level !== null && d.level !== undefined);

  const chartColor =
    chartMetric === "heartRate" ? "#ef4444" : chartMetric === "spo2" ? "#3b82f6" : "#8b5cf6";

  const chartTitle =
    chartMetric === "heartRate"
      ? "❤️ Heart Rate"
      : chartMetric === "spo2"
      ? "🫁 SpO₂"
      : "🩸 Blood Pressure (Systolic)";

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 Latest Health Readings</h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">❤️ Heart Rate</p>
          <p className="text-lg font-bold text-gray-800">
            {latest.heartRate !== null ? `${latest.heartRate} BPM` : '--'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {latest.createdAt ? new Date(latest.createdAt).toLocaleString() : ''}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">🫁 SpO₂</p>
          <p className="text-lg font-bold text-gray-800">
            {latest.spo2 !== null ? `${latest.spo2}%` : '--'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {latest.createdAt ? new Date(latest.createdAt).toLocaleString() : ''}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">🩸 Blood Pressure</p>
          <p className="text-lg font-bold text-gray-800">
            {latest.bloodPressure || '--'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {latest.createdAt ? new Date(latest.createdAt).toLocaleString() : ''}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">📈 Total Readings</p>
          <p className="text-lg font-bold text-gray-800">{readings.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">{chartTitle}</h4>
          <div className="flex space-x-2">
            {[
              { key: "heartRate", label: "HR" },
              { key: "spo2", label: "SpO₂" },
              { key: "bloodPressure", label: "BP" },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setChartMetric(option.key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  chartMetric === option.key
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
            <button
              onClick={() => setChartType("line")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                chartType === "line"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                chartType === "bar"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Bar
            </button>
          </div>
        </div>
        {chartData.length > 1 ? (
          <SimpleChart data={chartData} color={chartColor} type={chartType} />
        ) : (
          <p className="text-xs text-gray-500 text-center py-8">Not enough data to show chart.</p>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-gray-700">Recent Readings</h4>
        {readings.length > 6 && (
          <button
            onClick={onViewAll}
            className="text-xs text-blue-500 hover:text-blue-600 font-medium"
          >
            View All
          </button>
        )}
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-xs text-gray-700">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left text-gray-700 font-medium">Date</th>
              <th className="p-2 text-left text-gray-700 font-medium">❤️ HR</th>
              <th className="p-2 text-left text-gray-700 font-medium">🫁 SpO₂</th>
              <th className="p-2 text-left text-gray-700 font-medium">🩸 BP</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r, i) => (
              <tr key={r.id || i} className="border-t text-gray-700">
                <td className="p-2 text-gray-700">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '--'}</td>
                <td className="p-2 text-gray-700">{r.heartRate !== null ? `${r.heartRate} BPM` : '--'}</td>
                <td className="p-2 text-gray-700">{r.spo2 !== null ? `${r.spo2}%` : '--'}</td>
                <td className="p-2 text-gray-700">{r.bloodPressure || '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WatchHealthDisplay;
