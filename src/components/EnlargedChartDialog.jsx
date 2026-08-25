import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import HealthChart from "./HealthChart";

const EnlargedChartDialog = ({ open, onClose, chartData, chartColor, chartType, chartMetric }) => {
  const chartTitle =
    chartMetric === "heartRate"
      ? "❤️ Heart Rate"
      : chartMetric === "spo2"
      ? "🫁 SpO₂"
      : "🩸 Blood Pressure (Systolic)";

  const legendItems =
    chartMetric === "heartRate"
      ? [
          { color: "#22c55e", label: "Normal", range: "60–100 BPM" },
          { color: "#f59e0b", label: "Atenção", range: "101–120 BPM" },
          { color: "#ef4444", label: "Crítico", range: ">120 BPM" },
          { color: "#3b82f6", label: "Baixo", range: "<60 BPM" },
        ]
      : chartMetric === "spo2"
      ? [
          { color: "#22c55e", label: "Normal", range: "95–100%", desc: "Geralmente considerado normal" },
          { color: "#f59e0b", label: "Atenção", range: "90–94%", desc: "Merece atenção, especialmente se persistir" },
          { color: "#ef4444", label: "Crítico", range: "<90%", desc: "Leitura preocupante, confirme com oxímetro" },
        ]
      : chartMetric === "bloodPressure"
      ? [
          { color: "#22c55e", label: "Normal", range: "90–140 mmHg" },
          { color: "#ef4444", label: "Crítico", range: ">140 mmHg" },
          { color: "#3b82f6", label: "Baixo", range: "<90 mmHg" },
        ]
      : [];

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                  <Dialog.Title className="text-lg font-semibold text-gray-800">
                    {chartTitle}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      {chartData.length > 1 ? (
                        <HealthChart data={chartData} color={chartColor} type={chartType} className="h-[300px]" height="300px" showLabels colorBy={chartMetric === "heartRate" ? "heartRate" : chartMetric === "spo2" ? "spo2" : chartMetric === "bloodPressure" ? "bloodPressure" : undefined} />
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-8">Not enough data to show chart.</p>
                      )}
                    </div>

                    {legendItems.length > 0 && (
                      <div className="md:w-48 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 md:mb-0">
                          Legenda
                        </p>
                        <div className="flex md:flex-col gap-2">
                          {legendItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 md:gap-0 md:space-x-0">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                               <div className="md:ml-2">
                                 <p className="text-xs font-medium text-gray-800">{item.label}</p>
                                 <p className="text-[10px] text-gray-500">{item.range}</p>
                                 {item.desc && <p className="text-[10px] text-gray-400">{item.desc}</p>}
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EnlargedChartDialog;
