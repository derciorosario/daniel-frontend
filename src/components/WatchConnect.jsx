import { useState, useEffect, useRef } from 'react';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { isNative } from '../api/client';

const HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
const HEART_RATE_CHARACTERISTIC = '00002a37-0000-1000-8000-00805f9b34fb';
const BATTERY_SERVICE = '0000180f-0000-1000-8000-00805f9b34fb';
const BATTERY_CHARACTERISTIC = '00002a19-0000-1000-8000-00805f9b34fb';
const DEVICE_INFORMATION_SERVICE = '0000180a-0000-1000-8000-00805f9b34fb';
const HIWATCH_UART_SERVICE = '6e400801-b5a3-f393-e0a9-e50e24dcca9d';
const HIWATCH_UART_RX = '6e400003-b5a3-f393-e0a9-e50e24dcca9d';

const normalizeUUID = (uuid) => String(uuid || '').toLowerCase();

const getBytes = (value) => {
  if (!value) return [];
  if (value instanceof DataView) {
    return Array.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
  }
  if (value instanceof Uint8Array) return Array.from(value);
  if (Array.isArray(value)) return Array.from(value);
  try { return Array.from(value); } catch { return []; }
};

const bytesToHex = (value) => {
  return getBytes(value)
    .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
};

const decodeHiWatchHealth = (bytes) => {
  const result = {
    heartRate: null,
    spo2: null,
    systolic: null,
    diastolic: null,
    bloodPressure: null,
  };

  if (!bytes || bytes.length < 20) return result;

  result.heartRate = bytes[bytes.length - 1];
  result.systolic = bytes[bytes.length - 2];
  result.diastolic = bytes[bytes.length - 3];
  result.bloodPressure = `${result.diastolic}/${result.systolic}`;
  result.spo2 = bytes[bytes.length - 4];

  return result;
};

export default function WatchConnect({ onHealthUpdate, onDisconnect }) {
  const [initialized, setInitialized] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [status, setStatus] = useState('');
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [watchHeartRate, setWatchHeartRate] = useState(null);
  const [watchSpo2, setWatchSpo2] = useState(null);
  const [watchBloodPressure, setWatchBloodPressure] = useState(null);
  const [logs, setLogs] = useState([]);

  const connectedRef = useRef(null);
  const healthRef = useRef({ heartRate: null, spo2: null, bloodPressure: null });

  const addLog = (message) => {
    setLogs(prev => [...prev.slice(-499), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    if (!isNative) return;
    BleClient.initialize()
      .then(() => {
        setInitialized(true);
        addLog('Bluetooth LE initialized.');
      })
      .catch(err => {
        console.error(err);
        addLog(`BLE initialization failed: ${err.message}`);
      });
  }, []);

  const startScan = async () => {
    try {
      setDevices([]);
      setScanning(true);
      setStatus('Scanning...');
      addLog('Starting BLE scan...');

      await BleClient.requestLEScan({}, (result) => {
        const device = {
          ...result,
          deviceId: result?.device?.deviceId || result?.deviceId,
          name: result?.device?.name || result?.name,
          localName: result?.device?.localName || result?.localName,
        };

        if (!device.deviceId) return;

        setDevices(prev => {
          if (prev.some(d => d.deviceId === device.deviceId)) return prev;
          addLog(`Found device: ${device.name || device.localName || device.deviceId}`);
          return [...prev, device];
        });
      });
    } catch (err) {
      setScanning(false);
      addLog(`Scan error: ${err.message}`);
    }
  };

  const stopScan = async () => {
    try {
      await BleClient.stopLEScan();
      setScanning(false);
      addLog('Scan stopped.');
    } catch (err) {
      addLog(`Stop scan error: ${err.message}`);
    }
  };

  const readBattery = async (deviceId) => {
    try {
      const value = await BleClient.read(deviceId, BATTERY_SERVICE, BATTERY_CHARACTERISTIC);
      const bytes = getBytes(value);
      if (bytes.length > 0 && bytes[0] <= 100) {
        setBatteryLevel(bytes[0]);
        addLog(`🔋 Battery: ${bytes[0]}%`);
      }
    } catch (err) {
      addLog(`Battery unavailable: ${err.message}`);
    }
  };

  const startStandardHeartRate = async (deviceId, discoveredServices) => {
    const service = discoveredServices.find(s => normalizeUUID(s.uuid) === HEART_RATE_SERVICE);
    if (!service) {
      addLog('❤️ Standard 180D Heart Rate Service not present.');
      return;
    }

    const characteristic = service.characteristics?.find(c => normalizeUUID(c.uuid) === HEART_RATE_CHARACTERISTIC);
    if (!characteristic) return;

    try {
      await BleClient.startNotifications(deviceId, HEART_RATE_SERVICE, HEART_RATE_CHARACTERISTIC, (value) => {
        const bytes = getBytes(value);
        if (bytes.length < 2) return;
        const flags = bytes[0];
        const bpm = flags & 0x01 ? bytes[1] | (bytes[2] << 8) : bytes[1];
        setWatchHeartRate(bpm);
        addLog(`❤️ Standard HR: ${bpm} BPM`);
      });
      addLog('Standard HR listener ACTIVE.');
    } catch (err) {
      addLog(`Standard HR listener failed: ${err.message}`);
    }
  };

  const startHiWatchHealthListener = async (deviceId) => {
    try {
      addLog('⌚ Starting HiWatch NUS health listener...');

      await BleClient.startNotifications(deviceId, HIWATCH_UART_SERVICE, HIWATCH_UART_RX, (value) => {
        const bytes = getBytes(value);
        if (!bytes.length) return;

        const health = decodeHiWatchHealth(bytes);

        if (health.heartRate !== null) {
          healthRef.current.heartRate = health.heartRate;
          setWatchHeartRate(health.heartRate);
        }

        if (health.spo2 !== null) {
          healthRef.current.spo2 = health.spo2;
          setWatchSpo2(health.spo2);
        }

        if (health.bloodPressure !== null) {
          healthRef.current.bloodPressure = health.bloodPressure;
          setWatchBloodPressure(health.bloodPressure);
        }

        const displayed = {
          heartRate: healthRef.current.heartRate,
          spo2: healthRef.current.spo2,
          bloodPressure: healthRef.current.bloodPressure,
          battery: batteryLevel,
          deviceId,
          timestamp: Date.now(),
        };

        if (onHealthUpdate) onHealthUpdate(displayed);
        addLog(`⌚ NUS: ${bytesToHex(value)}`);
      });

      addLog('⌚ HiWatch NUS listener ACTIVE.');
    } catch (err) {
      console.error('NUS listener error:', err);
      addLog(`NUS listener failed: ${err.message}`);
    }
  };

  const discoverServices = async (deviceId) => {
    try {
      const discovered = await BleClient.getServices(deviceId);

      if (discovered.some(s => normalizeUUID(s.uuid) === BATTERY_SERVICE)) {
        await readBattery(deviceId);
      }

      const infoService = discovered.find(s => normalizeUUID(s.uuid) === DEVICE_INFORMATION_SERVICE);
      if (infoService) {
        addLog('Device info service found.');
      }

      await startStandardHeartRate(deviceId, discovered);

      const nus = discovered.find(s => normalizeUUID(s.uuid) === HIWATCH_UART_SERVICE);
      if (nus) {
        addLog('⌚ NUS service found.');
        const rx = nus.characteristics?.find(c => normalizeUUID(c.uuid) === HIWATCH_UART_RX);
        if (rx) {
          addLog('⌚ NUS RX characteristic found.');
          await startHiWatchHealthListener(deviceId);
        } else {
          addLog('NUS RX characteristic missing.');
        }
      }

      return discovered;
    } catch (err) {
      console.error(err);
      addLog(`Service discovery failed: ${err.message}`);
      return [];
    }
  };

  const connectDevice = async (device) => {
    try {
      setStatus(`Connecting to ${device.name || device.localName || device.deviceId}...`);
      addLog(`Connecting to ${device.deviceId}...`);

      await BleClient.connect(device.deviceId, () => {
        addLog('⌚ Watch disconnected.');
        connectedRef.current = null;
        setConnectedDevice(null);
      });

      connectedRef.current = device;
      setConnectedDevice(device);
      setStatus('Connected.');
      addLog('⌚ Watch connected.');

      setWatchHeartRate(null);
      setWatchSpo2(null);
      setWatchBloodPressure(null);
      setBatteryLevel(null);
      healthRef.current = { heartRate: null, spo2: null, bloodPressure: null };

      await discoverServices(device.deviceId);
    } catch (err) {
      console.error(err);
      setStatus(`Connection failed: ${err.message}`);
      addLog(`Connection failed: ${err.message}`);
    }
  };

  const disconnect = async () => {
    const device = connectedRef.current || connectedDevice;
    if (!device) return;

    try {
      try {
        await BleClient.stopNotifications(device.deviceId, HIWATCH_UART_SERVICE, HIWATCH_UART_RX);
      } catch {}

      try {
        await BleClient.stopNotifications(device.deviceId, HEART_RATE_SERVICE, HEART_RATE_CHARACTERISTIC);
      } catch {}

      await BleClient.disconnect(device.deviceId);

      connectedRef.current = null;
      setConnectedDevice(null);
      setWatchHeartRate(null);
      setWatchSpo2(null);
      setWatchBloodPressure(null);
      setBatteryLevel(null);
      addLog('Disconnected.');

      if (onDisconnect) onDisconnect();
    } catch (err) {
      addLog(`Disconnect error: ${err.message}`);
    }
  };

  if (!isNative) {
    return null;
  }

  if (connectedDevice) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">⌚ Watch Connected</h3>
          <button onClick={disconnect} className="bg-gray-700 text-white px-4 py-2 rounded text-sm">
            Disconnect
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">❤️ Heart Rate</p>
            <p className="text-xl font-bold text-gray-800">{watchHeartRate !== null ? `${watchHeartRate} BPM` : '--'}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">🫁 SpO₂</p>
            <p className="text-xl font-bold text-gray-800">{watchSpo2 !== null ? `${watchSpo2}%` : '--'}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">🩸 Blood Pressure</p>
            <p className="text-xl font-bold text-gray-800">{watchBloodPressure || '--'}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">🔋 Battery</p>
            <p className="text-xl font-bold text-gray-800">{batteryLevel !== null ? `${batteryLevel}%` : '--'}</p>
          </div>
        </div>

        {logs.length > 0 && (
          <div className="bg-black text-green-400 rounded p-3 max-h-48 overflow-y-auto font-mono text-xs">
            {logs.map((log, i) => <div key={i}>{log}</div>)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 text-black">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">⌚ Connect Smartwatch</h3>
      <p className="text-xs text-gray-500 mb-3">
        {initialized ? 'Ready to scan for BLE devices.' : 'Initializing Bluetooth...'}
      </p>

      <div className="flex gap-2 mb-3">
        {!scanning ? (
          <button onClick={startScan} disabled={!initialized} className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400 text-sm">
            Scan Devices
          </button>
        ) : (
          <button onClick={stopScan} className="bg-red-600 text-white px-4 py-2 rounded text-sm">
            Stop Scan
          </button>
        )}
      </div>

      {status && <p className="text-xs text-gray-600 mb-2">Status: <strong>{status}</strong></p>}

      <div className="space-y-2">
        {devices.map(device => (
          <div key={device.deviceId} className="border rounded p-3 flex justify-between items-center">
            <div>
              <div className="font-bold text-sm">{device.name || device.localName || 'Unnamed Device'}</div>
              <div className="font-mono text-xs">{device.deviceId}</div>
            </div>
            {connectedDevice?.deviceId === device.deviceId ? (
              <span className="text-green-600 font-bold text-sm">Connected</span>
            ) : (
              <button onClick={() => connectDevice(device)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">
                Connect
              </button>
            )}
          </div>
        ))}
      </div>

      {logs.length > 0 && (
        <div className="bg-black text-green-400 rounded p-3 max-h-48 overflow-y-auto font-mono text-xs mt-3">
          {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      )}
    </div>
  );
}
