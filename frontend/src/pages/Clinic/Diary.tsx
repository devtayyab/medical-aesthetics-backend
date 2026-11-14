import React from "react";
import StaffDiary from "@/pages/CRM/StaffDiary";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

export const Diary: React.FC = () => {
  const { profile, myClinics, isLoading } = useSelector((state: RootState) => state.clinic);
  const { user } = useSelector((state: RootState) => state.auth);

  // The clinic chosen in the layout switcher (profile is reloaded on every switch) wins over
  // a stored id, so the diary never shows another clinic's appointments (QA #29 & NEW-8).
  const activeClinicId =
    profile?.id ||
    localStorage.getItem('activeClinicId') ||
    myClinics?.[0]?.id ||
    user?.assignedClinicId;

  // Wait until ClinicLayout has finished resolving the active clinic profile before mounting StaffDiary (QA NEW-8).
  if (!profile?.id && (isLoading || !activeClinicId)) {
    return (
      <div className="h-full w-full flex-1 flex items-center justify-center bg-gray-50/50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex-1 flex flex-col min-h-0 overflow-hidden bg-gray-50/50">
      <StaffDiary clinicId={activeClinicId} />
    </div>
  );
};
