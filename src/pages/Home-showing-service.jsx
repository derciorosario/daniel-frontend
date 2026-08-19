import React, { useState, useEffect } from 'react'
import { BleClient } from '@capacitor-community/bluetooth-le'
import { isNative } from '../api/client'

const TEST_MESSAGE = 'Hello from my React app!'

export default function Home() {
  const [scanning, setScanning] = useState(false)
  const [devices, setDevices] = useState([])
  const [connectedDevice, setConnectedDevice] = useState(null)
  const [status, setStatus] = useState('')
  const [logs, setLogs] = useState([])
  const [initialized, setInitialized] = useState(false)

  // New state
  const [services, setServices] = useState([])
  const [writableCharacteristics, setWritableCharacteristics] = useState([])
  const [discoveringServices, setDiscoveringServices] = useState(false)
  const [sending, setSending] = useState(false)

  const addLog = (message) => {
    setLogs(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`
    ])
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

  // ---------------------------------------------------------
  // SCAN
  // ---------------------------------------------------------

  const startScan = async () => {
    if (!isNative) {
      setStatus(
        'Bluetooth LE is only available on native devices (Android/iOS).'
      )
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

          result={...result, deviceId: (result?.device?.deviceId || result?.deviceId)}

          setDevices(prev => {
            const exists = prev.find(
              d => d.deviceId === result.deviceId
            )

            if (exists) return prev

            addLog(
              `Found: ${
                result.name ||
                result.localName ||
                result.deviceId
              }`
            )

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

  // ---------------------------------------------------------
  // STOP SCAN
  // ---------------------------------------------------------

  const stopScan = async () => {
    try {
      await BleClient.stopLEScan()

      setScanning(false)
      setStatus('Scan stopped')

      addLog('Scan stopped')
    } catch (err) {
      setStatus(`Stop error: ${err.message}`)
      addLog(`Stop error: ${err.message}`)
    }
  }

  // ---------------------------------------------------------
  // DISCOVER SERVICES
  // ---------------------------------------------------------

  const discoverServices = async (deviceId) => {
    try {
      setDiscoveringServices(true)

      addLog('Discovering GATT services...')

      const discoveredServices =
        await BleClient.getServices(deviceId)

      console.log(
        '========== ALL SERVICES =========='
      )

      console.log(
        JSON.stringify(
          discoveredServices,
          null,
          2
        )
      )

      console.log(
        '=================================='
      )


      setServices(discoveredServices)

     // alert(JSON.stringify(discoveredServices))

      const writable = []

      for (const service of discoveredServices) {
        console.log(
          'SERVICE:',
          service.uuid
        )

        if (!service.characteristics) {
          continue
        }

        for (const characteristic of service.characteristics) {
          console.log(
            'CHARACTERISTIC:',
            characteristic.uuid
          )

          console.log(
            'PROPERTIES:',
            characteristic.properties
          )

          const properties =
            characteristic.properties || {}

          const canWrite =
            properties.write === true

          const canWriteWithoutResponse =
            properties.writeWithoutResponse === true

          if (
            canWrite ||
            canWriteWithoutResponse
          ) {
            const item = {
              serviceUUID: service.uuid,
              characteristicUUID:
                characteristic.uuid,
              properties
            }

            writable.push(item)

            addLog(
              `Writable characteristic found: ${characteristic.uuid}`
            )
          }
        }
      }

      setWritableCharacteristics(writable)

      addLog(
        `Service discovery completed. Found ${discoveredServices.length} service(s).`
      )

      addLog(
        `Found ${writable.length} writable characteristic(s).`
      )

      if (writable.length === 0) {
        addLog(
          'No writable characteristics found.'
        )
      }

      return discoveredServices

    } catch (err) {
      console.error(
        'Service discovery error:',
        err
      )

      addLog(
        `Service discovery error: ${err.message}`
      )

      setStatus(
        `Service discovery error: ${err.message}`
      )

      return []
    } finally {
      setDiscoveringServices(false)
    }
  }

  // ---------------------------------------------------------
  // CONNECT
  // ---------------------------------------------------------

  const connectDevice = async (device) => {

    //alert(JSON.stringify(device))
    try {
      const name =
        device.name ||
        device.localName ||
        device.deviceId

       // alert(device.deviceId)
        console.log(JSON.stringify(device))



      setStatus(`Connecting to ${name}...`)

      addLog(
        `Connecting to ${name}...`
      )

      await BleClient.connect(
        device.deviceId,
        () => {
          setConnectedDevice(null)
          setServices([])
          setWritableCharacteristics([])

          setStatus('Device disconnected')

          addLog(
            'Device disconnected'
          )
        }
      )

      setConnectedDevice(device)

      setStatus(
        `Connected to ${name}`
      )

      addLog('Connected!')

      // Automatically discover services
      await discoverServices(
        device.deviceId
      )

      setStatus(
        `Connected to ${name}. Services discovered.`
      )

    } catch (err) {
      setStatus(
        `Connection error: ${err.message}`
      )

      addLog(
        `Connection error: ${err.message}`
      )
    }
  }

  // ---------------------------------------------------------
  // DISCONNECT
  // ---------------------------------------------------------

  const disconnectDevice = async () => {
    if (!connectedDevice) return

    try {
      await BleClient.disconnect(
        connectedDevice.deviceId
      )

      setConnectedDevice(null)
      setServices([])
      setWritableCharacteristics([])

      setStatus('Disconnected')

      addLog('Disconnected')

    } catch (err) {
      setStatus(
        `Disconnect error: ${err.message}`
      )

      addLog(
        `Disconnect error: ${err.message}`
      )
    }
  }

  // ---------------------------------------------------------
  // SEND MESSAGE
  // ---------------------------------------------------------

  const sendMessage = async (item) => {
    if (!connectedDevice) {
      setStatus(
        'No device connected.'
      )

      return
    }

    try {
      setSending(true)

      setStatus(
        'Sending test message...'
      )

      addLog(
        `Sending message to ${item.characteristicUUID}`
      )

      const data =
        new TextEncoder().encode(
          TEST_MESSAGE
        )

      console.log(
        'Sending message:',
        TEST_MESSAGE
      )

      console.log(
        'Service UUID:',
        item.serviceUUID
      )

      console.log(
        'Characteristic UUID:',
        item.characteristicUUID
      )

      console.log(
        'Bytes:',
        data
      )

      // Normal WRITE
      if (
        item.properties.write === true
      ) {
        await BleClient.write(
          connectedDevice.deviceId,
          item.serviceUUID,
          item.characteristicUUID,
          data
        )
      }

      // WRITE WITHOUT RESPONSE
      else if (
        item.properties.writeWithoutResponse === true
      ) {
        await BleClient.writeWithoutResponse(
          connectedDevice.deviceId,
          item.serviceUUID,
          item.characteristicUUID,
          data
        )
      }

      addLog(
        `Message written successfully: "${TEST_MESSAGE}"`
      )

      setStatus(
        'Message sent successfully.'
      )

    } catch (err) {
      console.error(
        'Send message error:',
        err
      )

      addLog(
        `Send error: ${err.message}`
      )

      setStatus(
        `Send error: ${err.message}`
      )

    } finally {
      setSending(false)
    }
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div className="p-4 max-w-3xl mx-auto !text-black">

      <h1 className="text-2xl font-bold mb-4">
        Smart Watch Bluetooth LE
      </h1>

      {!isNative && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Bluetooth LE scanning is only available
          on native devices (Android/iOS).
        </div>
      )}

      {/* SCAN BUTTONS */}

      <div className="mb-4 flex gap-2">

        {!scanning ? (
          <button
            onClick={startScan}
            disabled={!isNative || !initialized}
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

      {/* CONNECTED DEVICE */}

      {connectedDevice && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded p-3">

          <p className="text-green-700 font-bold">
            Connected:
            {' '}
            {connectedDevice.name ||
              connectedDevice.localName ||
              connectedDevice.deviceId}
          </p>

          <p className="text-sm text-gray-600 break-all">
            ID: {connectedDevice.deviceId}
          </p>

          <button
            onClick={disconnectDevice}
            className="mt-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm"
          >
            Disconnect
          </button>

        </div>
      )}

      {/* STATUS */}

      {status && (
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <p className="text-gray-700">
            {status}
          </p>
        </div>
      )}

      {/* DISCOVERED DEVICES */}

      <div className="mb-6">

        <h2 className="text-xl font-semibold mb-2">
          Discovered Devices ({devices.length})
        </h2>

        {devices.length === 0 &&
          !scanning && (
            <p className="text-gray-500">
              No devices found. Tap "Start Scan"
              to search for smart watches.
            </p>
          )}

        <div className="space-y-2">

          {devices.map((_device) => {

            let device={..._device,
              deviceId:_device?.device?.deviceId || _device?.deviceId,
              name:_device?.device?.name || _device?.name,
             }

            const name =
              device.name ||
              device.localName ||
              'Unnamed Device'

            const isConnected =
              connectedDevice?.device?.deviceId ===
              device.deviceId

            return (
              <div
                key={device.deviceId}
                className="border p-3 rounded flex justify-between items-center"
              >

                <div>

                  <p className="font-medium">
                    {name}
                  </p>

                  <p className="text-sm text-gray-500 break-all">
                    ID: {device.deviceId}
                  </p>

                  {device.rssi !== undefined && (
                    <p className="text-sm text-gray-500">
                      RSSI: {device.rssi}
                    </p>
                  )}

                </div>

                {!isConnected && (
                  <button
                    onClick={() =>
                      connectDevice(device)
                    }
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm"
                  >
                    Connect
                  </button>
                )}

                {isConnected && (
                  <span className="text-green-600 text-sm font-bold">
                    Connected
                  </span>
                )}

              </div>
            )
          })}

        </div>
      </div>

      {/* SERVICES */}

      {connectedDevice && (
        <div className="mb-6">

          <div className="flex items-center justify-between mb-2">

            <h2 className="text-xl font-semibold">
              GATT Services
            </h2>

            <button
              onClick={() =>
                discoverServices(
                  connectedDevice.deviceId
                )
              }
              disabled={discoveringServices}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded text-sm disabled:bg-gray-400"
            >
              {discoveringServices
                ? 'Discovering...'
                : 'Refresh Services'}
            </button>

          </div>

          {services.length === 0 && (
            <p className="text-gray-500">
              No services discovered.
            </p>
          )}

          <div className="space-y-2">

            {services.map(
              (service, serviceIndex) => (

                <div
                  key={`${service.uuid}-${serviceIndex}`}
                  className="border rounded p-3 bg-gray-50"
                >

                  <p className="font-semibold">
                    Service
                  </p>

                  <p className="text-sm font-mono break-all">
                    {service.uuid}
                  </p>

                  <p className="mt-2 font-semibold">
                    Characteristics
                  </p>

                  {service.characteristics?.map(
                    (characteristic, index) => (

                      <div
                        key={`${characteristic.uuid}-${index}`}
                        className="ml-3 mt-2 p-2 bg-white border rounded"
                      >

                        <p className="text-sm font-mono break-all">
                          {characteristic.uuid}
                        </p>

                        <p className="text-xs text-gray-600 mt-1">
                          {JSON.stringify(
                            characteristic.properties
                          )}
                        </p>

                      </div>

                    )
                  )}

                </div>

              )
            )}

          </div>

        </div>
      )}

      {/* WRITABLE CHARACTERISTICS */}

      {connectedDevice && (
        <div className="mb-6">

          <h2 className="text-xl font-semibold mb-2">
            Writable Characteristics
          </h2>

          {writableCharacteristics.length === 0 ? (

            <div className="border border-yellow-300 bg-yellow-50 rounded p-3">
              <p className="text-yellow-700">
                No writable characteristics found.
              </p>
            </div>

          ) : (

            <div className="space-y-3">

              {writableCharacteristics.map(
                (item, index) => (

                  <div
                    key={`${item.serviceUUID}-${item.characteristicUUID}`}
                    className="border rounded p-3"
                  >

                    <p className="font-semibold">
                      Candidate #{index + 1}
                    </p>

                    <p className="text-sm mt-2">
                      <strong>Service:</strong>
                    </p>

                    <p className="text-xs font-mono break-all">
                      {item.serviceUUID}
                    </p>

                    <p className="text-sm mt-2">
                      <strong>
                        Characteristic:
                      </strong>
                    </p>

                    <p className="text-xs font-mono break-all">
                      {item.characteristicUUID}
                    </p>

                    <p className="text-sm mt-2">
                      <strong>Properties:</strong>
                    </p>

                    <p className="text-xs font-mono">
                      {JSON.stringify(
                        item.properties
                      )}
                    </p>

                    <button
                      onClick={() =>
                        sendMessage(item)
                      }
                      disabled={sending}
                      className="mt-3 bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
                    >
                      {sending
                        ? 'Sending...'
                        : `Send "${TEST_MESSAGE}"`}
                    </button>

                  </div>

                )
              )}

            </div>

          )}

        </div>
      )}

      {/* LOGS */}

      {logs.length > 0 && (
        <div className="mt-6">

          <h2 className="text-xl font-semibold mb-2">
            Logs
          </h2>

          <div className="bg-gray-100 p-2 rounded text-sm font-mono max-h-64 overflow-y-auto">

            {logs.map((log, i) => (
              <div key={i}>
                {log}
              </div>
            ))}

          </div>

        </div>
      )}

    </div>
  )
}