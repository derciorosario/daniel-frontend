import React, { useState, useEffect } from 'react'
import { BleClient } from '@capacitor-community/bluetooth-le'
import { isNative } from '../api/client'

const TEST_MESSAGE = 'Hello from my React app!'

// =========================================================
// STANDARD HEART RATE SERVICE
// =========================================================

const HEART_RATE_SERVICE =
  '0000180d-0000-1000-8000-00805f9b34fb'

const HEART_RATE_CHARACTERISTIC =
  '00002a37-0000-1000-8000-00805f9b34fb'

// =========================================================
// HIWATCH / NORDIC UART
// =========================================================

const HIWATCH_UART_SERVICE =
  '6e400801-b5a3-f393-e0a9-e50e24dcca9d'

const HIWATCH_UART_TX =
  '6e400002-b5a3-f393-e0a9-e50e24dcca9d'

const HIWATCH_UART_RX =
  '6e400003-b5a3-f393-e0a9-e50e24dcca9d'


export default function Home() {

  // =========================================================
  // STATE
  // =========================================================

  const [scanning, setScanning] = useState(false)

  const [devices, setDevices] = useState([])

  const [connectedDevice, setConnectedDevice] =
    useState(null)

  const [status, setStatus] = useState('')

  const [logs, setLogs] = useState([])

  const [initialized, setInitialized] =
    useState(false)

  const [services, setServices] =
    useState([])

  const [writableCharacteristics, setWritableCharacteristics] =
    useState([])

  const [discoveringServices, setDiscoveringServices] =
    useState(false)

  const [sending, setSending] =
    useState(false)

  // Notification state
  const [listening, setListening] =
    useState(false)

  const [activeListeners, setActiveListeners] =
    useState([])

  const [receivedData, setReceivedData] =
    useState([])


  // =========================================================
  // LOG
  // =========================================================

  const addLog = (message) => {

    console.log(message)

    setLogs(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`
    ])

  }


  // =========================================================
  // INITIALIZE
  // =========================================================

  useEffect(() => {

    if (!isNative) return

    BleClient.initialize()
      .then(() => {

        setInitialized(true)

        addLog('BLE initialized')

      })
      .catch(err => {

        console.error(err)

        addLog(
          `BLE initialization error: ${err.message}`
        )

      })

  }, [])


  // =========================================================
  // SCAN
  // =========================================================

  const startScan = async () => {

    if (!isNative) {

      setStatus(
        'Bluetooth LE is only available on native devices.'
      )

      return
    }

    try {

      setDevices([])

      setScanning(true)

      setStatus('Scanning...')

      addLog('Starting BLE scan...')


      await BleClient.requestLEScan(
        {},
        result => {

          const device = {

            ...result,

            deviceId:
              result?.device?.deviceId ||
              result?.deviceId,

            name:
              result?.device?.name ||
              result?.name,

            localName:
              result?.device?.localName ||
              result?.localName

          }


          if (!device.deviceId) {

            return

          }


          setDevices(prev => {

            const exists =
              prev.some(
                d =>
                  d.deviceId ===
                  device.deviceId
              )


            if (exists) {

              return prev

            }


            addLog(
              `Found: ${
                device.name ||
                device.localName ||
                device.deviceId
              }`
            )


            return [
              ...prev,
              device
            ]

          })

        }
      )

    } catch (err) {

      console.error(err)

      setScanning(false)

      setStatus(
        `Scan error: ${err.message}`
      )

      addLog(
        `Scan error: ${err.message}`
      )

    }

  }


  // =========================================================
  // STOP SCAN
  // =========================================================

  const stopScan = async () => {

    try {

      await BleClient.stopLEScan()

      setScanning(false)

      setStatus('Scan stopped')

      addLog('Scan stopped')

    } catch (err) {

      console.error(err)

      setStatus(
        `Stop scan error: ${err.message}`
      )

      addLog(
        `Stop scan error: ${err.message}`
      )

    }

  }


  // =========================================================
  // DISPLAY BLE DATA
  // =========================================================

  const addReceivedData = (
    type,
    serviceUUID,
    characteristicUUID,
    value
  ) => {

    const bytes =
      Array.from(value || [])


    const hex =
      bytes
        .map(
          byte =>
            byte
              .toString(16)
              .padStart(2, '0')
              .toUpperCase()
        )
        .join(' ')


    console.log(
      'BLE DATA',
      {
        type,
        serviceUUID,
        characteristicUUID,
        bytes,
        hex
      }
    )


    addLog(
      `${type}: ${JSON.stringify(bytes)}`
    )


    setReceivedData(prev => [

      ...prev,

      {

        type,

        serviceUUID,

        characteristicUUID,

        value: bytes,

        hex,

        time:
          new Date().toLocaleTimeString()

      }

    ])

  }


  // =========================================================
  // START STANDARD HEART RATE LISTENER
  // =========================================================

  const startHeartRateListener = async (
    deviceId,
    discoveredServices
  ) => {

    const service =
      discoveredServices.find(
        service =>
          service.uuid?.toLowerCase() ===
          HEART_RATE_SERVICE.toLowerCase()
      )


    if (!service) {

      addLog(
        '❤️ Standard Heart Rate Service 180D not found.'
      )

      return false

    }


    const characteristic =
      service.characteristics?.find(
        characteristic =>
          characteristic.uuid?.toLowerCase() ===
          HEART_RATE_CHARACTERISTIC.toLowerCase()
      )


    if (!characteristic) {

      addLog(
        '❤️ Heart Rate characteristic 2A37 not found.'
      )

      return false

    }


    try {

      addLog(
        '❤️ Starting standard Heart Rate listener...'
      )


      await BleClient.startNotifications(

        deviceId,

        HEART_RATE_SERVICE,

        HEART_RATE_CHARACTERISTIC,

        value => {

          addReceivedData(

            'STANDARD HEART RATE',

            HEART_RATE_SERVICE,

            HEART_RATE_CHARACTERISTIC,

            value

          )

        }

      )


      setActiveListeners(prev => [

        ...prev,

        {

          serviceUUID:
            HEART_RATE_SERVICE,

          characteristicUUID:
            HEART_RATE_CHARACTERISTIC,

          type:
            'Standard Heart Rate'

        }

      ])


      addLog(
        '❤️ Standard Heart Rate listener started.'
      )


      return true

    } catch (err) {

      console.error(
        'Heart rate notification error:',
        err
      )


      addLog(
        `❤️ Heart Rate listener failed: ${err.message}`
      )


      return false

    }

  }


  // =========================================================
  // START HIWATCH LISTENER
  // =========================================================

  const startHiWatchListener = async (
    deviceId,
    discoveredServices
  ) => {

    const service =
      discoveredServices.find(
        service =>
          service.uuid?.toLowerCase() ===
          HIWATCH_UART_SERVICE.toLowerCase()
      )


    if (!service) {

      addLog(
        '⌚ HiWatch UART service not found.'
      )

      return false

    }


    const characteristic =
      service.characteristics?.find(
        characteristic =>
          characteristic.uuid?.toLowerCase() ===
          HIWATCH_UART_RX.toLowerCase()
      )


    if (!characteristic) {

      addLog(
        '⌚ HiWatch RX characteristic not found.'
      )

      return false

    }


    addLog(
      `⌚ Found HiWatch RX: ${HIWATCH_UART_RX}`
    )


    // ---------------------------------------------------------
    // IMPORTANT
    //
    // Only try this specific characteristic.
    // Do NOT subscribe to every notify characteristic.
    // ---------------------------------------------------------

    try {

      addLog(
        '⌚ Starting HiWatch notification listener...'
      )


      await BleClient.startNotifications(

        deviceId,

        HIWATCH_UART_SERVICE,

        HIWATCH_UART_RX,

        value => {

          addReceivedData(

            'HIWATCH UART',

            HIWATCH_UART_SERVICE,

            HIWATCH_UART_RX,

            value

          )

        }

      )


      setActiveListeners(prev => [

        ...prev,

        {

          serviceUUID:
            HIWATCH_UART_SERVICE,

          characteristicUUID:
            HIWATCH_UART_RX,

          type:
            'HiWatch UART RX'

        }

      ])


      setListening(true)


      addLog(
        '⌚ HiWatch UART RX listener started successfully.'
      )


      return true

    } catch (err) {

      console.error(
        'HiWatch notification error:',
        err
      )


      addLog(
        `⌚ HiWatch listener failed: ${err.message}`
      )


      return false

    }

  }


  // =========================================================
  // START ALL RELEVANT LISTENERS
  // =========================================================

  const startListeningToServices = async (
    deviceId,
    discoveredServices
  ) => {

    if (
      !discoveredServices ||
      discoveredServices.length === 0
    ) {

      addLog(
        'No services available for notification setup.'
      )

      return

    }


    setListening(false)

    setActiveListeners([])


    addLog(
      '================================'
    )

    addLog(
      'Starting BLE listeners...'
    )

    addLog(
      '================================'
    )


    // ---------------------------------------------------------
    // 1. STANDARD HEART RATE
    // ---------------------------------------------------------

    await startHeartRateListener(
      deviceId,
      discoveredServices
    )


    // ---------------------------------------------------------
    // 2. HIWATCH UART
    // ---------------------------------------------------------

    await startHiWatchListener(
      deviceId,
      discoveredServices
    )


    addLog(
      'BLE listener setup completed.'
    )

  }


  // =========================================================
  // DISCOVER SERVICES
  // =========================================================

  const discoverServices = async (
    deviceId
  ) => {

    try {

      setDiscoveringServices(true)

      addLog(
        'Discovering GATT services...'
      )


      const discoveredServices =
        await BleClient.getServices(
          deviceId
        )


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


      setServices(
        discoveredServices
      )


      const writable = []


      // -------------------------------------------------------
      // Inspect every service
      // -------------------------------------------------------

      for (
        const service
        of discoveredServices
      ) {

        console.log(
          'SERVICE:',
          service.uuid
        )


        if (
          !service.characteristics
        ) {

          continue

        }


        for (
          const characteristic
          of service.characteristics
        ) {

          const properties =
            characteristic.properties || {}


          console.log(
            'CHARACTERISTIC:',
            characteristic.uuid
          )


          console.log(
            'PROPERTIES:',
            properties
          )


          const canWrite =
            properties.write === true


          const canWriteWithoutResponse =
            properties.writeWithoutResponse === true


          if (
            canWrite ||
            canWriteWithoutResponse
          ) {

            writable.push({

              serviceUUID:
                service.uuid,

              characteristicUUID:
                characteristic.uuid,

              properties

            })


            addLog(
              `Writable characteristic: ${characteristic.uuid}`
            )

          }

        }

      }


      setWritableCharacteristics(
        writable
      )


      addLog(
        `Found ${discoveredServices.length} service(s).`
      )


      addLog(
        `Found ${writable.length} writable characteristic(s).`
      )


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


  // =========================================================
  // CONNECT
  // =========================================================

  const connectDevice = async (
    device
  ) => {

    try {

      const name =
        device.name ||
        device.localName ||
        device.deviceId


      setStatus(
        `Connecting to ${name}...`
      )


      addLog(
        `Connecting to ${name}...`
      )


      await BleClient.connect(

        device.deviceId,

        () => {

          addLog(
            'Device disconnected.'
          )


          setConnectedDevice(null)

          setServices([])

          setWritableCharacteristics([])

          setActiveListeners([])

          setListening(false)

          setStatus(
            'Device disconnected'
          )

        }

      )


      setConnectedDevice(
        device
      )


      setStatus(
        `Connected to ${name}`
      )


      addLog(
        'Connected!'
      )


      // -------------------------------------------------------
      // Discover services
      // -------------------------------------------------------

      const discoveredServices =
        await discoverServices(
          device.deviceId
        )


      // -------------------------------------------------------
      // Automatically start relevant listeners
      // -------------------------------------------------------

      await startListeningToServices(

        device.deviceId,

        discoveredServices

      )


      setStatus(
        `Connected to ${name}.`
      )


    } catch (err) {

      console.error(
        'Connection error:',
        err
      )


      setStatus(
        `Connection error: ${err.message}`
      )


      addLog(
        `Connection error: ${err.message}`
      )

    }

  }


  // =========================================================
  // DISCONNECT
  // =========================================================

  const disconnectDevice = async () => {

    if (!connectedDevice) {

      return

    }


    try {

      // -------------------------------------------------------
      // Stop listeners
      // -------------------------------------------------------

      for (
        const listener
        of activeListeners
      ) {

        try {

          await BleClient.stopNotifications(

            connectedDevice.deviceId,

            listener.serviceUUID,

            listener.characteristicUUID

          )


          addLog(
            `Stopped listener: ${listener.characteristicUUID}`
          )


        } catch (err) {

          console.log(
            'Stop notification error:',
            err.message
          )

        }

      }


      // -------------------------------------------------------
      // Disconnect
      // -------------------------------------------------------

      await BleClient.disconnect(
        connectedDevice.deviceId
      )


      setConnectedDevice(null)

      setServices([])

      setWritableCharacteristics([])

      setActiveListeners([])

      setListening(false)

      setReceivedData([])

      setStatus(
        'Disconnected'
      )


      addLog(
        'Disconnected.'
      )


    } catch (err) {

      console.error(err)


      setStatus(
        `Disconnect error: ${err.message}`
      )


      addLog(
        `Disconnect error: ${err.message}`
      )

    }

  }


  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const sendMessage = async (
    item
  ) => {

    if (!connectedDevice) {

      setStatus(
        'No device connected.'
      )

      return

    }


    try {

      setSending(true)


      const data =
        new TextEncoder().encode(
          TEST_MESSAGE
        )


      addLog(
        `Sending "${TEST_MESSAGE}" to ${item.characteristicUUID}`
      )


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
        'Message written successfully.'
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


  // =========================================================
  // CLEAR RECEIVED DATA
  // =========================================================

  const clearReceivedData = () => {

    setReceivedData([])

    addLog(
      'Received data cleared.'
    )

  }


  // =========================================================
  // UI
  // =========================================================

  return (

    <div className="p-4 max-w-5xl mx-auto !text-black">

      <h1 className="text-2xl font-bold mb-4">
        Smart Watch Bluetooth LE
      </h1>


      {/* =====================================================
          NATIVE WARNING
      ====================================================== */}

      {!isNative && (

        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">

          Bluetooth LE is only available
          on native Android/iOS.

        </div>

      )}


      {/* =====================================================
          SCAN
      ====================================================== */}

      <div className="mb-4 flex gap-2">

        {!scanning ? (

          <button
            onClick={startScan}
            disabled={
              !isNative ||
              !initialized
            }
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


      {/* =====================================================
          CONNECTED DEVICE
      ====================================================== */}

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

            ID:
            {' '}
            {connectedDevice.deviceId}

          </p>


          <p className="text-sm mt-2">

            BLE Notifications:
            {' '}

            <strong>

              {listening
                ? 'ACTIVE'
                : 'NOT ACTIVE'}

            </strong>

          </p>


          <button
            onClick={disconnectDevice}
            className="mt-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm"
          >

            Disconnect

          </button>

        </div>

      )}


      {/* =====================================================
          STATUS
      ====================================================== */}

      {status && (

        <div className="mb-4 p-3 bg-gray-100 rounded">

          <p>
            {status}
          </p>

        </div>

      )}


      {/* =====================================================
          DEVICES
      ====================================================== */}

      <div className="mb-6">

        <h2 className="text-xl font-semibold mb-2">

          Discovered Devices
          {' '}
          ({devices.length})

        </h2>


        {devices.length === 0 &&
          !scanning && (

            <p className="text-gray-500">

              No devices found.
              Tap "Start Scan".

            </p>

          )}


        <div className="space-y-2">

          {devices.map(
            device => {

              const name =
                device.name ||
                device.localName ||
                'Unnamed Device'


              const isConnected =
                connectedDevice?.deviceId ===
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

                      ID:
                      {' '}
                      {device.deviceId}

                    </p>


                    {device.rssi !== undefined && (

                      <p className="text-sm text-gray-500">

                        RSSI:
                        {' '}
                        {device.rssi}

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

            }
          )}

        </div>

      </div>


      {/* =====================================================
          GATT SERVICES
      ====================================================== */}

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
              disabled={
                discoveringServices
              }
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
              (
                service,
                serviceIndex
              ) => (

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
                    (
                      characteristic,
                      index
                    ) => (

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


      {/* =====================================================
          ACTIVE LISTENERS
      ====================================================== */}

      {connectedDevice && (

        <div className="mb-6">

          <h2 className="text-xl font-semibold mb-2">

            Active BLE Listeners

          </h2>


          {activeListeners.length === 0 ? (

            <div className="border border-yellow-300 bg-yellow-50 rounded p-3">

              <p className="text-yellow-700">

                No notification listeners active.

              </p>

            </div>

          ) : (

            <div className="space-y-2">

              {activeListeners.map(
                (
                  listener,
                  index
                ) => (

                  <div
                    key={index}
                    className="border rounded p-3 bg-blue-50"
                  >

                    <p className="font-semibold">

                      {listener.type}

                    </p>


                    <p className="text-xs font-mono break-all mt-2">

                      Service:
                      {' '}
                      {listener.serviceUUID}

                    </p>


                    <p className="text-xs font-mono break-all">

                      Characteristic:
                      {' '}
                      {listener.characteristicUUID}

                    </p>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      )}


      {/* =====================================================
          RECEIVED DATA
      ====================================================== */}

      {connectedDevice && (

        <div className="mb-6">

          <div className="flex justify-between items-center mb-2">

            <h2 className="text-xl font-semibold">

              Received BLE Data
              {' '}
              ({receivedData.length})

            </h2>


            {receivedData.length > 0 && (

              <button
                onClick={clearReceivedData}
                className="bg-gray-500 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
              >

                Clear

              </button>

            )}

          </div>


          {receivedData.length === 0 ? (

            <div className="border rounded p-4 bg-gray-50">

              <p className="text-gray-500">

                Waiting for smartwatch data...

              </p>


              <p className="text-xs text-gray-400 mt-2">

                Open the heart-rate screen
                on your watch and wait.

              </p>

            </div>

          ) : (

            <div className="bg-black text-green-400 p-3 rounded max-h-96 overflow-y-auto font-mono text-xs">

              {receivedData.map(
                (
                  item,
                  index
                ) => (

                  <div
                    key={index}
                    className="mb-3 pb-3 border-b border-gray-700"
                  >

                    <div>

                      [{item.time}]

                    </div>


                    <div>

                      TYPE:
                      {' '}
                      {item.type}

                    </div>


                    <div className="break-all">

                      SERVICE:
                      {' '}
                      {item.serviceUUID}

                    </div>


                    <div className="break-all">

                      CHARACTERISTIC:
                      {' '}
                      {item.characteristicUUID}

                    </div>


                    <div>

                      BYTES:
                      {' '}

                      {JSON.stringify(
                        item.value
                      )}

                    </div>


                    <div>

                      HEX:
                      {' '}

                      {item.hex}

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      )}


      {/* =====================================================
          WRITABLE CHARACTERISTICS
      ====================================================== */}

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
                (
                  item,
                  index
                ) => (

                  <div
                    key={`${item.serviceUUID}-${item.characteristicUUID}`}
                    className="border rounded p-3"
                  >

                    <p className="font-semibold">

                      Candidate #
                      {index + 1}

                    </p>


                    <p className="text-sm mt-2">

                      <strong>
                        Service:
                      </strong>

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

                      <strong>
                        Properties:
                      </strong>

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


      {/* =====================================================
          LOGS
      ====================================================== */}

      {logs.length > 0 && (

        <div className="mt-6">

          <h2 className="text-xl font-semibold mb-2">

            Logs

          </h2>


          <div className="bg-gray-100 p-2 rounded text-sm font-mono max-h-96 overflow-y-auto">

            {logs.map(
              (
                log,
                index
              ) => (

                <div key={index}>

                  {log}

                </div>

              )
            )}

          </div>

        </div>

      )}

    </div>

  )

}