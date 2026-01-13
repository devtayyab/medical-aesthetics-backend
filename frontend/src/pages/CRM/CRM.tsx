import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Users,
  Phone,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Filter,
  Building,
  Target,
  Award,
  Clock,
  X
} from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Badge } from '@/components/atoms/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/molecules/Tabs';
import { LeadsPage } from '@/pages/CRM/Leads';
import { Tasks } from '@/pages/CRM/Tasks';
import { OneCustomerDetail } from '@/pages/CRM/OneCustomerDetail';
import {
  fetchLeads,
  fetchActions,
  fetchOverdueTasks,
  fetchAutomationRules,
  runTaskAutomationCheck,
  createLead
} from '@/store/slices/crmSlice';
import type { RootState, AppDispatch } from '@/store';
import type { Lead } from '@/types/crm.types';
import type { CrmAction, Task } from '@/types';
import { TaskDetails } from '@/pages/CRM/TaskDetails';
import { fetchTasks } from "@/store/slices/TaskSlice"
export const CRM: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    leads,
    overdueTasks,
    pendingTasks,
    analytics,
    automationRules,
    isLoading,
    error
  } = useSelector((state: RootState) => state.crm);
  ``

  const { tasks } = useSelector((state: RootState) => state.task);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<Lead | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [forceShowCreateForm, setForceShowCreateForm] = useState(false);

  const handleAddNewLead = () => {
    setForceShowCreateForm(true);
    setActiveTab('leads');
  };

  const handleFormShown = () => {
    setForceShowCreateForm(false);
  };
  React.useEffect(() => {
    if (user) {
      dispatch(fetchLeads({}));
      dispatch(fetchTasks());
      dispatch(fetchActions({ salespersonId: user.id }));
      dispatch(fetchOverdueTasks(user.id));
      dispatch(fetchAutomationRules());
    }
  }, [dispatch, user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleRunAutomation = async () => {
    try {
      await dispatch(runTaskAutomationCheck()).unwrap();
      // Refresh data after automation
      if (user) {
        dispatch(fetchActions({ salespersonId: user.id }));
        dispatch(fetchOverdueTasks(user.id));
      }
    } catch (error) {
      console.error('Failed to run automation:', error);
    }
  };

  const handleViewCustomer = (customer: Lead) => {
    setSelectedCustomer(customer);
    setActiveTab('customer');
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setActiveTab('task');
  };
  const updatedTasks = tasks.map(task => {
    const dueDate = new Date(task.dueDate);
    const now = new Date();

    // Check if due date is in the past and task is not completed
    if (dueDate < now && task.status !== 'completed') {
      return { ...task, status: 'overdue' };
    }

    return task;
  });


  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between p-4 ">
          {/* Title & Subtitle */}
          <div>
            <h1 className="text-3xl font-semibold text-gray-800">CRM Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Manage leads, customers, and sales activities
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 transition-all"
              onClick={handleRunAutomation}
            >
              <Target className="h-4 w-4 mr-2 text-blue-600" />
              Run Automation
            </Button>

            <Button
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Quick Actions
            </Button>
          </div>
        </div>
      </Card>
      {/* Main Navigation Tabs */}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        defaultValue="dashboard"
        className='w-full p-4 md:p-6 bg-gray-50 rounded-2xl shadow-sm'
      >
        <Card>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
        </Card>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">{leads.length}</div>
                    <div className="text-sm text-gray-500">Total Leads</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {leads.filter(l => l.status === 'converted').length}
                    </div>
                    <div className="text-sm text-gray-500">Converted</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-bold">{tasks.filter(l => l.status === 'pending').length}</div>
                    <div className="text-sm text-gray-500">Pending Tasks</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold">{updatedTasks.filter(l => l.status === 'overdue').length}</div>
                    <div className="text-sm text-gray-500">Overdue</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold pb-4">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleAddNewLead}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Lead
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="h-4 w-4 mr-2" />
                    Log Call
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Follow-up
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Building className="h-4 w-4 mr-2" />
                    Import Facebook Leads
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Leads */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold pb-4">Recent Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leads.slice(0, 5).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {lead.firstName} {lead.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{lead.email}</div>
                      </div>
                      <Badge variant={lead.status === 'new' ? 'info' : 'warning'}>
                        {lead.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Overdue Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-red-600 " />
                  Overdue Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {updatedTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div>
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-gray-600">
                          {task.description}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="error" size="sm">Overdue</Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(task.dueDate || '').toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No overdue tasks
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Automation Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Active Automation Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {automationRules.map((rule) => (
                  <div key={rule.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{rule.name}</h4>
                      <Badge variant="success" size="sm">Active</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Triggers {rule.delayDays > 0 ? `+${rule.delayDays}` : rule.delayDays} days
                    </div>
                    <div className="text-xs text-gray-500">
                      Priority: {rule.priority}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads">
          <LeadsPage
            onViewLead={handleViewCustomer}
            forceShowCreateForm={forceShowCreateForm}
            onFormShown={handleFormShown}
          />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Tasks onViewTask={handleViewTask} />
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers">
          <div className="space-y-6">
            {/* Customer Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input placeholder="Search customers by name, email, or phone..." />
                  </div>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Customer List */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Customer management interface coming soon...
                  <br />
                  Use the "Customer Details" tab to view individual customers.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        {analytics?.communications.calls || 0}
                      </div>
                      <div className="text-sm text-gray-500">Total Calls</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        {analytics?.customers.repeat || 0}
                      </div>
                      <div className="text-sm text-gray-500">Repeat Customers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(analytics?.customers.totalRevenue || 0)}
                      </div>
                      <div className="text-sm text-gray-500">Total Revenue</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Detailed analytics dashboard coming soon...
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* s Modal/Tab */}
      {selectedCustomer && activeTab === 'customer' && (

        <div className="space-y-6">
          <Card>
            <div className="px-8">

              <div className="flex  justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Customer Details
                  </h2></div>
                <div>
                  <Button variant="outline" onClick={() => setActiveTab('leads')}>
                    ← Back to Leads
                  </Button>
                </div>
              </div>

            </div>
            <OneCustomerDetail
              SelectedCustomer={selectedCustomer}
              isLoading={isLoading}
              error={error}


            />
          </Card>

        </div>
      )
      }

      {/* s Modal/Tab */}
      {selectedTask && activeTab === 'task' && (

        <div className="space-y-6">
          <Card>
            <div className="px-8">

              <div className="flex  justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Task Details
                  </h2></div>
                <div>
                  <Button variant="outline" onClick={() => setActiveTab('tasks')}>
                    ← Back to Tasks
                  </Button>
                </div>
              </div>

            </div>
            <TaskDetails
              selectedTask={selectedTask}
            />
          </Card>

        </div>
      )
      }
    </div >
  );
};
