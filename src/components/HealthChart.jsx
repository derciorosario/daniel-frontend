import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const getColorByValue = (value, colorBy) => {
  if (colorBy === "heartRate") {
    if (value > 120) return "#ef4444";
    if (value >= 101) return "#f59e0b";
    if (value >= 60) return "#22c55e";
    return "#3b82f6";
  }
  if (colorBy === "spo2") {
    if (value >= 95) return "#22c55e";
    if (value >= 90) return "#f59e0b";
    return "#ef4444";
  }
  if (colorBy === "bloodPressure") {
    if (value > 140) return "#ef4444";
    if (value >= 90) return "#22c55e";
    return "#3b82f6";
  }
  if (colorBy === "hydration") {
    if (value < 50) return "#ef4444";
    if (value <= 80) return "#22c55e";
    return "#f59e0b";
  }
  return null;
};

const CustomDot = (props) => {
  const { cx, cy, payload, colorBy } = props;
  const fill = getColorByValue(payload.value, colorBy) || props.fill || "#3b82f6";
  return <circle cx={cx} cy={cy} r={5} fill={fill} stroke={fill} strokeWidth={2} />;
};

const CustomBar = (props) => {
  const { x, y, width, height, payload, colorBy } = props;
  const fill = getColorByValue(payload.value, colorBy) || props.fill || "#3b82f6";
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      opacity="0.85"
      rx="4"
      ry="4"
    />
  );
};

const HealthChart = ({
  data = [],
  color = "#3b82f6",
  type = "line",
  className = "",
  height = "300px",
  showLabels = true,
  colorBy,
}) => {
  const chartData = data.map((d) => ({
    name: showLabels ? d.time : "",
    value: d.level,
  }));

  if (type === "bar") {
    return (
      <div className={`w-full ${className}`} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              interval={showLabels ? "preserveStartEnd" : "none"}
            />
            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "12px",
              }}
            />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              shape={colorBy ? <CustomBar colorBy={colorBy} /> : undefined}
              fill={color}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            interval={showLabels ? "preserveStartEnd" : "none"}
          />
          <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "12px",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={
              colorBy
                ? <CustomDot colorBy={colorBy} />
                : { fill: color, strokeWidth: 2, r: 4 }
            }
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HealthChart;
