import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";

const AllHealthReadingsDialog = ({ open, onClose, readings }) => {
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
              <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl shadow-xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                  <Dialog.Title className="text-lg font-semibold text-gray-800">
                    📊 All Health Readings
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {!readings || readings.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No readings available.</p>
                  ) : (
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
                          {readings.map((r, i) => (
                            <tr key={r.id || i} className="border-t text-gray-700">
                              <td className="p-2 text-gray-700">
                                {r.createdAt ? new Date(r.createdAt).toLocaleString() : '--'}
                              </td>
                              <td className="p-2 text-gray-700">
                                {r.heartRate !== null ? `${r.heartRate} BPM` : '--'}
                              </td>
                              <td className="p-2 text-gray-700">
                                {r.spo2 !== null ? `${r.spo2}%` : '--'}
                              </td>
                              <td className="p-2 text-gray-700">
                                {r.bloodPressure || '--'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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

export default AllHealthReadingsDialog;
