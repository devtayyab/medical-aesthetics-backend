import React from "react";
import { Card } from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import type { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate }) => {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">{task.description}</h3>
        <p className="text-gray-600">
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </p>
        <p className="text-gray-600">Status: {task.status}</p>
        {onUpdate && task.status !== "completed" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdate(task.id, { status: "completed" })}
          >
            Mark as Completed
          </Button>
        )}
      </div>
    </Card>
  );
};
