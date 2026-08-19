const SimpleChart = ({ data, color = "#3b82f6" }) => {
  const values = data.map((d) => d.level);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d.level - minValue) / range) * 80;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="w-full h-32 bg-gray-50 rounded-lg p-2">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          className="drop-shadow-sm"
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default SimpleChart;
