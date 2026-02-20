import { User } from ".";

export interface Lead {
  id: string;
  source: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  facebookLeadId?: string;
  facebookFormId?: string;
  facebookCampaignId?: string;
  facebookAdSetId?: string;
  facebookAdId?: string;
  facebookLeadData?: any;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedSalespersonId?: string;
  assignedSalesperson: {
    id: string;
    firstName: string;
    lastName: string;
    role?: string;
    email: string;
    phone: string;
    createdAt: string;
    updatedAt: string;
  };
  tags?: string[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
  convertedAt?: string;
}

export interface CustomerRecord {
  id: string;
  customerId: string;
  assignedSalespersonId?: string;
  totalAppointments: number;
  completedAppointments: number;
  lifetimeValue: number;
  lastAppointmentDate?: string;
  nextAppointmentDate?: string;
  lastContactDate?: string;
  isRepeatCustomer: boolean;
  repeatCount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer?: User;
  assignedSalesperson?: User;
}

export interface CommunicationLog {
  id: string;
  customerId: string;
  salespersonId?: string;
  type: 'call' | 'email' | 'sms' | 'form_submission' | 'meeting' | 'note';
  direction: 'incoming' | 'outgoing';
  status: 'completed' | 'missed' | 'pending';
  subject?: string;
  notes?: string;
  durationSeconds?: number;
  metadata?: {
    clinic?: string;
    proposedTreatment?: string;
    cost?: number;
    callOutcome?: string;
    facebookLeadId?: string;
    facebookFormId?: string;
    leadData?: any;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
  salesperson?: User;
}

export interface CrmAction {
  id: string;
  customerId: string;
  salespersonId: string;
  actionType: 'phone_call' | 'email' | 'follow_up' | 'appointment_confirmation' | 'treatment_reminder' | 'meeting';
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  completedAt?: string;
  relatedAppointmentId?: string;
  relatedLeadId?: string;
  metadata?: {
    clinic?: string;
    proposedTreatment?: string;
    cost?: number;
    callOutcome?: string;
    appointmentId?: string;
    automationRule?: string;
    createdBy?: string;
    source?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
  customer?: User;
  salesperson?: User;
}

export interface CustomerTag {
  id: string;
  customerId: string;
  tagId: string;
  addedBy: string;
  notes?: string;
  createdAt: string;
  tag?: Tag;
  addedByUser?: User;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  category: 'status' | 'source' | 'interest' | 'behavior' | 'custom';
  isActive: boolean;
}

export interface ClinicAffiliation {
  clinicId: string;
  clinicName: string;
  doctorId?: string;
  doctorName?: string;
  visitCount: number;
  lastVisit: string;
  isActive: boolean;
  totalSpent: number;
}

export interface DoctorAffiliation {
  doctorId: string;
  doctorName: string;
  clinicId: string;
  clinicName: string;
  visitCount: number;
  lastVisit: string;
  isActive: boolean;
  totalSpent: number;
}

export interface CustomerAffiliations {
  clinics: ClinicAffiliation[];
  doctors: DoctorAffiliation[];
  preferredClinic?: {
    clinicId: string;
    clinicName: string;
    visitCount: number;
  };
  preferredDoctor?: {
    doctorId: string;
    doctorName: string;
    clinicName: string;
    visitCount: number;
  };
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedSalespersonId?: string;
  assignedSales?: {
    id: string;
    firstName: string;
    lastName: string;
    role?: string;
    email: string;
    phone: string;
    createdAt: string;
    updatedAt: string;
  };
  isRepeatCustomer: boolean;
  createdAt: string;
  updatedAt: string;
  source: string;
  summary: {
    totalAppointments: number;
    completedAppointments: number;
    lifetimeValue: number;
    repeatCount: number;
  };
}


export interface CustomerSummary {
  record: CustomerRecord;
  appointments: Array<{
    id: string;
    serviceName?: string;
    clinicName?: string;
    startTime: string;
    status: string;
    totalAmount: number;
    treatmentDetails?: any;
  }>;
  communications: CommunicationLog[];
  actions: CrmAction[];
  tags: Array<{
    id: string;
    tag: Tag;
    addedBy: User;
    notes?: string;
    createdAt: string;
  }>;
  affiliations: CustomerAffiliations;
  summary: {
    totalAppointments: number;
    completedAppointments: number;
    lifetimeValue: number;
    lastAppointment?: string;
    nextAppointment?: string;
    isRepeatCustomer: boolean;
    repeatCount: number;
    preferredClinic?: string;
    preferredDoctor?: string;
  };
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidence: number;
  existingCustomer?: User;
  suggestions: Array<{
    customer: User;
    confidence: number;
    matchReason: string;
  }>;
}

export interface TaskAutomationRule {
  id: string;
  name: string;
  trigger: 'appointment_scheduled' | 'appointment_completed' | 'no_communication' | 'treatment_reminder';
  delayDays: number;
  actionType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  template: string;
  conditions?: any;
}

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
}

export interface RequiredFields {
  clinic: boolean;
  proposedTreatment: boolean;
  cost: boolean;
  callOutcome: boolean;
  notes?: boolean;
}

export interface FacebookLeadData {
  id: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
  created_time: string;
  ad_id?: string;
  adset_id?: string;
  campaign_id?: string;
  form_id?: string;
}

export interface ParsedFacebookLead {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  facebookLeadId: string;
  facebookFormId?: string;
  facebookCampaignId?: string;
  facebookAdSetId?: string;
  facebookAdId?: string;
  facebookLeadData: any;
}

export interface CrmFilters {
  status?: string;
  assignedSalesId?: string;
  source?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  priority?: string;
}

export interface CrmAnalytics {
  // CRM Metrics
  totalLeads?: number;
  convertedLeads?: number;
  conversionRate?: number;
  totalActions?: number;
  completedActions?: number;

  // Salesperson Performance
  leadsAssigned?: number;
  leadsContacted?: number;
  salespersonConversionRate?: number;
  averageResponseTime?: string;
  tasksCompleted?: number;

  communicationStats?: {
    total: number;
    calls: number;
    answeredCalls: number;
    missedCalls: number;
    emails: number;
    totalDurationSeconds: number;
    avgDurationMinutes: number | string;
  };
  actionStats?: {
    total: number;
    pending: number;
    completed: number;
    missed: number;
  };
  customerStats?: {
    totalCustomers: number;
    repeatCustomers: number;
    totalRevenue: number;
  };
}
