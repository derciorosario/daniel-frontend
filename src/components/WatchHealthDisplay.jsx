const WatchHealthDisplay = ({ readings, loading }) => {
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

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 Latest Health Readings</h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-red-50 rounded-xl p-3">
          <p className="text-xs text-gray-500">❤️ Heart Rate</p>
          <p className="text-lg font-bold text-gray-800">
            {latest.heartRate !== null ? `${latest.heartRate} BPM` : '--'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {latest.createdAt ? new Date(latest.createdAt).toLocaleString() : ''}
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xs text-gray-500">🫁 SpO₂</p>
          <p className="text-lg font-bold text-gray-800">
            {latest.spo2 !== null ? `${latest.spo2}%` : '--'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {latest.createdAt ? new Date(latest.createdAt).toLocaleString() : ''}
          </p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3">
          <p className="text-xs text-gray-500">🩸 Blood Pressure</p>
          <p className="text-lg font-bold text-gray-800">
            {latest.bloodPressure || '--'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {latest.createdAt ? new Date(latest.createdAt).toLocaleString() : ''}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500">📈 Total Readings</p>
          <p className="text-lg font-bold text-gray-800">{readings.length}</p>
        </div>
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
            {readings.slice(0, 10).map((r, i) => (
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
