import React from "react";
import { Card } from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import type { Appointment } from "@/types";

interface AppointmentCardProps {
  appointment: Appointment;
  onCancel?: (id: string) => void;
  onReschedule?: (id: string) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onCancel,
  onReschedule,
}) => {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">{appointment.service.name}</h3>
        <p className="text-gray-600">Clinic: {appointment.clinic.name}</p>
        <p className="text-gray-600">
          Date: {new Date(appointment.startTime).toLocaleString()}
        </p>
        <p className="text-gray-600">Status: {appointment.status}</p>
        <div className="flex gap-2">
          {onReschedule && appointment.status === "confirmed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReschedule(appointment.id)}
            >
              Reschedule
            </Button>
          )}
          {onCancel && appointment.status === "confirmed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(appointment.id)}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
