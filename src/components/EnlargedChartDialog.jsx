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
              <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
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
                  {chartData.length > 1 ? (
                     <HealthChart data={chartData} color={chartColor} type={chartType} className="h-[300px]" height="300px" showLabels colorBy={chartMetric === "heartRate" ? "heartRate" : undefined} />
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">Not enough data to show chart.</p>
                  )}
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
