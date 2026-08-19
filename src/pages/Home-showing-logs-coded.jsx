import React, { useEffect, useState } from 'react'
import { BleClient } from '@capacitor-community/bluetooth-le'
import { isNative } from '../api/client'

// ============================================================
// STANDARD BLE SERVICES
// ============================================================

const HEART_RATE_SERVICE =
  '0000180d-0000-1000-8000-00805f9b34fb'

const HEART_RATE_CHARACTERISTIC =
  '00002a37-0000-1000-8000-00805f9b34fb'

const BATTERY_SERVICE =
  '0000180f-0000-1000-8000-00805f9b34fb'

const BATTERY_CHARACTERISTIC =
  '00002a19-0000-1000-8000-00805f9b34fb'

const DEVICE_INFORMATION_SERVICE =
  '0000180a-0000-1000-8000-00805f9b34fb'

const HID_SERVICE =
  '00001812-0000-1000-8000-00805f9b34fb'

// ============================================================
// HIWATCH / NORDIC UART
// ============================================================

const HIWATCH_UART_SERVICE =
  '6e400801-b5a3-f393-e0a9-e50e24dcca9d'

const HIWATCH_UART_TX =
  '6e400002-b5a3-f393-e0a9-e50e24dcca9d'

const HIWATCH_UART_RX =
  '6e400003-b5a3-f393-e0a9-e50e24dcca9d'

// ============================================================
// CUSTOM SERVICES
// ============================================================

const CUSTOM_FFFF_SERVICE =
  '0000ffff-0000-1000-8000-00805f9b34fb'

const CUSTOM_3802_SERVICE =
  '00003802-0000-1000-8000-00805f9b34fb'


// ============================================================
// HELPERS
// ============================================================

const normalizeUUID = (uuid) =>
  String(uuid || '').toLowerCase()


const bytesToHex = (value) => {

  return Array.from(value || [])
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(2, '0')
          .toUpperCase()
    )
    .join(' ')
}


const bytesToAscii = (value) => {

  return Array.from(value || [])
    .map(byte => {

      if (byte >= 32 && byte <= 126) {
        return String.fromCharCode(byte)
      }

      return '.'

    })
    .join('')

}


const bytesToUTF8 = (value) => {

  try {

    return new TextDecoder().decode(
      new Uint8Array(
        Array.from(value || [])
      )
    )

  } catch {

    return ''

  }

}


const uuidName = (uuid) => {

  const u = normalizeUUID(uuid)

  switch (u) {

    case HEART_RATE_SERVICE:
      return '❤️ Standard Heart Rate'

    case BATTERY_SERVICE:
      return '🔋 Battery'

    case DEVICE_INFORMATION_SERVICE:
      return 'ℹ️ Device Information'

    case HID_SERVICE:
      return '⌨️ HID'

    case HIWATCH_UART_SERVICE:
      return '⌚ HiWatch / NUS'

    case CUSTOM_FFFF_SERVICE:
      return '🔧 Custom FFFF'

    case CUSTOM_3802_SERVICE:
      return '🔧 Custom 3802'

    case '00001800-0000-1000-8000-00805f9b34fb':
      return 'Generic Access'

    case '00001801-0000-1000-8000-00805f9b34fb':
      return 'Generic Attribute'

    default:
      return 'Unknown / Custom'
  }

}


// ============================================================
// NUS PACKET ANALYSIS
// ============================================================

const analyzeNUSPacket = (value) => {

  const bytes = Array.from(value || [])

  const packet = {

    length: bytes.length,

    bytes,

    hex: bytesToHex(value),

    ascii: bytesToAscii(value),

    utf8: bytesToUTF8(value),

    firstByte:
      bytes.length > 0
        ? bytes[0]
        : null,

    secondByte:
      bytes.length > 1
        ? bytes[1]
        : null,

    command:
      bytes.length > 3
        ? bytes[3]
        : null,

    subCommand:
      bytes.length > 4
        ? bytes[4]
        : null,

    byte5:
      bytes.length > 5
        ? bytes[5]
        : null,

    byte6:
      bytes.length > 6
        ? bytes[6]
        : null,

    byte7:
      bytes.length > 7
        ? bytes[7]
        : null,

    uint8: [],

    uint16LE: [],

    uint16BE: []

  }


  // ----------------------------------------------------------
  // 8-BIT VALUES
  // ----------------------------------------------------------

  packet.uint8 =
    bytes.map(
      (byte, index) => ({

        index,

        value: byte

      })
    )


  // ----------------------------------------------------------
  // 16-BIT LITTLE ENDIAN
  // ----------------------------------------------------------

  for (
    let i = 0;
    i < bytes.length - 1;
    i++
  ) {

    packet.uint16LE.push({

      offset: i,

      value:
        bytes[i] |
        (bytes[i + 1] << 8)

    })

  }


  // ----------------------------------------------------------
  // 16-BIT BIG ENDIAN
  // ----------------------------------------------------------

  for (
    let i = 0;
    i < bytes.length - 1;
    i++
  ) {

    packet.uint16BE.push({

      offset: i,

      value:
        (bytes[i] << 8) |
        bytes[i + 1]

    })

  }


  return packet

}


// ============================================================
// POSSIBLE HEALTH VALUE SCANNER
// ============================================================
//
// IMPORTANT:
//
// This is NOT claiming these values ARE HR/SpO2/BP.
//
// It simply highlights bytes that fall inside ranges commonly
// interesting for health measurements.
//
// HR: 30-220
// SpO2: 70-100
// BP: 40-250
//
// This helps us investigate the protocol.
// ============================================================

const findPotentialHealthValues = (bytes) => {

  const result = {

    possibleHeartRate: [],

    possibleSpO2: [],

    possibleBloodPressure: [],

    possible16BitValues: []

  }


  // ----------------------------------------------------------
  // 8-bit values
  // ----------------------------------------------------------

  bytes.forEach(
    (byte, index) => {

      if (
        byte >= 30 &&
        byte <= 220
      ) {

        result.possibleHeartRate.push({

          index,

          value: byte

        })

      }


      if (
        byte >= 70 &&
        byte <= 100
      ) {

        result.possibleSpO2.push({

          index,

          value: byte

        })

      }


      if (
        byte >= 40 &&
        byte <= 250
      ) {

        result.possibleBloodPressure.push({

          index,

          value: byte

        })

      }

    }
  )


  // ----------------------------------------------------------
  // 16-bit little endian
  // ----------------------------------------------------------

  for (
    let i = 0;
    i < bytes.length - 1;
    i++
  ) {

    const value =
      bytes[i] |
      (bytes[i + 1] << 8)


    if (
      value >= 30 &&
      value <= 250
    ) {

      result.possible16BitValues.push({

        offset: i,

        value

      })

    }

  }


  return result

}


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Home() {

  // ==========================================================
  // STATE
  // ==========================================================

  const [initialized, setInitialized] =
    useState(false)

  const [scanning, setScanning] =
    useState(false)

  const [devices, setDevices] =
    useState([])

  const [connectedDevice, setConnectedDevice] =
    useState(null)

  const [services, setServices] =
    useState([])

  const [serviceSummary, setServiceSummary] =
    useState([])

  const [logs, setLogs] =
    useState([])

  const [packets, setPackets] =
    useState([])

  const [batteryLevel, setBatteryLevel] =
    useState(null)

  const [heartRate, setHeartRate] =
    useState(null)

  const [deviceInformation, setDeviceInformation] =
    useState([])

  const [activeListeners, setActiveListeners] =
    useState([])

  const [status, setStatus] =
    useState('')

  const [showByteAnalysis, setShowByteAnalysis] =
    useState(false)

  const [capturing, setCapturing] =
    useState(true)


  // ==========================================================
  // LOG
  // ==========================================================

  const addLog = message => {

    console.log(message)

    setLogs(prev => [

      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`

    ])

  }


  // ==========================================================
  // INITIALIZE
  // ==========================================================

  useEffect(() => {

    if (!isNative)
      return


    BleClient.initialize()
      .then(() => {

        setInitialized(true)

        addLog(
          'Bluetooth LE initialized.'
        )

      })
      .catch(err => {

        console.error(err)

        addLog(
          `BLE initialization failed: ${err.message}`
        )

      })

  }, [])


  // ==========================================================
  // SCAN
  // ==========================================================

  const startScan = async () => {

    try {

      setDevices([])

      setScanning(true)

      setStatus('Scanning...')

      addLog(
        'Starting BLE scan...'
      )


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


          if (!device.deviceId)
            return


          setDevices(prev => {

            const exists =
              prev.some(
                d =>
                  d.deviceId ===
                  device.deviceId
              )


            if (exists)
              return prev


            addLog(
              `Found device: ${
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

      setScanning(false)

      addLog(
        `Scan error: ${err.message}`
      )

    }

  }


  // ==========================================================
  // STOP SCAN
  // ==========================================================

  const stopScan = async () => {

    try {

      await BleClient.stopLEScan()

      setScanning(false)

      addLog(
        'Scan stopped.'
      )

    } catch (err) {

      addLog(
        `Stop scan error: ${err.message}`
      )

    }

  }


  // ==========================================================
  // BATTERY
  // ==========================================================

  const readBattery = async deviceId => {

    try {

      const value =
        await BleClient.read(

          deviceId,

          BATTERY_SERVICE,

          BATTERY_CHARACTERISTIC

        )


      const bytes =
        Array.from(value || [])


      if (
        bytes.length > 0 &&
        bytes[0] <= 100
      ) {

        setBatteryLevel(
          bytes[0]
        )

        addLog(
          `🔋 Battery: ${bytes[0]}%`
        )

      }

    } catch (err) {

      addLog(
        `Battery unavailable: ${err.message}`
      )

    }

  }


  // ==========================================================
  // DEVICE INFORMATION
  // ==========================================================

  const readDeviceInformation = async (
    deviceId,
    service
  ) => {

    if (!service?.characteristics)
      return


    const result = []


    for (
      const characteristic
      of service.characteristics
    ) {

      if (
        characteristic.properties?.read !== true
      ) {

        continue

      }


      try {

        const value =
          await BleClient.read(

            deviceId,

            service.uuid,

            characteristic.uuid

          )


        const bytes =
          Array.from(value || [])


        const text =
          bytesToUTF8(value)


        result.push({

          uuid:
            characteristic.uuid,

          hex:
            bytesToHex(value),

          text

        })


      } catch (err) {

        addLog(
          `Device info read failed: ${characteristic.uuid}`
        )

      }

    }


    setDeviceInformation(result)

  }


  // ==========================================================
  // STANDARD HEART RATE
  // ==========================================================

  const startStandardHeartRate =
    async (
      deviceId,
      discoveredServices
    ) => {

      const service =
        discoveredServices.find(
          s =>
            normalizeUUID(s.uuid) ===
            HEART_RATE_SERVICE
        )


      if (!service) {

        addLog(
          '❤️ Standard 180D Heart Rate Service not present.'
        )

        return

      }


      const characteristic =
        service.characteristics?.find(
          c =>
            normalizeUUID(c.uuid) ===
            HEART_RATE_CHARACTERISTIC
        )


      if (!characteristic) {

        return

      }


      try {

        await BleClient.startNotifications(

          deviceId,

          HEART_RATE_SERVICE,

          HEART_RATE_CHARACTERISTIC,

          value => {

            const bytes =
              Array.from(value || [])


            if (bytes.length < 2)
              return


            const flags =
              bytes[0]


            const bpm =
              (flags & 0x01)

                ? bytes[1] |
                  (bytes[2] << 8)

                : bytes[1]


            setHeartRate(bpm)

            addLog(
              `❤️ Standard HR: ${bpm} BPM`
            )

          }

        )


        setActiveListeners(prev => [

          ...prev,

          {

            type:
              'Standard Heart Rate',

            serviceUUID:
              HEART_RATE_SERVICE,

            characteristicUUID:
              HEART_RATE_CHARACTERISTIC

          }

        ])

      } catch (err) {

        addLog(
          `Standard HR listener failed: ${err.message}`
        )

      }

    }


  // ==========================================================
  // PRIMARY HIWATCH HEALTH LISTENER
  // ==========================================================

  const startHiWatchHealthListener =
    async deviceId => {

      try {

        addLog(
          '⌚ Starting HiWatch health-data listener...'
        )


        await BleClient.startNotifications(

          deviceId,

          HIWATCH_UART_SERVICE,

          HIWATCH_UART_RX,

          value => {



            function decodeDataView(value) {
              const bytes = new Uint8Array(
                value.buffer,
                value.byteOffset,
                value.byteLength
              );

              const hex = Array.from(bytes)
                .map(b => b.toString(16).padStart(2, "0"))
                .join(" ");

              let text = "";

              try {
                text = new TextDecoder("utf-8").decode(bytes);
              } catch (e) {
                text = "";
              }

              console.log("Raw DataView:", value);
              console.log("Length:", bytes.length);
              console.log("HEX:", hex);
              console.log("TEXT:", text);

              return {
                bytes,
                hex,
                text
              };
            }



            // =================================================
            // IMPORTANT
            // This is where the T900 health protocol arrives.
            // =================================================



            console.log('----value=========================')
           const data = decodeDataView(value);

           console.log("Received:", data);

            const packet =
              analyzeNUSPacket(value)


            const health =
              findPotentialHealthValues(
                packet.bytes
              )


            const entry = {

              id:
                `${Date.now()}-${Math.random()}`,

              time:
                new Date().toLocaleTimeString(),

              timestamp:
                Date.now(),

              ...packet,

              health

            }


            // -------------------------------------------------
            // STORE PACKET
            // -------------------------------------------------

            if (capturing) {


               console.log('----entry=========================')


              console.log(JSON.stringify(entry))

              setPackets(prev => [

                ...prev,
                entry

              ])

            }


            // -------------------------------------------------
            // LOG
            // -------------------------------------------------

            console.log(
              '================================'
            )

            console.log(
              '⌚ HIWATCH HEALTH PACKET'
            )

            console.log(
              'HEX:',
              packet.hex
            )

            console.log(
              'Length:',
              packet.length
            )

            console.log(
              'Bytes:',
              packet.bytes
            )

            console.log(
              'Command:',
              packet.command
            )

            console.log(
              'Sub-command:',
              packet.subCommand
            )

            console.log(
              'Potential health values:',
              health
            )

            console.log(
              '================================'
            )


            addLog(
              `⌚ NUS: ${packet.hex}`
            )

          }

        )


        setActiveListeners(prev => [

          ...prev,

          {

            type:
              'HiWatch NUS / Health Data',

            serviceUUID:
              HIWATCH_UART_SERVICE,

            characteristicUUID:
              HIWATCH_UART_RX

          }

        ])


        addLog(
          '⌚ HiWatch health-data listener ACTIVE.'
        )


      } catch (err) {

        console.error(
          'NUS listener error:',
          err
        )


        addLog(
          `NUS listener failed: ${err.message}`
        )

      }

    }


  // ==========================================================
  // DISCOVER SERVICES
  // ==========================================================

  const discoverServices =
    async deviceId => {

      try {

        const discovered =
          await BleClient.getServices(
            deviceId
          )


        setServices(
          discovered
        )


        // ------------------------------------------------------
        // SUMMARY
        // ------------------------------------------------------

        const summary =
          discovered.map(
            service => {

              const characteristics =
                service.characteristics ||
                []


              return {

                uuid:
                  service.uuid,

                name:
                  uuidName(
                    service.uuid
                  ),

                characteristicCount:
                  characteristics.length,

                read:
                  characteristics.filter(
                    c =>
                      c.properties?.read === true
                  ).length,

                write:
                  characteristics.filter(
                    c =>
                      c.properties?.write === true ||
                      c.properties?.writeWithoutResponse === true
                  ).length,

                notify:
                  characteristics.filter(
                    c =>
                      c.properties?.notify === true ||
                      c.properties?.indicate === true
                  ).length

              }

            }
          )


        setServiceSummary(
          summary
        )


        addLog(
          `Discovered ${discovered.length} services.`
        )


        // ------------------------------------------------------
        // BATTERY
        // ------------------------------------------------------

        if (
          discovered.some(
            s =>
              normalizeUUID(s.uuid) ===
              BATTERY_SERVICE
          )
        ) {

          addLog(
            '🔋 Battery Service found.'
          )

          await readBattery(
            deviceId
          )

        }


        // ------------------------------------------------------
        // DEVICE INFO
        // ------------------------------------------------------

        const infoService =
          discovered.find(
            s =>
              normalizeUUID(s.uuid) ===
              DEVICE_INFORMATION_SERVICE
          )


        if (infoService) {

          await readDeviceInformation(

            deviceId,

            infoService

          )

        }


        // ------------------------------------------------------
        // STANDARD HR
        // ------------------------------------------------------

        await startStandardHeartRate(

          deviceId,

          discovered

        )


        // ------------------------------------------------------
        // NUS
        // ------------------------------------------------------

        const nus =
          discovered.find(
            s =>
              normalizeUUID(s.uuid) ===
              HIWATCH_UART_SERVICE
          )


        if (nus) {

          addLog(
            '⌚ NUS service found.'
          )


          const rx =
            nus.characteristics?.find(
              c =>
                normalizeUUID(c.uuid) ===
                HIWATCH_UART_RX
            )


          if (rx) {

            addLog(
              '⌚ NUS RX characteristic found.'
            )


            // THIS IS NOW THE PRIMARY HEALTH LISTENER

            await startHiWatchHealthListener(
              deviceId
            )

          } else {

            addLog(
              'NUS RX characteristic missing.'
            )

          }

        }


        // ------------------------------------------------------
        // CUSTOM SERVICES
        // ------------------------------------------------------

        if (
          discovered.some(
            s =>
              normalizeUUID(s.uuid) ===
              CUSTOM_FFFF_SERVICE
          )
        ) {

          addLog(
            '🔧 FFFF custom service found.'
          )

        }


        if (
          discovered.some(
            s =>
              normalizeUUID(s.uuid) ===
              CUSTOM_3802_SERVICE
          )
        ) {

          addLog(
            '🔧 3802 custom service found.'
          )

        }


        return discovered

      } catch (err) {

        console.error(err)

        addLog(
          `Service discovery failed: ${err.message}`
        )

        return []

      }

    }


  // ==========================================================
  // CONNECT
  // ==========================================================

  const connectDevice = async device => {

    try {

      setStatus(
        `Connecting to ${
          device.name ||
          device.localName ||
          device.deviceId
        }...`
      )


      addLog(
        `Connecting to ${device.deviceId}...`
      )


      await BleClient.connect(

        device.deviceId,

        () => {

          addLog(
            '⌚ Watch disconnected.'
          )


          setConnectedDevice(null)

          setActiveListeners([])

        }

      )


      setConnectedDevice(
        device
      )


      setStatus(
        'Connected.'
      )


      addLog(
        '⌚ Watch connected.'
      )


      setPackets([])

      setHeartRate(null)


      // Discover everything

      await discoverServices(
        device.deviceId
      )


    } catch (err) {

      console.error(err)

      setStatus(
        `Connection failed: ${err.message}`
      )


      addLog(
        `Connection failed: ${err.message}`
      )

    }

  }


  // ==========================================================
  // DISCONNECT
  // ==========================================================

  const disconnect = async () => {

    if (!connectedDevice)
      return


    try {

      // Stop known NUS listener

      try {

        await BleClient.stopNotifications(

          connectedDevice.deviceId,

          HIWATCH_UART_SERVICE,

          HIWATCH_UART_RX

        )

      } catch {}


      // Stop standard HR listener

      try {

        await BleClient.stopNotifications(

          connectedDevice.deviceId,

          HEART_RATE_SERVICE,

          HEART_RATE_CHARACTERISTIC

        )

      } catch {}


      await BleClient.disconnect(

        connectedDevice.deviceId

      )


      setConnectedDevice(null)

      setServices([])

      setServiceSummary([])

      setActiveListeners([])

      setBatteryLevel(null)

      setHeartRate(null)

      setDeviceInformation([])


      addLog(
        'Disconnected.'
      )


    } catch (err) {

      addLog(
        `Disconnect error: ${err.message}`
      )

    }

  }


  // ==========================================================
  // CLEAR PACKETS
  // ==========================================================

  const clearPackets = () => {

    setPackets([])

    addLog(
      'Packet capture cleared.'
    )

  }


  // ==========================================================
  // EXPORT PACKETS
  // ==========================================================

  const exportPackets = () => {

    const data =
      JSON.stringify(
        packets,
        null,
        2
      )


    const blob =
      new Blob(
        [data],
        {
          type:
            'application/json'
        }
      )


    const url =
      URL.createObjectURL(
        blob
      )


    const a =
      document.createElement(
        'a'
      )


    a.href = url

    a.download =
      `hiwatch-packets-${Date.now()}.json`


    a.click()


    URL.revokeObjectURL(
      url
    )

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="max-w-7xl mx-auto p-4 text-black">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-6">

        <h1 className="text-3xl font-bold">

          T900 / HiWatch BLE Analyzer

        </h1>


        <p className="text-gray-600 mt-1">

          NUS health-data packet capture and analysis

        </p>

      </div>


      {/* =====================================================
          STATUS
      ====================================================== */}

      <div className="border rounded p-4 mb-6 bg-gray-50">

        <div>

          BLE:
          {' '}

          <strong>

            {initialized
              ? 'Initialized'
              : 'Not initialized'}

          </strong>

        </div>


        <div>

          Status:
          {' '}

          <strong>

            {status || 'Idle'}

          </strong>

        </div>


        {connectedDevice && (

          <div className="mt-2">

            Connected:
            {' '}

            <strong>

              {connectedDevice.name ||
                connectedDevice.localName ||
                connectedDevice.deviceId}

            </strong>

          </div>

        )}

      </div>


      {/* =====================================================
          SCANNING
      ====================================================== */}

      <div className="flex gap-2 mb-6">

        {!scanning ? (

          <button
            onClick={startScan}
            disabled={!initialized}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >

            Scan

          </button>

        ) : (

          <button
            onClick={stopScan}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >

            Stop Scan

          </button>

        )}

      </div>


      {/* =====================================================
          DEVICES
      ====================================================== */}

      <section className="mb-8">

        <h2 className="text-xl font-bold mb-3">

          Devices ({devices.length})

        </h2>


        <div className="space-y-2">

          {devices.map(device => (

            <div
              key={device.deviceId}
              className="border rounded p-4 flex justify-between items-center"
            >

              <div>

                <div className="font-bold">

                  {device.name ||
                    device.localName ||
                    'Unnamed Device'}

                </div>


                <div className="font-mono text-xs">

                  {device.deviceId}

                </div>


                <div className="text-sm">

                  RSSI:
                  {' '}
                  {device.rssi}

                </div>

              </div>


              {connectedDevice?.deviceId ===
              device.deviceId ? (

                <span className="text-green-600 font-bold">

                  Connected

                </span>

              ) : (

                <button
                  onClick={() =>
                    connectDevice(device)
                  }
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >

                  Connect

                </button>

              )}

            </div>

          ))}

        </div>

      </section>


      {/* =====================================================
          HEALTH DASHBOARD
      ====================================================== */}

      {connectedDevice && (

        <section className="mb-8">

          <h2 className="text-xl font-bold mb-3">

            Health Data

          </h2>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            <div className="border rounded p-4">

              <div className="text-gray-500">

                🔋 Battery

              </div>

              <div className="text-3xl font-bold">

                {batteryLevel !== null
                  ? `${batteryLevel}%`
                  : '--'}

              </div>

            </div>


            <div className="border rounded p-4">

              <div className="text-gray-500">

                ❤️ Standard Heart Rate

              </div>

              <div className="text-3xl font-bold">

                {heartRate !== null
                  ? `${heartRate} BPM`
                  : '--'}

              </div>

              <div className="text-xs text-gray-500 mt-2">

                Only populated if 180D/2A37 exists.

              </div>

            </div>


            <div className="border rounded p-4">

              <div className="text-gray-500">

                ⌚ NUS Packets

              </div>

              <div className="text-3xl font-bold">

                {packets.length}

              </div>

              <div className="text-xs text-gray-500">

                Captured from 6e400003

              </div>

            </div>

          </div>


          <div className="mt-4">

            <button
              onClick={disconnect}
              className="bg-gray-700 text-white px-4 py-2 rounded"
            >

              Disconnect

            </button>

          </div>

        </section>

      )}


      {/* =====================================================
          SERVICE SUMMARY
      ====================================================== */}

      {serviceSummary.length > 0 && (

        <section className="mb-8">

          <h2 className="text-xl font-bold mb-3">

            GATT Services

          </h2>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {serviceSummary.map(
              (service, index) => (

                <div
                  key={index}
                  className="border rounded p-4"
                >

                  <div className="font-bold">

                    {service.name}

                  </div>


                  <div className="font-mono text-xs break-all mt-1">

                    {service.uuid}

                  </div>


                  <div className="text-sm mt-2">

                    Characteristics:
                    {' '}
                    {service.characteristicCount}

                  </div>


                  <div className="text-xs text-gray-600">

                    Read: {service.read}
                    {' | '}
                    Write: {service.write}
                    {' | '}
                    Notify: {service.notify}

                  </div>

                </div>

              )
            )}

          </div>

        </section>

      )}


      {/* =====================================================
          DEVICE INFORMATION
      ====================================================== */}

      {deviceInformation.length > 0 && (

        <section className="mb-8">

          <h2 className="text-xl font-bold mb-3">

            Device Information

          </h2>


          <div className="border rounded p-4">

            {deviceInformation.map(
              (item, index) => (

                <div
                  key={index}
                  className="border-b last:border-b-0 py-2"
                >

                  <div className="font-mono text-xs">

                    {item.uuid}

                  </div>


                  <div>

                    {item.text ||
                      '(binary)'}

                  </div>


                  <div className="font-mono text-xs">

                    {item.hex}

                  </div>

                </div>

              )
            )}

          </div>

        </section>

      )}


      {/* =====================================================
          ACTIVE LISTENERS
      ====================================================== */}

      {activeListeners.length > 0 && (

        <section className="mb-8">

          <h2 className="text-xl font-bold mb-3">

            Active Listeners

          </h2>


          {activeListeners.map(
            (listener, index) => (

              <div
                key={index}
                className="border rounded p-3 mb-2 bg-green-50"
              >

                <div className="font-bold">

                  {listener.type}

                </div>


                <div className="font-mono text-xs break-all">

                  Service:
                  {' '}
                  {listener.serviceUUID}

                </div>


                <div className="font-mono text-xs break-all">

                  Characteristic:
                  {' '}
                  {listener.characteristicUUID}

                </div>

              </div>

            )
          )}

        </section>

      )}


      {/* =====================================================
          NUS CAPTURE CONTROLS
      ====================================================== */}

      {connectedDevice && (

        <section className="mb-8">

          <div className="flex flex-wrap gap-2">

            <button
              onClick={() =>
                setCapturing(
                  prev => !prev
                )
              }
              className={
                capturing
                  ? 'bg-green-600 text-white px-4 py-2 rounded'
                  : 'bg-gray-600 text-white px-4 py-2 rounded'
              }
            >

              {capturing
                ? '● Capturing NUS'
                : '○ Capture Paused'}

            </button>


            <button
              onClick={clearPackets}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >

              Clear Packets

            </button>


            <button
              onClick={exportPackets}
              disabled={
                packets.length === 0
              }
              className="bg-purple-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
            >

              Export JSON

            </button>


            <button
              onClick={() =>
                setShowByteAnalysis(
                  prev => !prev
                )
              }
              className="bg-orange-600 text-white px-4 py-2 rounded"
            >

              {showByteAnalysis
                ? 'Hide Byte Analysis'
                : 'Show Byte Analysis'}

            </button>

          </div>

        </section>

      )}


      {/* =====================================================
          PACKET COUNTER
      ====================================================== */}

      {connectedDevice && (

        <section className="mb-4">

          <div className="border rounded p-4 bg-blue-50">

            <div className="text-sm">

              NUS Service:

            </div>

            <div className="font-mono text-xs break-all">

              {HIWATCH_UART_SERVICE}

            </div>


            <div className="text-sm mt-2">

              Notification Characteristic:

            </div>

            <div className="font-mono text-xs break-all">

              {HIWATCH_UART_RX}

            </div>


            <div className="mt-3 text-2xl font-bold">

              {packets.length}

            </div>

            <div className="text-sm">

              captured packets

            </div>

          </div>

        </section>

      )}


      {/* =====================================================
          PACKET TABLE
      ====================================================== */}

      {packets.length > 0 && (

        <section className="mb-8">

          <h2 className="text-xl font-bold mb-3">

            HiWatch Health Packets

          </h2>


          <div className="overflow-x-auto border rounded">

            <table className="min-w-full text-xs">

              <thead className="bg-gray-100">

                <tr>

                  <th className="p-2 text-left">
                    #
                  </th>

                  <th className="p-2 text-left">
                    Time
                  </th>

                  <th className="p-2 text-left">
                    Len
                  </th>

                  <th className="p-2 text-left">
                    Header
                  </th>

                  <th className="p-2 text-left">
                    Cmd
                  </th>

                  <th className="p-2 text-left">
                    Sub
                  </th>

                  <th className="p-2 text-left">
                    HEX
                  </th>

                </tr>

              </thead>


              <tbody>

                {packets
                  .slice()
                  .reverse()
                  .map(
                    (packet, index) => (

                      <tr
                        key={packet.id}
                        className="border-t"
                      >

                        <td className="p-2">

                          {packets.length - index}

                        </td>


                        <td className="p-2">

                          {packet.time}

                        </td>


                        <td className="p-2">

                          {packet.length}

                        </td>


                        <td className="p-2 font-mono">

                          {packet.firstByte
                            ?.toString(16)
                            .padStart(2, '0')
                            .toUpperCase()}

                        </td>


                        <td className="p-2 font-mono">

                          {packet.command
                            ?.toString(16)
                            .padStart(2, '0')
                            .toUpperCase()}

                        </td>


                        <td className="p-2 font-mono">

                          {packet.subCommand
                            ?.toString(16)
                            .padStart(2, '0')
                            .toUpperCase()}

                        </td>


                        <td className="p-2 font-mono whitespace-nowrap">

                          {packet.hex}

                        </td>

                      </tr>

                    )
                  )}

              </tbody>

            </table>

          </div>

        </section>

      )}


      {/* =====================================================
          DETAILED BYTE ANALYSIS
      ====================================================== */}

      {showByteAnalysis &&
        packets.length > 0 && (

          <section className="mb-8">

            <h2 className="text-xl font-bold mb-3">

              Byte-Level Analysis

            </h2>


            {packets
              .slice()
              .reverse()
              .map(
                (packet, packetIndex) => (

                  <div
                    key={packet.id}
                    className="border rounded p-4 mb-4"
                  >

                    <div className="flex justify-between">

                      <strong>

                        Packet #
                        {' '}
                        {packets.length -
                          packetIndex}

                      </strong>


                      <span>

                        {packet.time}

                      </span>

                    </div>


                    <div className="font-mono text-xs mt-2 break-all">

                      {packet.hex}

                    </div>


                    {/* --------------------------------------
                        BYTE INDEXES
                    --------------------------------------- */}

                    <div className="overflow-x-auto mt-4">

                      <table className="text-xs">

                        <thead>

                          <tr>

                            <th className="p-2">
                              Index
                            </th>

                            {packet.bytes.map(
                              (_, index) => (

                                <th
                                  key={index}
                                  className="p-2"
                                >

                                  {index}

                                </th>

                              )
                            )}

                          </tr>

                        </thead>


                        <tbody>

                          <tr>

                            <td className="p-2 font-bold">
                              HEX
                            </td>

                            {packet.bytes.map(
                              (byte, index) => (

                                <td
                                  key={index}
                                  className="p-2 font-mono"
                                >

                                  {byte
                                    .toString(16)
                                    .padStart(
                                      2,
                                      '0'
                                    )
                                    .toUpperCase()}

                                </td>

                              )
                            )}

                          </tr>


                          <tr>

                            <td className="p-2 font-bold">
                              DEC
                            </td>

                            {packet.bytes.map(
                              (byte, index) => (

                                <td
                                  key={index}
                                  className="p-2"
                                >

                                  {byte}

                                </td>

                              )
                            )}

                          </tr>

                        </tbody>

                      </table>

                    </div>


                    {/* --------------------------------------
                        16 BIT VALUES
                    --------------------------------------- */}

                    <div className="mt-4">

                      <div className="font-bold">

                        16-bit Little Endian

                      </div>


                      <div className="font-mono text-xs mt-1">

                        {packet.uint16LE
                          .map(
                            item =>
                              `[${item.offset}] = ${item.value}`
                          )
                          .join('   ')}

                      </div>

                    </div>


                    <div className="mt-4">

                      <div className="font-bold">

                        16-bit Big Endian

                      </div>


                      <div className="font-mono text-xs mt-1">

                        {packet.uint16BE
                          .map(
                            item =>
                              `[${item.offset}] = ${item.value}`
                          )
                          .join('   ')}

                      </div>

                    </div>


                    {/* --------------------------------------
                        POTENTIAL HEALTH VALUES
                    --------------------------------------- */}

                    <div className="mt-4 bg-yellow-50 rounded p-3">

                      <div className="font-bold">

                        Potential Health Values

                      </div>


                      <div className="text-xs mt-2">

                        ❤️ HR candidates:

                        {' '}

                        {packet.health
                          .possibleHeartRate
                          .map(
                            x =>
                              `[${x.index}] ${x.value}`
                          )
                          .join(', ') ||
                          'none'}

                      </div>


                      <div className="text-xs mt-2">

                        🫁 SpO₂ candidates:

                        {' '}

                        {packet.health
                          .possibleSpO2
                          .map(
                            x =>
                              `[${x.index}] ${x.value}%`
                          )
                          .join(', ') ||
                          'none'}

                      </div>


                      <div className="text-xs mt-2">

                        🩸 BP candidates:

                        {' '}

                        {packet.health
                          .possibleBloodPressure
                          .map(
                            x =>
                              `[${x.index}] ${x.value}`
                          )
                          .join(', ') ||
                          'none'}

                      </div>


                      <div className="text-xs mt-2">

                        16-bit candidates:

                        {' '}

                        {packet.health
                          .possible16BitValues
                          .map(
                            x =>
                              `[${x.offset}] ${x.value}`
                          )
                          .join(', ') ||
                          'none'}

                      </div>

                    </div>

                  </div>

                )
              )}

          </section>

        )}


      {/* =====================================================
          LOGS
      ====================================================== */}

      <section>

        <h2 className="text-xl font-bold mb-3">

          Logs

        </h2>


        <div className="bg-black text-green-400 rounded p-4 max-h-96 overflow-y-auto font-mono text-xs">

          {logs.map(
            (log, index) => (

              <div key={index}>

                {log}

              </div>

            )
          )}

        </div>

      </section>

    </div>

  )

}