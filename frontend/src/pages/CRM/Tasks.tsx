import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TaskCard } from "@/components/molecules/TaskCard";
import { fetchTasks, updateTask } from "@/store/slices/crmSlice";
import type { RootState, AppDispatch } from "@/store";
import type { Task } from "@/types";
import { Sidebar } from "@/components/organisms/Sidebar";

export const Tasks: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, isLoading, error } = useSelector(
    (state: RootState) => state.crm
  );
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(fetchTasks(user.id));
    }
  }, [dispatch, user]);

  const handleUpdate = (id: string, updates: Partial<Task>) => {
    dispatch(updateTask({ id, updates }));
  };

  return (
    <div className="flex max-w-[1200px] mx-auto p-4">
      <Sidebar />
      <div className="flex-1 ml-64">
        <h2 className="text-2xl font-bold mb-4">Tasks</h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task: Task) => (
            <TaskCard key={task.id} task={task} onUpdate={handleUpdate} />
          ))}
        </div>
      </div>
    </div>
  );
};
