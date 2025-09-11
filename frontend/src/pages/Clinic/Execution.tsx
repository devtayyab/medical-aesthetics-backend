import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppointmentCard } from "@/components/molecules/AppointmentCard";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import {
  fetchClinicAppointments,
  recordExecution,
} from "@/store/slices/clinicSlice";
import type { RootState, AppDispatch } from "@/store";
import type { Appointment } from "@/types";
import { Sidebar } from "@/components/organisms/Sidebar";

export const Execution: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { appointments, isLoading, error } = useSelector(
    (state: RootState) => state.clinic
  );
  const [paymentDetails, setPaymentDetails] = React.useState<{
    [key: string]: { method: string; amount: number };
  }>({});

  useEffect(() => {
    dispatch(fetchClinicAppointments());
  }, [dispatch]);

  const handleRecord = (appointmentId: string) => {
    const { method, amount } = paymentDetails[appointmentId] || {
      method: "",
      amount: 0,
    };
    if (method && amount > 0) {
      dispatch(
        recordExecution({
          appointmentId,
          paymentMethod: method,
          finalAmount: amount,
        })
      );
    }
  };

  const handlePaymentChange = (
    appointmentId: string,
    field: string,
    value: string | number
  ) => {
    setPaymentDetails({
      ...paymentDetails,
      [appointmentId]: { ...paymentDetails[appointmentId], [field]: value },
    });
  };

  return (
    <div className="flex max-w-[1200px] mx-auto p-4">
      <Sidebar />
      <div className="flex-1 ml-64">
        <h2 className="text-2xl font-bold mb-4">Record Execution</h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((appointment: Appointment) => (
            <div key={appointment.id} className="flex flex-col gap-2">
              <AppointmentCard appointment={appointment} />
              <div className="flex gap-2">
                <Input
                  placeholder="Payment Method"
                  value={paymentDetails[appointment.id]?.method || ""}
                  onChange={(e) =>
                    handlePaymentChange(
                      appointment.id,
                      "method",
                      e.target.value
                    )
                  }
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={paymentDetails[appointment.id]?.amount || ""}
                  onChange={(e) =>
                    handlePaymentChange(
                      appointment.id,
                      "amount",
                      Number(e.target.value)
                    )
                  }
                />
                <Button onClick={() => handleRecord(appointment.id)}>
                  Record
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
