import React from "react";
import type { CrmAction } from "@/types";

interface ActionLogProps {
  actions: CrmAction[];
}

// export interface CrmAction {
//   id: string;
//   customerId: string;
//   salespersonId: string;
//   actionType: 'phone_call' | 'email' | 'follow_up' | 'appointment_confirmation' | 'treatment_reminder' | 'meeting';
//   title: string;
//   description?: string;
//   status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
//   priority: 'low' | 'medium' | 'high' | 'urgent';
//   dueDate?: string;
//   completedAt?: string;
//   clinic?: string;
//   proposedTreatment?: string;
//   cost?: number;
//   callOutcome?: string;
//   metadata?: {
//     clinic?: string;
//     proposedTreatment?: string;
//     cost?: number;
//     callOutcome?: string;
//     appointmentId?: string;
//     automationRule?: string;
//     createdBy?: string;
//     source?: string;
//     [key: string]: any;
//   };
//   createdAt: string;
//   updatedAt: string;
//   customer?: User;
//   salesperson?: User;
// }

export const ActionLog: React.FC<ActionLogProps> = ({ actions }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Action Log</h2>
      <div className="flex flex-col gap-2">
        {actions?.map((action) => (
          <div key={action.id} className="p-2 border-b">
            <p>
              {action.title}: {action.status}
            </p>
            <p>{action.description}</p>
            <p>{action.customerId}</p>
            <p>{action.callOutcome}</p>
          
            <p>{new Date(action.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
