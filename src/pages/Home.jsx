import React, { useEffect, useRef, useState } from 'react'
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

const normalizeUUID = uuid =>
  String(uuid || '').toLowerCase()


const getBytes = value => {

  if (!value)
    return []

  if (value instanceof DataView) {

    return Array.from(
      new Uint8Array(
        value.buffer,
        value.byteOffset,
        value.byteLength
      )
    )

  }

  if (value instanceof Uint8Array)
    return Array.from(value)

  if (Array.isArray(value))
    return Array.from(value)

  try {

    return Array.from(value)

  } catch {

    return []

  }

}


const bytesToHex = value => {

  return getBytes(value)
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(2, '0')
          .toUpperCase()
    )
    .join(' ')

}


const bytesToAscii = value => {

  return getBytes(value)
    .map(byte => {

      if (
        byte >= 32 &&
        byte <= 126
      ) {

        return String.fromCharCode(byte)

      }

      return '.'

    })
    .join('')

}


const bytesToUTF8 = value => {

  try {

    return new TextDecoder(
      'utf-8'
    ).decode(
      new Uint8Array(
        getBytes(value)
      )
    )

  } catch {

    return ''

  }

}


const hexByte = value => {

  if (
    value === null ||
    value === undefined
  ) {

    return '--'

  }

  return value
    .toString(16)
    .padStart(2, '0')
    .toUpperCase()

}


// ============================================================
// UUID NAME
// ============================================================

const uuidName = uuid => {

  const u =
    normalizeUUID(uuid)

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

const analyzeNUSPacket = value => {

  const bytes =
    getBytes(value)

  const packet = {

    length:
      bytes.length,

    bytes,

    hex:
      bytesToHex(value),

    ascii:
      bytesToAscii(value),

    utf8:
      bytesToUTF8(value),

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


  packet.uint8 =
    bytes.map(
      (byte, index) => ({
        index,
        value: byte
      })
    )


  for (
    let i = 0;
    i < bytes.length - 1;
    i++
  ) {

    packet.uint16LE.push({

      offset:
        i,

      value:
        bytes[i] |
        (bytes[i + 1] << 8)

    })

  }


  for (
    let i = 0;
    i < bytes.length - 1;
    i++
  ) {

    packet.uint16BE.push({

      offset:
        i,

      value:
        (bytes[i] << 8) |
        bytes[i + 1]

    })

  }


  return packet

}


// ============================================================
// IMPORTANT HIWATCH PACKET DECODER
// ============================================================
//
// Based on the packets observed from the T900 Ultra 2:
//
// CD 00 11 15 01 0E 00 0C 35 12 00 01 00 01
// 21 B8 62 53 74 4C
//
// CD 00 11 15 01 0E 00 0C 35 12 00 01 00 01
// 21 BD 62 53 74 4C
//
// CD 00 11 15 01 0E 00 0C 35 12 00 01 00 01
// 21 C2 61 50 73 46
//
// The final bytes change while the watch health screen
// updates.
//
// We therefore preserve the entire packet and expose
// candidate decoded values.
//
// DO NOT treat these offsets as an officially documented
// HiWatch protocol specification.
// ============================================================




const decodeHiWatchHealth = bytes => {

  const result = {

    heartRate:
      null,

    spo2:
      null,

    systolic:
      null,

    diastolic:
      null,

    bloodPressure:
      null,

    confidence:
      'candidate',

    source:
      'HiWatch proprietary NUS packet',

    rawHealthBytes:
      []

  }


  if (
    !bytes ||
    bytes.length < 20
  ) {

    return result

  }else{
      result.heartRate=bytes[bytes.length - 1]
      result.systolic=bytes[bytes.length - 2]
      result.diastolic=bytes[bytes.length - 3]
      result.bloodPressure = `${result.diastolic}/${result.systolic}`
      result.spo2=bytes[bytes.length - 4]
  }


  // ----------------------------------------------------------
  // Observed packet structure
  // ----------------------------------------------------------

  //
  // index:
  //
  //  0 CD
  //  1 00
  //  2 11
  //  3 15
  //  4 01
  //  5 0E
  //  6 00
  //  7 0C
  //  8 35
  //  9 12
  // 10 00
  // 11 01
  // 12 00
  // 13 01
  // 14 21
  // 15 B8
  // 16 62
  // 17 53
  // 18 74
  // 19 4C
  //
  // ----------------------------------------------------------

  const b15 =
    bytes[15]

  const b16 =
    bytes[16]

  const b17 =
    bytes[17]

  const b18 =
    bytes[18]

  const b19 =
    bytes[19]


  result.rawHealthBytes = [

    {
      index: 15,
      hex: hexByte(b15),
      value: b15
    },

    {
      index: 16,
      hex: hexByte(b16),
      value: b16
    },

    {
      index: 17,
      hex: hexByte(b17),
      value: b17
    },

    {
      index: 18,
      hex: hexByte(b18),
      value: b18
    },

    {
      index: 19,
      hex: hexByte(b19),
      value: b19
    }

  ]


  // ----------------------------------------------------------
  // Candidate interpretation
  // ----------------------------------------------------------
  //
  // IMPORTANT:
  //
  // These are intentionally conservative.
  //
  // The repeated 62 / 61 values are plausible SpO2-like
  // encoded fields but are NOT directly 98/97.
  //
  // The changing sequence B8 BD C2 C7 CC D1 D6 appears
  // highly interesting and should be investigated further.
  //
  // We do not falsely convert it into BPM.
  //
  // ----------------------------------------------------------

  result.candidates = {

    byte15: b15,

    byte16: b16,

    byte17: b17,

    byte18: b18,

    byte19: b19,

    possibleSpO2Byte:
      b16 >= 70 &&
      b16 <= 100
        ? b16
        : null,

    possibleHeartRateBytes:
      [
        b15,
        b16,
        b17,
        b18,
        b19
      ].filter(
        value =>
          value >= 30 &&
          value <= 220
      )

  }


  return result

}


// ============================================================
// POTENTIAL HEALTH VALUE SCANNER
// ============================================================

const findPotentialHealthValues = bytes => {

  const result = {

    possibleHeartRate: [],

    possibleSpO2: [],

    possibleBloodPressure: [],

    possible16BitValues: []

  }


  bytes.forEach(
    (byte, index) => {

      if (
        byte >= 30 &&
        byte <= 220
      ) {

        result.possibleHeartRate.push({

          index,

          value:
            byte

        })

      }


      if (
        byte >= 70 &&
        byte <= 100
      ) {

        result.possibleSpO2.push({

          index,

          value:
            byte

        })

      }


      if (
        byte >= 40 &&
        byte <= 250
      ) {

        result.possibleBloodPressure.push({

          index,

          value:
            byte

        })

      }

    }
  )


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

        offset:
          i,

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

  const [watchHeartRate, setWatchHeartRate] =
    useState(null)

  const [watchSpo2, setWatchSpo2] =
    useState(null)

  const [watchBloodPressure, setWatchBloodPressure] =
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


  // ----------------------------------------------------------
  // Refs
  // ----------------------------------------------------------

  const connectedRef =
    useRef(null)

  const healthRef =
    useRef({

      heartRate: null,

      spo2: null,

      bloodPressure: null

    })


  // ==========================================================
  // LOG
  // ==========================================================

  const addLog = message => {

    console.log(message)

    setLogs(prev => [

      ...prev.slice(-499),

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
        getBytes(value)


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
          getBytes(value)


        result.push({

          uuid:
            characteristic.uuid,

          hex:
            bytesToHex(value),

          text:
            bytesToUTF8(value)

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


      if (!characteristic)
        return


      try {

        await BleClient.startNotifications(

          deviceId,

          HEART_RATE_SERVICE,

          HEART_RATE_CHARACTERISTIC,

          value => {

            const bytes =
              getBytes(value)


            if (bytes.length < 2)
              return


            const flags =
              bytes[0]


            const bpm =
              flags & 0x01

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
  // HIWATCH NUS LISTENER
  // ==========================================================

  const startHiWatchHealthListener =
    async deviceId => {

      try {

        addLog(
          '⌚ Starting HiWatch NUS health listener...'
        )


        await BleClient.startNotifications(

          deviceId,

          HIWATCH_UART_SERVICE,

          HIWATCH_UART_RX,

          value => {

            const bytes =
              getBytes(value)


            if (!bytes.length)
              return


            const packet =
              analyzeNUSPacket(value)


            const health =
              decodeHiWatchHealth(
                bytes
              )


            const potential =
              findPotentialHealthValues(
                bytes
              )


            // ==================================================
            // IMPORTANT
            //
            // Do not overwrite a known health value with null.
            // This allows the UI to keep showing the latest
            // known reading while unrelated packets arrive.
            // ==================================================

            if (
              health.heartRate !== null
            ) {

              healthRef.current.heartRate =
                health.heartRate

              setWatchHeartRate(
                health.heartRate
              )

            }


            if (
              health.spo2 !== null
            ) {

              healthRef.current.spo2 =
                health.spo2

              setWatchSpo2(
                health.spo2
              )

            }


            if (
              health.bloodPressure !== null
            ) {

              healthRef.current.bloodPressure =
                health.bloodPressure

              setWatchBloodPressure(
                health.bloodPressure
              )

            }


            const entry = {

              id:
                `${Date.now()}-${Math.random()}`,

              time:
                new Date().toLocaleTimeString(),

              timestamp:
                Date.now(),

              ...packet,

              health: {

                ...health,

                displayedHeartRate:
                  healthRef.current.heartRate,

                displayedSpO2:
                  healthRef.current.spo2,

                displayedBloodPressure:
                  healthRef.current.bloodPressure

              },

              potential

            }


            if (capturing) {

              setPackets(prev => [

                ...prev,

                entry

              ])

            }


            // ==================================================
            // CONSOLE
            // ==================================================

            console.log(
              '========================================'
            )

            console.log(
              '⌚ HIWATCH NUS PACKET'
            )

            console.log(
              'HEX:',
              packet.hex
            )

            console.log(
              'BYTES:',
              bytes
            )

            console.log(
              'HEALTH:',
              health
            )

            console.log(
              'DISPLAY VALUES:',
              {

                heartRate:
                  healthRef.current.heartRate,

                spo2:
                  healthRef.current.spo2,

                bloodPressure:
                  healthRef.current.bloodPressure

              }
            )

            console.log(
              '========================================'
            )


            addLog(
              `⌚ NUS: ${packet.hex}`
            )

          }

        )


        setActiveListeners(prev => {

          const exists =
            prev.some(
              x =>
                x.serviceUUID ===
                  HIWATCH_UART_SERVICE &&
                x.characteristicUUID ===
                  HIWATCH_UART_RX
            )


          if (exists)
            return prev


          return [

            ...prev,

            {

              type:
                '⌚ HiWatch / NUS Health',

              serviceUUID:
                HIWATCH_UART_SERVICE,

              characteristicUUID:
                HIWATCH_UART_RX

            }

          ]

        })


        addLog(
          '⌚ HiWatch NUS listener ACTIVE.'
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
        // Log ALL services / characteristics
        // ------------------------------------------------------

        discovered.forEach(service => {

          addLog(
            `SERVICE: ${service.uuid}`
          )


          service.characteristics?.forEach(
            characteristic => {

              addLog(
                `  CHARACTERISTIC: ${characteristic.uuid} ` +
                `R:${!!characteristic.properties?.read} ` +
                `W:${!!characteristic.properties?.write} ` +
                `N:${!!characteristic.properties?.notify}`
              )

            }
          )

        })


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

          await readBattery(
            deviceId
          )

        }


        // ------------------------------------------------------
        // DEVICE INFORMATION
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
        // HIWATCH NUS
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
        // CUSTOM FFFF
        // ------------------------------------------------------

        const ffff =
          discovered.find(
            s =>
              normalizeUUID(s.uuid) ===
              CUSTOM_FFFF_SERVICE
          )


        if (ffff) {

          addLog(
            '🔧 FFFF custom service found.'
          )

        }


        // ------------------------------------------------------
        // CUSTOM 3802
        // ------------------------------------------------------

        const custom3802 =
          discovered.find(
            s =>
              normalizeUUID(s.uuid) ===
              CUSTOM_3802_SERVICE
          )


        if (custom3802) {

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


          connectedRef.current =
            null

          setConnectedDevice(null)

          setActiveListeners([])

        }

      )


      connectedRef.current =
        device


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

      setWatchHeartRate(null)

      setWatchSpo2(null)

      setWatchBloodPressure(null)


      healthRef.current = {

        heartRate: null,

        spo2: null,

        bloodPressure: null

      }


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

    const device =
      connectedRef.current ||
      connectedDevice


    if (!device)
      return


    try {

      try {

        await BleClient.stopNotifications(

          device.deviceId,

          HIWATCH_UART_SERVICE,

          HIWATCH_UART_RX

        )

      } catch {}


      try {

        await BleClient.stopNotifications(

          device.deviceId,

          HEART_RATE_SERVICE,

          HEART_RATE_CHARACTERISTIC

        )

      } catch {}


      await BleClient.disconnect(
        device.deviceId
      )


      connectedRef.current =
        null


      setConnectedDevice(null)

      setServices([])

      setServiceSummary([])

      setActiveListeners([])

      setBatteryLevel(null)

      setHeartRate(null)

      setWatchHeartRate(null)

      setWatchSpo2(null)

      setWatchBloodPressure(null)

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
  // EXPORT
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


    a.href =
      url

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
          SCAN
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
          HUMAN READABLE HEALTH DASHBOARD
      ====================================================== */}

      {connectedDevice && (

        <section className="mb-8">

          <h2 className="text-xl font-bold mb-3">

            ❤️ Watch Health

          </h2>


          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

            {/* HEART RATE */}

            <div className="border rounded p-4 bg-red-50">

              <div className="text-gray-600">

                ❤️ Watch HR

              </div>

              <div className="text-3xl font-bold">

                {watchHeartRate !== null
                  ? `${watchHeartRate} BPM`
                  : '--'}

              </div>

              <div className="text-xs text-gray-500 mt-2">

                HiWatch NUS

              </div>

            </div>


            {/* SPO2 */}

            <div className="border rounded p-4 bg-blue-50">

              <div className="text-gray-600">

                🫁 Watch SpO₂

              </div>

              <div className="text-3xl font-bold">

                {watchSpo2 !== null
                  ? `${watchSpo2}%`
                  : '--'}

              </div>

              <div className="text-xs text-gray-500 mt-2">

                HiWatch NUS

              </div>

            </div>


            {/* BP */}

            <div className="border rounded p-4 bg-purple-50">

              <div className="text-gray-600">

                🩸 Watch BP

              </div>

              <div className="text-3xl font-bold">

                {watchBloodPressure ||
                  '--'}

              </div>

              <div className="text-xs text-gray-500 mt-2">

                HiWatch NUS

              </div>

            </div>


            {/* BATTERY */}

            <div className="border rounded p-4 bg-green-50">

              <div className="text-gray-600">

                🔋 Battery

              </div>

              <div className="text-3xl font-bold">

                {batteryLevel !== null
                  ? `${batteryLevel}%`
                  : '--'}

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
          READABLE HEALTH TABLE
      ====================================================== */}

      {packets.length > 0 && (

        <section className="mb-8">

          <h2 className="text-xl font-bold mb-3">

            📊 Watch Health Readings

          </h2>


          <div className="overflow-x-auto border rounded">

            <table className="min-w-full text-sm">

              <thead className="bg-gray-100">

                <tr>

                  <th className="p-3 text-left">
                    Packet
                  </th>

                  <th className="p-3 text-left">
                    Time
                  </th>

                  <th className="p-3 text-left">
                    ❤️ Watch HR
                  </th>

                  <th className="p-3 text-left">
                    🫁 Watch SpO₂
                  </th>

                  <th className="p-3 text-left">
                    🩸 Watch BP
                  </th>

                  <th className="p-3 text-left">
                    HEX
                  </th>

                </tr>

              </thead>


              <tbody>

                {packets
                  .slice()
                  .reverse()
                  .map(
                    (packet, index) => {

                      const displayedHealth =
                        packet.health || {}


                      return (

                        <tr
                          key={packet.id}
                          className="border-t hover:bg-gray-50"
                        >

                          <td className="p-3 font-bold">

                            {packets.length -
                              index}

                          </td>


                          <td className="p-3">

                            {packet.time}

                          </td>


                          <td className="p-3 font-bold">

                            {displayedHealth
                              .displayedHeartRate !== null &&
                            displayedHealth
                              .displayedHeartRate !== undefined

                              ? `${displayedHealth.displayedHeartRate} BPM`

                              : '--'}

                          </td>


                          <td className="p-3 font-bold">

                            {displayedHealth
                              .displayedSpO2 !== null &&
                            displayedHealth
                              .displayedSpO2 !== undefined

                              ? `${displayedHealth.displayedSpO2}%`

                              : '--'}

                          </td>


                          <td className="p-3 font-bold">

                            {displayedHealth
                              .displayedBloodPressure ||
                              '--'}

                          </td>


                          <td className="p-3">

                            <div
                              className="font-mono text-xs whitespace-nowrap max-w-md overflow-x-auto"
                            >

                              {packet.hex}

                            </div>

                          </td>

                        </tr>

                      )

                    }
                  )}

              </tbody>

            </table>

          </div>

        </section>

      )}


      {/* =====================================================
          GATT SERVICES
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
          CAPTURE CONTROLS
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
          PACKET TABLE
      ====================================================== */}

      {packets.length > 0 && (

        <section className="mb-8">

          <h2 className="text-xl font-bold mb-3">

            Raw HiWatch NUS Packets

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

                          {packets.length -
                            index}

                        </td>


                        <td className="p-2">

                          {packet.time}

                        </td>


                        <td className="p-2">

                          {packet.length}

                        </td>


                        <td className="p-2 font-mono">

                          {hexByte(
                            packet.firstByte
                          )}

                        </td>


                        <td className="p-2 font-mono">

                          {hexByte(
                            packet.command
                          )}

                        </td>


                        <td className="p-2 font-mono">

                          {hexByte(
                            packet.subCommand
                          )}

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
          BYTE ANALYSIS
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

                                  {hexByte(
                                    byte
                                  )}

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


                    <div className="mt-4 bg-yellow-50 rounded p-3">

                      <div className="font-bold">

                        Potential Health Values

                      </div>


                      <div className="text-xs mt-2">

                        ❤️ HR candidates:

                        {' '}

                        {packet.health
                          ?.possibleHeartRate
                          ?.map(
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
                          ?.possibleSpO2
                          ?.map(
                            x =>
                              `[${x.index}] ${x.value}`
                          )
                          .join(', ') ||
                          'none'}

                      </div>


                      <div className="text-xs mt-2">

                        🩸 BP candidates:

                        {' '}

                        {packet.health
                          ?.possibleBloodPressure
                          ?.map(
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
                          ?.possible16BitValues
                          ?.map(
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