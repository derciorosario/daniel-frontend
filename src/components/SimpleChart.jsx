const SimpleChart = ({ data, color = "#3b82f6", type = "line", className = "", height = '128px', showLabels = true }) => {
  const values = data.map((d) => d.level);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  const padding = 10;
  const chartHeight = 100 - padding * 2;

  if (type === "bar") {
    const barWidth = 100 / data.length;
    const bars = data.map((d, i) => {
      const barHeight = ((d.level - minValue) / range) * chartHeight;
      const x = i * barWidth + barWidth * 0.15;
      const y = 100 - padding - barHeight;
      const w = barWidth * 0.7;
      const h = barHeight;
      return { x, y, w, h, value: d.level, label: d.time };
    });

    return (
      <div className={`w-full bg-gray-50 rounded-lg p-2 ${className}`} style={{ height }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {bars.map((bar, i) => (
            <g key={i}>
              <rect
                x={bar.x}
                y={bar.y}
                width={bar.w}
                height={bar.h}
                fill={color}
                opacity="0.8"
                rx="1"
              />
              {showLabels && (
                <text
                  x={bar.x + bar.w / 2}
                  y={bar.y - 2}
                  textAnchor="middle"
                  className="text-[4px] fill-gray-700 font-medium"
                >
                  {bar.value}
                </text>
              )}
              {showLabels && (
                <text
                  x={bar.x + bar.w / 2}
                  y={100 - 1}
                  textAnchor="middle"
                  className="text-[3px] fill-gray-500"
                >
                  {bar.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    );
  }

  const dots = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - padding - ((d.level - minValue) / range) * chartHeight;
      return { x, y, value: d.level, label: d.time };
    });

  const pointCoords = dots.map((dot) => `${dot.x},${dot.y}`).join(" ");

  return (
    <div className={`w-full bg-gray-50 rounded-lg p-2 ${className}`} style={{ height: '300px' }}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polyline
          points={pointCoords}
          fill="none"
          stroke={color}
          strokeWidth="2"
          className="drop-shadow-sm"
        />
        <polyline
          points={pointCoords}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {dots.map((dot, i) => (
          <g key={i}>
            <circle cx={dot.x} cy={dot.y} r="3" fill={color} />
            {showLabels && (
              <text
                x={dot.x}
                y={dot.y - 4}
                textAnchor="middle"
                className="text-[4px] fill-gray-700 font-medium"
              >
                {dot.value}
              </text>
            )}
            {showLabels && (
              <text
                x={dot.x}
                y={100 - 1}
                textAnchor="middle"
                className="text-[3px] fill-gray-500"
              >
                {dot.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

export default SimpleChart;
