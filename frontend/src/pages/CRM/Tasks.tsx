import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, Trash2, Plus, Edit } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Select } from '@/components/atoms/Select/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';

import type { RootState, AppDispatch } from '@/store';
import { createAction, deleteAction, updateAction, fetchActions } from '@/store/slices/crmSlice';
import type { CrmAction } from '@/types';
import { CheckCircle, Clock, AlertTriangle, Users } from 'lucide-react';

interface TasksPageProps {
  onViewTask?: (task: any) => void;
}

type TaskFormData = {
  title: string;
  description: string;
  actionType: CrmAction['actionType'];
  status: 'pending' | 'completed' | 'cancelled';
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  customerId?: string;
};



export const Tasks: React.FC<TasksPageProps> = ({ onViewTask }) => {
  const { actions: tasks, isLoading } = useSelector((state: RootState) => state.crm);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  const currentUserId = user?.id;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<CrmAction | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    actionType: 'follow_up', // Changed from type to actionType
    status: 'pending',
    dueDate: new Date().toISOString().slice(0, 16),
    priority: 'medium'
  });

  useEffect(() => {
    if (currentUserId) {
      // Fetch CRM Actions for the salesperson
      dispatch(fetchActions({ salespersonId: currentUserId }));
    }
  }, [dispatch, currentUserId]);

  const resetForm = () => {
    setShowCreateForm(false);
    setIsEditing(false);
    setSelectedTask(null);
    setTaskFormData({
      title: '',
      description: '',
      actionType: 'follow_up',
      status: 'pending',
      dueDate: new Date().toISOString().slice(0, 16),
      priority: 'medium'
    });
  };

  const handleCreateTask = async () => {
    if (!taskFormData.title || !taskFormData.actionType) {
      alert('Please fill in required fields');
      return;
    }
    try {
      await dispatch(createAction({
        ...taskFormData,
        salespersonId: user?.id
      })).unwrap();
      resetForm();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await dispatch(deleteAction(id)).unwrap();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleUpdateTask = async (task: CrmAction) => {
    if (!taskFormData.title || !taskFormData.actionType) {
      alert('Please fill in required fields');
      return;
    }

    try {
      const updates = { ...taskFormData };
      await dispatch(updateAction({ id: task.id, updates })).unwrap();
      resetForm();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const updatedTasks = tasks.map(task => {
    const dueDate = new Date(task.dueDate);
    const now = new Date();

    // Check if due date is in the past and task is not completed
    if (dueDate < now && task.status !== 'completed' && task.status !== 'cancelled') {
      return { ...task, status: 'overdue' as any };
    }

    return task;
  });

  const filteredTasks = updatedTasks.filter(
    (task) =>
      task.actionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date?: string) =>
    date
      ? new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      : '-';

  return (
    <div className="space-y-6">


      {/* Header */}
      <Card>
        <div className="flex items-center justify-between p-4">
          <div>
            <h2 className="text-2xl font-bold">Task Management</h2>
            <p className="text-gray-500 mt-1">Manage your tasks and follow-ups</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Task
          </Button>
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{tasks.length}</div>
                <div className="text-sm text-gray-500">Total tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">
                  {updatedTasks.filter(l => l.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-500">pending Tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">
                  {updatedTasks.filter(l => l.status === 'overdue').length}
                </div>
                <div className="text-sm text-gray-500">Overdue Tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {updatedTasks.filter(l => l.status === 'in_progress').length}
                </div>
                <div className="text-sm text-gray-500">In Progress Tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">
                  {updatedTasks.filter(l => l.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-500">completed Tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No tasks found</div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border rounded-lg flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-medium capitalize">{task.title}</h3>
                    <p className="text-sm text-gray-500">{task.description}</p>
                    <p className="text-xs text-gray-400">Type: {task.actionType}</p>
                    <p className="text-xs text-gray-400">Due: {formatDate(task.dueDate)}</p>
                    <p className={`text-xs ${task.status === 'overdue' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>Status: {task.status}</p>
                  </div>
                  <div className="flex gap-2">

                    <Button size="sm" variant="ghost" onClick={() => onViewTask?.(task)} >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedTask(task);
                        setTaskFormData({
                          title: task.title || '',
                          description: task.description || '',
                          actionType: task.actionType,
                          status: task.status as any,
                          dueDate: task.dueDate
                            ? new Date(task.dueDate).toISOString().slice(0, 16)
                            : new Date().toISOString().slice(0, 16),
                          priority: task.priority as any
                        });
                        setIsEditing(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteTask(task.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Task Modal */}
      {showCreateForm && (
        <div className="bg-black bg-opacity-50 fixed inset-0 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateTask();
            }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">Create Task</h2>

            <Input
              label="Title"
              value={taskFormData.title}
              onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
              required
            />

            <Input
              label="Description"
              value={taskFormData.description}
              onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
            />

            <Input
              type="datetime-local"
              label="Due Date"
              value={taskFormData.dueDate}
              onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
              required
            />
            <div className='grid grid-cols-2 gap-4 mt-4'>
              <Select
                label="Status"
                value={taskFormData.status}
                onChange={(e) =>
                  setTaskFormData({ ...taskFormData, status: e.target.value as TaskFormData['status'] })
                }
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
              <Select
                label="Type"
                value={taskFormData.actionType}
                onChange={(e) =>
                  setTaskFormData({ ...taskFormData, actionType: e.target.value as CrmAction['actionType'] })
                }
                options={[
                  { value: 'follow_up', label: 'Follow Up' },
                  { value: 'phone_call', label: 'Phone Call' },
                  { value: 'email', label: 'Email' },
                  { value: 'appointment_confirmation', label: 'Appointment Confirmation' },
                  { value: 'meeting', label: 'Meeting' },
                ]}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Create
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditing && selectedTask && (
        <div className="bg-black bg-opacity-50 fixed inset-0 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdateTask(selectedTask);
            }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">Edit Task</h2>

            <Input
              label="Title"
              value={taskFormData.title}
              onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
              required
            />

            <Input
              label="Description"
              value={taskFormData.description}
              onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
            />



            <Input
              type="datetime-local"
              label="Due Date"
              value={taskFormData.dueDate}
              onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
              required
            />
            <div className='grid grid-cols-2 gap-4 mt-4'>

              <Select
                label="Status"
                value={taskFormData.status}
                onChange={(e) =>
                  setTaskFormData({ ...taskFormData, status: e.target.value as TaskFormData['status'] })
                }
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />

              <Select
                label="Type"
                value={taskFormData.actionType}
                onChange={(e) =>
                  setTaskFormData({ ...taskFormData, actionType: e.target.value as CrmAction['actionType'] })
                }
                options={[
                  { value: 'follow_up', label: 'Follow Up' },
                  { value: 'phone_call', label: 'Phone Call' },
                  { value: 'email', label: 'Email' },
                  { value: 'appointment_confirmation', label: 'Appointment Confirmation' },
                  { value: 'meeting', label: 'Meeting' },
                ]}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Update
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
