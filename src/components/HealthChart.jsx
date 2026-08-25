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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload;
    const value = dataPoint?.value;
    const displayName = dataPoint?.originalTime || dataPoint?.name || label;
    
    return (
      <div
        className="bg-white border border-gray-200 rounded-lg shadow-lg p-2"
        style={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
      >
        <p className="text-gray-500 mb-1">{displayName}</p>
        <p className="text-gray-800 font-medium">{value !== undefined && value !== null ? value : '--'}</p>
      </div>
    );
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
  // Process data to ensure unique identifiers while preserving original time
  const chartData = data.map((d, index) => {
    // Create a unique name for the X-axis
    let name = d.time;
    if (showLabels) {
      // If there are multiple entries with the same time, add index to make it unique
      const sameTimeCount = data.filter(item => item.time === d.time).length;
      if (sameTimeCount > 1) {
        name = `${d.time} ${index + 1}`;
      }
    } else {
      name = `${index + 1}`;
    }
    
    return {
      name: name,
      value: d.level,
      originalTime: d.time, // Store original time for tooltip display
      index: index,
    };
  });

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
              content={<CustomTooltip />}
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
            content={<CustomTooltip />}
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