import React, { useCallback } from "react";
import StaffDiary from "@/pages/CRM/StaffDiary";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { fetchClinicProfile, fetchAppointments, fetchServices } from "@/store/slices/clinicSlice";

export const Diary: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile, myClinics, isLoading } = useSelector((state: RootState) => state.clinic);
  const { user } = useSelector((state: RootState) => state.auth);

  // The clinic chosen in the layout switcher (profile is reloaded on every switch) wins over
  // a stored id, and a stored id is only trusted if it belongs to the user's clinics.
  const storedClinicId = localStorage.getItem('activeClinicId');
  const validStoredId =
    storedClinicId && (!myClinics?.length || myClinics.some((c: any) => c.id === storedClinicId))
      ? storedClinicId
      : null;
  const activeClinicId =
    profile?.id ||
    validStoredId ||
    myClinics?.[0]?.id ||
    user?.assignedClinicId;

  const handleDiaryClinicChange = useCallback(
    (newClinicId: string) => {
      if (!newClinicId || newClinicId === 'all' || newClinicId === profile?.id) return;
      localStorage.setItem('activeClinicId', newClinicId);
      try { sessionStorage.setItem('calendar.viewedClinicId', newClinicId); } catch {}
      dispatch(fetchClinicProfile(newClinicId));
      dispatch(fetchAppointments({ clinicId: newClinicId }));
      dispatch(fetchServices(newClinicId));
    },
    [dispatch, profile?.id],
  );

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
      <StaffDiary clinicId={activeClinicId} onClinicChange={handleDiaryClinicChange} />
    </div>
  );
};
