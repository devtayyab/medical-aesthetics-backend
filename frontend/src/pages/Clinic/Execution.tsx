import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { recordExecution } from "@/store/slices/clinicSlice";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";

export const Execution: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { appointments, isLoading, error } = useSelector(
    (state: RootState) => state.clinic
  );
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [finalAmount, setFinalAmount] = useState(0);

  const handleRecordExecution = () => {
    if (selectedAppointmentId && paymentMethod && finalAmount > 0) {
      dispatch(
        recordExecution({
          appointmentId: selectedAppointmentId,
          paymentMethod,
          finalAmount,
        })
      ).unwrap();
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Record Execution</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="mb-4">
        <label
          htmlFor="appointment-select"
          className="block text-sm font-medium text-gray-700"
        >
          Select Appointment
        </label>
        <select
          id="appointment-select"
          value={selectedAppointmentId}
          onChange={(e) => setSelectedAppointmentId(e.target.value)}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" disabled>
            Select Appointment
          </option>
          {appointments.map((a) => (
            <option key={a.id} value={a.id}>
              {`${a.service?.name} - ${new Date(a.startTime).toLocaleTimeString()}`}
            </option>
          ))}
        </select>
      </div>
      <Input
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        placeholder="Payment Method (e.g., credit_card)"
        className="mt-4"
      />
      <Input
        type="number"
        value={finalAmount}
        onChange={(e) => setFinalAmount(Number(e.target.value))}
        placeholder="Final Amount"
        className="mt-4"
      />
      <Button
        onClick={handleRecordExecution}
        disabled={isLoading}
        className="mt-4"
      >
        Record Execution
      </Button>
    </div>
  );
};
