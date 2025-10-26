import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  TrendingUp,
  Star,
  Award,
  AlertCircle,
  CheckCircle,
  Building,
  Stethoscope,
  Tag,
  MessageSquare,
  FileText,
  Plus
} from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/molecules/Tabs';
import { CommunicationForm } from '@/components/organisms/CommunicationForm/CommunicationForm';
import { ActionForm } from '@/components/organisms/ActionForm/ActionForm';
import type { CustomerSummary } from '@/types';

interface CustomerDetailsProps {
  customerData: CustomerSummary;
  onUpdate?: () => void;
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({
  customerData,
  onUpdate
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { record, appointments, communications, actions, tags, affiliations, summary } = customerData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'confirmed':
        return 'info';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {record.customer?.firstName} {record.customer?.lastName}
                </h1>
                <div className="flex items-center gap-4 text-gray-600 mt-1">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {record.customer?.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {record.customer?.phone || 'No phone'}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {record.isRepeatCustomer && (
                    <Badge variant="success">
                      <Award className="h-3 w-3 mr-1" />
                      Repeat Customer
                    </Badge>
                  )}
                  <Badge variant="info">
                    {summary.repeatCount} visits
                  </Badge>
                  <Badge variant="secondary">
                    {formatCurrency(summary.lifetimeValue)} lifetime value
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Assigned to</div>
              <div className="font-medium">
                {record.assignedSalesperson?.firstName} {record.assignedSalesperson?.lastName}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{summary.totalAppointments}</div>
                <div className="text-sm text-gray-500">Total Appointments</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{summary.completedAppointments}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{formatCurrency(summary.lifetimeValue)}</div>
                <div className="text-sm text-gray-500">Lifetime Value</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{summary.repeatCount}</div>
                <div className="text-sm text-gray-500">Repeat Visits</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="affiliations">Affiliations</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {communications.slice(0, 3).map((comm) => (
                    <div key={comm.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <MessageSquare className="h-4 w-4 text-gray-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">{comm.type}</span>
                          <Badge variant={getStatusColor(comm.status)} size="sm">
                            {comm.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{comm.notes}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(comm.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {actions.filter(a => a.status === 'pending').slice(0, 3).map((action) => (
                    <div key={action.id} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Clock className="h-4 w-4 text-yellow-600 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{action.title}</span>
                          <Badge variant={getPriorityColor(action.priority)} size="sm">
                            {action.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{action.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Due: {action.dueDate ? formatDate(action.dueDate) : 'No due date'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="primary" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Communication
                </Button>
                <Button variant="secondary" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
                <Button variant="outline" size="sm">
                  <Tag className="h-4 w-4 mr-2" />
                  Add Tag
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appointment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{appointment.serviceName}</div>
                        <div className="text-sm text-gray-600">{appointment.clinicName}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(appointment.startTime)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                      <div className="text-sm font-medium mt-1">
                        {formatCurrency(appointment.totalAmount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications" className="space-y-4">
          <CommunicationForm customerId={record.customerId} onSuccess={onUpdate} />
          <Card>
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communications.map((comm) => (
                  <div key={comm.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium capitalize">{comm.type}</span>
                        <Badge variant={getStatusColor(comm.status)} size="sm">
                          {comm.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(comm.createdAt)}
                        </span>
                      </div>
                      {comm.subject && (
                        <div className="font-medium text-gray-900 mb-1">{comm.subject}</div>
                      )}
                      {comm.notes && (
                        <div className="text-gray-600">{comm.notes}</div>
                      )}
                      {comm.metadata && Object.keys(comm.metadata).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {Object.entries(comm.metadata).map(([key, value]) => (
                            <span key={key} className="mr-4">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <ActionForm customerId={record.customerId} onSuccess={onUpdate} />
          <Card>
            <CardHeader>
              <CardTitle>Action History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actions.map((action) => (
                  <div key={action.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{action.title}</span>
                        <Badge variant={getStatusColor(action.status)} size="sm">
                          {action.status}
                        </Badge>
                        <Badge variant={getPriorityColor(action.priority)} size="sm">
                          {action.priority}
                        </Badge>
                      </div>
                      {action.description && (
                        <div className="text-gray-600 mb-2">{action.description}</div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Created: {formatDate(action.createdAt)}</span>
                        {action.dueDate && (
                          <span>Due: {formatDate(action.dueDate)}</span>
                        )}
                        {action.completedAt && (
                          <span>Completed: {formatDate(action.completedAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Affiliations Tab */}
        <TabsContent value="affiliations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Clinic Affiliations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Clinic Affiliations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {affiliations.clinics.map((clinic) => (
                    <div key={clinic.clinicId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{clinic.clinicName}</div>
                        <div className="text-sm text-gray-600">
                          {clinic.visitCount} visits • Last: {formatDate(clinic.lastVisit)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Total spent: {formatCurrency(clinic.totalSpent)}
                        </div>
                      </div>
                      <div className="text-right">
                        {clinic.isActive && (
                          <Badge variant="success" size="sm">Active</Badge>
                        )}
                        {affiliations.preferredClinic?.clinicId === clinic.clinicId && (
                          <div className="text-xs text-blue-600 mt-1">Preferred</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Doctor Affiliations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Doctor Affiliations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {affiliations.doctors.map((doctor) => (
                    <div key={doctor.doctorId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{doctor.doctorName}</div>
                        <div className="text-sm text-gray-600">
                          {doctor.clinicName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {doctor.visitCount} visits • Last: {formatDate(doctor.lastVisit)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Total spent: {formatCurrency(doctor.totalSpent)}
                        </div>
                      </div>
                      <div className="text-right">
                        {doctor.isActive && (
                          <Badge variant="success" size="sm">Active</Badge>
                        )}
                        {affiliations.preferredDoctor?.doctorId === doctor.doctorId && (
                          <div className="text-xs text-blue-600 mt-1">Preferred</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Customer Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag.tag.name}
                  </Badge>
                ))}
                {tags.length === 0 && (
                  <div className="text-gray-500">No tags assigned</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
