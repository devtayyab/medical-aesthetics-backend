import React from "react";
import type { ActionLog } from "@/types";

interface ActionLogProps {
  actions: ActionLog[];
}

export const ActionLog: React.FC<ActionLogProps> = ({ actions }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Action Log</h2>
      <div className="flex flex-col gap-2">
        {actions.map((action) => (
          <div key={action.id} className="p-2 border-b">
            <p>
              {action.type}: {action.notes}
            </p>
            <p>{new Date(action.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
