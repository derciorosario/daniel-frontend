import React, { useState, useEffect } from 'react'
import { BleClient } from '@capacitor-community/bluetooth-le'
import { isNative } from '../api/client'

export default function Home() {
  const [scanning, setScanning] = useState(false)
  const [devices, setDevices] = useState([])
  const [connectedDevice, setConnectedDevice] = useState(null)
  const [status, setStatus] = useState('')
  const [logs, setLogs] = useState([])
  const [initialized, setInitialized] = useState(false)

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    if (!isNative) return

    BleClient.initialize()
      .then(() => {
        setInitialized(true)
        addLog('BLE initialized')
      })
      .catch(err => {
        addLog(`Init error: ${err.message}`)
      })
  }, [])

  const startScan = async () => {
    if (!isNative) {
      setStatus('Bluetooth LE is only available on native devices (Android/iOS).')
      return
    }

    setDevices([])
    setScanning(true)
    setStatus('Scanning...')
    addLog('Starting scan...')

    try {
      await BleClient.requestLEScan(
        {},
        (result) => {
          setDevices(prev => {
            const exists = prev.find(d => d.deviceId === result.deviceId)
            if (exists) return prev
            addLog(`Found: ${result.name || result.localName || result.deviceId}`)
            return [...prev, result]
          })
        }
      )
    } catch (err) {
      setStatus(`Scan error: ${err.message}`)
      setScanning(false)
      addLog(`Error: ${err.message}`)
    }
  }

  const stopScan = async () => {
    try {
      await BleClient.stopLEScan()
      setScanning(false)
      setStatus('Scan stopped')
      addLog('Scan stopped')
    } catch (err) {
      setStatus(`Stop error: ${err.message}`)
    }
  }

  const connectDevice = async (device) => {
    try {
      const name = device.name || device.localName || device.deviceId
      setStatus(`Connecting to ${name}...`)
      addLog(`Connecting to ${name}...`)

      await BleClient.connect(
        device.deviceId,
        () => {
          setConnectedDevice(null)
          setStatus('Device disconnected')
          addLog('Device disconnected')
        }
      )

      setConnectedDevice(device)
      setStatus(`Connected to ${name}`)
      addLog('Connected!')
    } catch (err) {
      setStatus(`Connection error: ${err.message}`)
      addLog(`Connection error: ${err.message}`)
    }
  }

  const disconnectDevice = async () => {
    if (!connectedDevice) return

    try {
      await BleClient.disconnect(connectedDevice.deviceId)
      setConnectedDevice(null)
      setStatus('Disconnected')
      addLog('Disconnected')
    } catch (err) {
      setStatus(`Disconnect error: ${err.message}`)
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Smart Watch Bluetooth LE</h1>

      {!isNative && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Bluetooth LE scanning is only available on native devices (Android/iOS).
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {!scanning ? (
          <button
            onClick={startScan}
            disabled={!isNative}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
          >
            Start Scan
          </button>
        ) : (
          <button
            onClick={stopScan}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Stop Scan
          </button>
        )}
      </div>

      {connectedDevice && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded p-3">
          <p className="text-green-700 font-bold">
            Connected: {connectedDevice.name || connectedDevice.localName || connectedDevice.deviceId}
          </p>
          <span>{JSON.stringify(connectedDevice)}</span>
          <button
            onClick={disconnectDevice}
            className="mt-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm"
          >
            Disconnect
          </button>
        </div>
      )}

      {status && <p className="mb-4 text-gray-700">{status}</p>}

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Discovered Devices ({devices.length})</h2>
        {devices.length === 0 && !scanning && (
          <p className="text-gray-500">No devices found. Tap "Start Scan" to search for smart watches.</p>
        )}
        <div className="space-y-2">
          {devices.map((device) => {
            const name = device.name || device.localName || 'Unnamed Device'
            const isConnected = connectedDevice?.deviceId === device.deviceId


            console.log('---xxx---devices')
            console.log({device})

            return (
              <div key={device.deviceId} className="border p-3 rounded flex justify-between items-center">
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-gray-500">ID: {device.deviceId}</p>
                  {device.rssi !== undefined && (
                    <p className="text-sm text-gray-500">RSSI: {device.rssi}</p>
                  )}
                </div>
                {!isConnected && (
                  <button
                    onClick={() => connectDevice(device)}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm"
                  >
                    Connect
                  </button>
                )}
                {isConnected && (
                  <span className="text-green-600 text-sm font-bold">Connected</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {logs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Logs</h2>
          <div className="bg-gray-100 p-2 rounded text-sm font-mono max-h-40 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
