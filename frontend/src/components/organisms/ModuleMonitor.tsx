import React from "react";
import type { AuditLog } from "@/types";

interface ModuleMonitorProps {
  logs: AuditLog[];
}

export const ModuleMonitor: React.FC<ModuleMonitorProps> = ({ logs }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Activity Monitor</h2>
      <div className="flex flex-col gap-2">
        {logs.map((log) => (
          <div key={log.id} className="p-2 border-b">
            <p>
              {log.userId} performed {log.action}
            </p>
            <p>{new Date(log.timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
