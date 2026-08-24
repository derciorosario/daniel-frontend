import { useState } from "react";
import HealthChart from "./HealthChart";
import EnlargedChartDialog from "./EnlargedChartDialog";

const translations = {
  pt: {
    healthReadings: "📊 Leituras de Saúde",
    loading: "Carregando leituras...",
    noReadings: "Sem leituras disponíveis.",
    heartRate: "❤️ Frequência Cardíaca",
    spo2: "🫁 SpO₂",
    bloodPressure: "🩸 Pressão Arterial",
    totalReadings: "📈 Total de Leituras",
    latestHealthReadings: "📊 Últimas Leituras de Saúde",
    recentReadings: "Leituras Recentes",
    viewAll: "Ver Tudo",
    viewLarger: "Ver Maior",
    notEnoughData: "Dados insuficientes para exibir o gráfico.",
    date: "Data",
    hr: "FC",
    spo2Label: "SpO₂",
    bp: "PA",
    bpm: "BPM",
    percent: "%",
    periodHourly: "Hora",
    periodDaily: "Dia",
    periodWeekly: "Semana",
    periodMonthly: "Mês",
    chartHR: "FC",
    chartSpO2: "SpO₂",
    chartBP: "PA (Sistólica)",
    line: "Linha",
    bar: "Barra",
  },
  en: {
    healthReadings: "📊 Health Readings",
    loading: "Loading readings...",
    noReadings: "No readings available yet.",
    heartRate: "❤️ Heart Rate",
    spo2: "🫁 SpO₂",
    bloodPressure: "🩸 Blood Pressure",
    totalReadings: "📈 Total Readings",
    latestHealthReadings: "📊 Latest Health Readings",
    recentReadings: "Recent Readings",
    viewAll: "View All",
    viewLarger: "View Larger",
    notEnoughData: "Not enough data to show chart.",
    date: "Date",
    hr: "HR",
    spo2Label: "SpO₂",
    bp: "BP",
    bpm: "BPM",
    percent: "%",
    periodHourly: "Hourly",
    periodDaily: "Daily",
    periodWeekly: "Weekly",
    periodMonthly: "Monthly",
    chartHR: "HR",
    chartSpO2: "SpO₂",
    chartBP: "BP (Systolic)",
    line: "Line",
    bar: "Bar",
  },
};

const WatchHealthDisplay = ({ readings, loading, onViewAll, language = "en", setLanguage }) => {
  const t = translations[language] || translations.en;
  const [chartMetric, setChartMetric] = useState("heartRate");
  const [chartType, setChartType] = useState("line");
  const [period, setPeriod] = useState("daily");
  const [isEnlargedChartOpen, setIsEnlargedChartOpen] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.healthReadings}</h3>
        <p className="text-xs text-gray-500">{t.loading}</p>
      </div>
    );
  }

  if (!readings || readings.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.healthReadings}</h3>
        <p className="text-xs text-gray-500">{t.noReadings}</p>
      </div>
    );
  }

  const getFilteredReadings = () => {
    const now = new Date();
    let cutoff;
    if (period === "hourly") {
      cutoff = new Date(now.getTime() - 60 * 60 * 1000);
    } else if (period === "daily") {
      cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (period === "weekly") {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    return readings.filter((r) => new Date(r.createdAt) >= cutoff);
  };

  const getChartLabel = (date) => {
    if (period === "hourly") {
      return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (period === "daily") {
      return new Date(date).toLocaleDateString([], { month: "short", day: "numeric" });
    }
    if (period === "weekly") {
      return new Date(date).toLocaleDateString([], { month: "short", day: "numeric" });
    }
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const week = Math.ceil((d.getDate() + start.getDay()) / 7);
    return `W${week}`;
  };

  const filteredReadings = getFilteredReadings();
  const latest = filteredReadings[0] || readings[0];
  const chartData = filteredReadings
    .slice()
    .reverse()
    .map((r) => ({
      time: r.createdAt ? getChartLabel(r.createdAt) : "",
      level:
        chartMetric === "heartRate"
          ? r.heartRate
          : chartMetric === "spo2"
          ? r.spo2
          : r.systolic,
    }))
    .filter((d) => d.level !== null && d.level !== undefined);

  const displayRecent = filteredReadings.slice(0, 6);

  const chartColor =
    chartMetric === "heartRate" ? "#ef4444" : chartMetric === "spo2" ? "#3b82f6" : "#8b5cf6";

  const chartTitle =
    chartMetric === "heartRate"
      ? t.chartHR
      : chartMetric === "spo2"
      ? t.chartSpO2
      : t.chartBP;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.latestHealthReadings}</h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">{t.heartRate}</p>
          <p className="text-lg font-bold text-gray-800">
            {latest.heartRate !== null ? `${latest.heartRate} ${t.bpm}` : '--'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {latest.createdAt ? new Date(latest.createdAt).toLocaleString() : ''}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">{t.spo2}</p>
          <p className="text-lg font-bold text-gray-800">
            {latest.spo2 !== null ? `${latest.spo2}${t.percent}` : '--'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {latest.createdAt ? new Date(latest.createdAt).toLocaleString() : ''}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">{t.bloodPressure}</p>
          <p className="text-lg font-bold text-gray-800">
            {latest.bloodPressure || '--'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {latest.createdAt ? new Date(latest.createdAt).toLocaleString() : ''}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">{t.totalReadings}</p>
          <p className="text-lg font-bold text-gray-800">{filteredReadings.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">{chartTitle}</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "heartRate", label: t.chartHR },
              { key: "spo2", label: t.chartSpO2 },
              { key: "bloodPressure", label: t.chartBP },
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
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {[
            { key: "hourly", label: t.periodHourly },
            { key: "daily", label: t.periodDaily },
            { key: "weekly", label: t.periodWeekly },
            { key: "monthly", label: t.periodMonthly },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setPeriod(option.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                period === option.key
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setChartType("line")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                chartType === "line"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.line}
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                chartType === "bar"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.bar}
            </button>
          </div>
        </div>
        {chartData.length > 1 ? (
          <HealthChart data={chartData} color={chartColor} type={chartType} showLabels={false} />
        ) : (
          <p className="text-xs text-gray-500 text-center py-8">{t.notEnoughData}</p>
        )}
        {chartData.length > 1 && (
          <div className="mt-3 text-center">
            <button
              onClick={() => setIsEnlargedChartOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
            >
              {t.viewLarger}
            </button>
          </div>
        )}
      </div>

      <EnlargedChartDialog
        open={isEnlargedChartOpen}
        onClose={() => setIsEnlargedChartOpen(false)}
        chartData={chartData}
        chartColor={chartColor}
        chartType={chartType}
        chartMetric={chartMetric}
      />

      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-gray-700">{t.recentReadings}</h4>
        {filteredReadings.length > 6 && (
          <button
            onClick={onViewAll}
            className="text-xs text-blue-500 hover:text-blue-600 font-medium"
          >
            {t.viewAll}
          </button>
        )}
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-xs text-gray-700">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left text-gray-700 font-medium">{t.date}</th>
              <th className="p-2 text-left text-gray-700 font-medium">{t.hr}</th>
              <th className="p-2 text-left text-gray-700 font-medium">{t.spo2Label}</th>
              <th className="p-2 text-left text-gray-700 font-medium">{t.bp}</th>
            </tr>
          </thead>
          <tbody>
            {displayRecent.map((r, i) => (
              <tr key={r.id || i} className="border-t text-gray-700">
                <td className="p-2 text-gray-700">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '--'}</td>
                <td className="p-2 text-gray-700">{r.heartRate !== null ? `${r.heartRate} ${t.bpm}` : '--'}</td>
                <td className="p-2 text-gray-700">{r.spo2 !== null ? `${r.spo2}${t.percent}` : '--'}</td>
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
