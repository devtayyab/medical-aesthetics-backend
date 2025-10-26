import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ActionLog } from "@/components/organisms/ActionLog";
import { fetchLeads } from "@/store/slices/crmSlice";
import type { RootState, AppDispatch } from "@/store";
import type { ActionLog as ActionLogType } from "@/types";

export const Actions: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { actions, isLoading, error } = useSelector(
    (state: RootState) => state.crm
  );

  useEffect(() => {
    dispatch(fetchLeads(id)); // Fetch leads to get associated actions
  }, [dispatch]);

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Action Log</h2>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <ActionLog actions={actions} />
    </>
  );
};
