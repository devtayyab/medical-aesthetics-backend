import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ModuleMonitor } from "@/components/organisms/ModuleMonitor";
import { fetchLogs } from "@/store/slices/adminSlice";
import type { RootState, AppDispatch } from "@/store";
import type { AuditLog } from "@/types";

export const Monitor: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { logs, isLoading, error } = useSelector(
    (state: RootState) => state.admin
  );

  useEffect(() => {
    dispatch(fetchLogs());
  }, [dispatch]);

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">System Monitor</h2>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <ModuleMonitor logs={logs} />
    </>
  );
};
