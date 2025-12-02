import { format } from "date-fns";

// NOTE: These are mock implementations to unblock the frontend.
// Replace with real API calls using axios instance from `src/services/api.ts`.

export interface CallLog {
  id: string;
  agentId: string;
  agentName: string;
  customerName: string;
  customerPhone: string;
  clinicName?: string;
  outcome: "answered" | "no_answer" | "voicemail" | "busy" | "scheduled";
  durationSec?: number;
  timestamp: string;
}

export interface AgentEmail {
  agentId: string;
  agentName: string;
  email: string;
}

export interface AgentFormStats {
  agentId: string;
  agentName: string;
  formsReceived: number;
}

export interface AgentCommunicationStats {
  agentId: string;
  agentName: string;
  totalContacts: number;
  realCommunications: number; // excludes no_answer
}

export interface AgentAppointmentStats {
  agentId: string;
  agentName: string;
  booked: number;
  attended: number;
  treatmentsCompleted: number;
  cancelled: number;
  noShows: number;
}

export interface AgentCashflow {
  agentId: string;
  agentName: string;
  revenue: number;
  refunds: number;
  net: number;
}

export interface ServicePerformance {
  serviceId: string;
  serviceName: string;
  totalAppointments: number;
  totalRevenue: number;
  cancellations: number;
}

export interface AdvertisementStat {
  adId: string;
  channel: string;
  campaignName: string;
  spent: number;
  patientsCame: number;
  cancelled: number;
  totalRevenue: number;
  agentBudgetOwner?: string;
}

export interface AccessMatrixRow {
  agentId: string;
  agentName: string;
  clinics: Array<{ clinicId: string; clinicName: string; hasAccess: boolean; isPrivateToOwner?: boolean }>;
}

export interface ClientBenefit {
  customerId: string;
  customerName: string;
  clinicName: string;
  discount?: string;
  gift?: string;
  membership?: "Gold" | "Silver" | "Bronze" | null;
  lastUpdated: string;
}

export interface NoShowAlert {
  appointmentId: string;
  patientName: string;
  agentName: string;
  clinicName: string;
  date: string;
  daysAgo: number;
  actionRecommended: string;
}

export interface ClinicReturnRate {
  clinicId: string;
  clinicName: string;
  returnRate: number; // 0-1
  last30Days: number;
  last90Days: number;
}

export const fetchCallLogs = async (): Promise<CallLog[]> => {
  const now = new Date();
  return [
    {
      id: "c1",
      agentId: "a1",
      agentName: "Alice",
      customerName: "John Doe",
      customerPhone: "+1 555-1234",
      clinicName: "Downtown Clinic",
      outcome: "answered",
      durationSec: 284,
      timestamp: format(now, "yyyy-MM-dd HH:mm:ss"),
    },
    {
      id: "c2",
      agentId: "a2",
      agentName: "Bob",
      customerName: "Mary Sue",
      customerPhone: "+1 555-9876",
      clinicName: "Westside Clinic",
      outcome: "no_answer",
      timestamp: format(new Date(now.getTime() - 86400000), "yyyy-MM-dd HH:mm:ss"),
    },
  ];
};

export const initiateCall = async (phone: string): Promise<{ ok: boolean; providerHint: string }> => {
  // Placeholder: integrate Twilio/Plivo/Vonage later
  return {
    ok: false,
    providerHint: "Integrate a telephony provider (Twilio/Plivo/Vonage) via backend to place calls from the CRM UI.",
  };
};

export const fetchAgentEmails = async (): Promise<AgentEmail[]> => [
  { agentId: "a1", agentName: "Alice", email: "alice@cliniccrm.test" },
  { agentId: "a2", agentName: "Bob", email: "bob@cliniccrm.test" },
  { agentId: "a3", agentName: "Carol", email: "carol@cliniccrm.test" },
];

export const fetchAgentFormStats = async (): Promise<AgentFormStats[]> => [
  { agentId: "a1", agentName: "Alice", formsReceived: 42 },
  { agentId: "a2", agentName: "Bob", formsReceived: 35 },
  { agentId: "a3", agentName: "Carol", formsReceived: 28 },
];

export const fetchAgentCommunicationStats = async (): Promise<AgentCommunicationStats[]> => [
  { agentId: "a1", agentName: "Alice", totalContacts: 120, realCommunications: 88 },
  { agentId: "a2", agentName: "Bob", totalContacts: 95, realCommunications: 61 },
  { agentId: "a3", agentName: "Carol", totalContacts: 77, realCommunications: 49 },
];

export const fetchAgentAppointmentStats = async (): Promise<AgentAppointmentStats[]> => [
  { agentId: "a1", agentName: "Alice", booked: 40, attended: 31, treatmentsCompleted: 25, cancelled: 6, noShows: 3 },
  { agentId: "a2", agentName: "Bob", booked: 32, attended: 24, treatmentsCompleted: 18, cancelled: 5, noShows: 3 },
  { agentId: "a3", agentName: "Carol", booked: 27, attended: 20, treatmentsCompleted: 15, cancelled: 4, noShows: 3 },
];

export const fetchAgentCashflow = async (): Promise<AgentCashflow[]> => [
  { agentId: "a1", agentName: "Alice", revenue: 42000, refunds: 1200, net: 40800 },
  { agentId: "a2", agentName: "Bob", revenue: 35500, refunds: 1800, net: 33700 },
  { agentId: "a3", agentName: "Carol", revenue: 29800, refunds: 900, net: 28900 },
];

export const fetchServicePerformance = async (): Promise<ServicePerformance[]> => [
  { serviceId: "s1", serviceName: "Botox", totalAppointments: 110, totalRevenue: 55000, cancellations: 9 },
  { serviceId: "s2", serviceName: "Dermal Fillers", totalAppointments: 85, totalRevenue: 51000, cancellations: 6 },
  { serviceId: "s3", serviceName: "Laser Hair Removal", totalAppointments: 62, totalRevenue: 24800, cancellations: 7 },
];

export const fetchAdvertisementStats = async (): Promise<AdvertisementStat[]> => [
  { adId: "ad1", channel: "Google Ads", campaignName: "Botox Q4", spent: 5000, patientsCame: 40, cancelled: 5, totalRevenue: 28000, agentBudgetOwner: "Alice" },
  { adId: "ad2", channel: "Meta Ads", campaignName: "Fillers Black Friday", spent: 3000, patientsCame: 28, cancelled: 3, totalRevenue: 21000, agentBudgetOwner: "Bob" },
  { adId: "ad3", channel: "Referrals", campaignName: "VIP Program", spent: 1200, patientsCame: 18, cancelled: 1, totalRevenue: 15000, agentBudgetOwner: "Carol" },
];

export const fetchAccessMatrix = async (): Promise<AccessMatrixRow[]> => [
  {
    agentId: "a1",
    agentName: "Alice",
    clinics: [
      { clinicId: "c1", clinicName: "Downtown Clinic", hasAccess: true },
      { clinicId: "c2", clinicName: "Westside Clinic", hasAccess: false, isPrivateToOwner: true },
    ],
  },
  {
    agentId: "a2",
    agentName: "Bob",
    clinics: [
      { clinicId: "c1", clinicName: "Downtown Clinic", hasAccess: true },
      { clinicId: "c2", clinicName: "Westside Clinic", hasAccess: true },
    ],
  },
];

export const fetchClientBenefits = async (): Promise<ClientBenefit[]> => [
  { customerId: "u1", customerName: "John Doe", clinicName: "Downtown Clinic", discount: "10% off", membership: "Gold", lastUpdated: format(new Date(), "yyyy-MM-dd") },
  { customerId: "u2", customerName: "Mary Sue", clinicName: "Westside Clinic", gift: "$20 voucher", membership: null, lastUpdated: format(new Date(), "yyyy-MM-dd") },
];

export const fetchNoShowAlerts = async (): Promise<NoShowAlert[]> => [
  { appointmentId: "ap1", patientName: "John Doe", agentName: "Alice", clinicName: "Downtown Clinic", date: format(new Date(Date.now() - 2*86400000), "yyyy-MM-dd"), daysAgo: 2, actionRecommended: "Call patient again" },
  { appointmentId: "ap2", patientName: "Mary Sue", agentName: "Bob", clinicName: "Westside Clinic", date: format(new Date(Date.now() - 1*86400000), "yyyy-MM-dd"), daysAgo: 1, actionRecommended: "SMS follow-up" },
];

export const fetchClinicReturnRates = async (): Promise<ClinicReturnRate[]> => [
  { clinicId: "c1", clinicName: "Downtown Clinic", returnRate: 0.42, last30Days: 17, last90Days: 49 },
  { clinicId: "c2", clinicName: "Westside Clinic", returnRate: 0.36, last30Days: 14, last90Days: 41 },
];
