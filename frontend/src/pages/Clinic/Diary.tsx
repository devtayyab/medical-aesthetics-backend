import React from "react";
import StaffDiary from "@/pages/CRM/StaffDiary";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

export const Diary: React.FC = () => {
  const { profile } = useSelector((state: RootState) => state.clinic);
  const { user } = useSelector((state: RootState) => state.auth);

  const activeClinicId =
    localStorage.getItem('activeClinicId') ||
    profile?.id ||
    user?.assignedClinicId ||
    (user as any)?.ownedClinics?.[0]?.id ||
    (user as any)?.assignedClinics?.[0]?.id;

  return (
    <div className="h-full w-full flex-1 flex flex-col min-h-0 overflow-hidden bg-gray-50/50">
      <StaffDiary clinicId={activeClinicId} />
    </div>
  );
};
