import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  MessageSquare,
  Send,
  User,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  FileText,
  ExternalLink
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { Select } from "@/components/atoms/Select/Select";
import { fetchCommunicationHistory } from "@/store/slices/crmSlice";
import { CommunicationForm } from "@/components/organisms/CommunicationForm/CommunicationForm";
import type { RootState, AppDispatch } from "@/store";
import type { CommunicationLog } from "@/types";
import { userAPI, crmAPI } from "@/services/api";
import { Input } from "@/components/atoms/Input/Input";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Communication: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { communications, isLoading } = useSelector((state: RootState) => state.crm);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        // Fetch both customers and leads
        const [usersRes, leadsRes] = await Promise.all([
          userAPI.getAllUsers({ role: 'client' }),
          crmAPI.getLeads()
        ]);

        const users = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.users || [];
        const leads = Array.isArray(leadsRes.data) ? leadsRes.data : leadsRes.data.leads || [];

        const userOptions = users.map((user: any) => ({
          value: user.id,
          label: `${user.firstName} ${user.lastName} (${user.email || 'No email'}) [Customer]`,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          type: 'Customer',
          status: 'Active'
        }));

        const leadOptions = leads.map((lead: any) => ({
          value: lead.id,
          label: `${lead.firstName} ${lead.lastName} (${lead.email || 'No email'}) [Lead]`,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          type: 'Lead',
          status: lead.status
        }));

        setCustomers([...userOptions, ...leadOptions]);
      } catch (err) {
        console.error("Failed to fetch contacts:", err);
      }
    };

    fetchContacts();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      // Allow any format for IDs since backend can handle it 
      // though typically they are UUIDs. 
      dispatch(fetchCommunicationHistory({ customerId: selectedCustomerId }));
      setErrorHeader(null);
    }
  }, [dispatch, selectedCustomerId]);

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const contact = customers.find(c => c.value === customerId);
    if (contact) {
      setSelectedContact(contact);
    } else if (UUID_REGEX.test(customerId)) {
      setSelectedContact({ value: customerId, firstName: 'Manual ID', lastName: '', type: 'Direct Input' });
    }
    setErrorHeader(null);
  };

  const handleCommunicationLogged = () => {
    setShowForm(false);
    if (selectedCustomerId) {
      dispatch(fetchCommunicationHistory({ customerId: selectedCustomerId }));
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Communication Center</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage and log interactions.</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          disabled={!selectedCustomerId || !selectedCustomerId.trim()}
          className="flex items-center gap-2"
        >
          {showForm ? <FileText className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          {showForm ? "View History" : "Log Communication"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar: Selection */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-bold">Select Contact</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative">
                <div className="flex gap-1.5">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="ID, Name or Email..."
                    className="flex-1 text-xs"
                  />
                  <Button
                    onClick={() => {
                      // 1. Check ID directly
                      const byId = customers.find(c => c.value === inputValue);
                      if (byId) {
                        handleCustomerSelect(byId.value);
                        setInputValue(byId.label);
                        return;
                      }

                      // 2. Exact match in name/email
                      const byLabel = customers.find(c => c.label.toLowerCase().includes(inputValue.toLowerCase()));
                      if (byLabel) {
                        handleCustomerSelect(byLabel.value);
                        setInputValue(byLabel.label);
                        return;
                      }

                      // 3. If UUID format, just let it through
                      if (UUID_REGEX.test(inputValue)) {
                        handleCustomerSelect(inputValue);
                        setErrorHeader(null);
                        return;
                      }

                      setErrorHeader("Contact not found.");
                    }}
                    disabled={!inputValue}
                    className="px-3"
                  >
                    Find
                  </Button>
                </div>
              </div>
              {errorHeader && (
                <p className="text-red-500 text-[10px] mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errorHeader}
                </p>
              )}

              {selectedContact && (
                <div className="mt-4 border-t border-gray-100 pt-4 animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {selectedContact.firstName?.[0]}{selectedContact.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-gray-900 truncate">
                        {selectedContact.firstName} {selectedContact.lastName}
                      </h3>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedContact.type === 'Lead' ? 'bg-amber-400' : 'bg-green-400'}`}></span>
                        {selectedContact.type} • {selectedContact.status || 'Active'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                    {selectedContact.email && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-400 font-medium">Email</span>
                        <span className="text-gray-700 font-bold truncate max-w-[140px]">{selectedContact.email}</span>
                      </div>
                    )}
                    {selectedContact.phone && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-400 font-medium">Phone</span>
                        <span className="text-gray-700 font-bold">{selectedContact.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-400 font-medium">ID</span>
                      <span className="text-gray-400 font-mono text-[9px] truncate max-w-[100px]">{selectedContact.value}</span>
                    </div>
                  </div>

                  <Link
                    to={selectedContact.type === 'Customer' ? `/crm/customer/${selectedContact.value}` : '/crm/leads'}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-[10px] rounded-lg border border-gray-100 transition-all no-underline"
                  >
                    View Full Profile
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {!selectedContact && (
                <div className="mt-4 bg-primary/5 p-3 rounded-xl border border-primary/10 text-xs text-primary/80">
                  <p className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                    Select a contact to view history or log new interactions.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {showForm && selectedCustomerId ? (
            <Card className="border-none shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CardHeader className="bg-primary/5 border-b border-primary/10 py-3">
                <CardTitle className="text-sm font-bold text-primary">Log New Interaction</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <CommunicationForm
                  customerId={selectedCustomerId}
                  onSuccess={handleCommunicationLogged}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-sm min-h-[400px]">
              <CardHeader className="border-b border-gray-100 py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    Interaction History
                  </CardTitle>
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {communications.length} Records
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-3"></div>
                    <p className="text-xs">Loading history...</p>
                  </div>
                ) : communications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-xs">No communication history found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {communications.map((comm: CommunicationLog) => (
                      <div
                        key={comm.id}
                        className="group flex items-center gap-3 py-2 px-1 hover:bg-gray-50/50 transition-colors"
                      >
                        <div className={`p-1.5 rounded-md shrink-0 ${comm.type === 'call' ? 'bg-green-50 text-green-600' :
                          comm.type === 'email' ? 'bg-purple-50 text-purple-600' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                          {getIconForType(comm.type)}
                        </div>

                        <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="text-[11px] font-bold text-gray-900 capitalize truncate max-w-[150px]">
                                {comm.subject || comm.type}
                              </h4>
                              <div className="flex items-center gap-1">
                                <span className={`px-1 rounded-sm text-[8px] font-bold uppercase ${comm.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  comm.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                  {comm.status}
                                </span>
                                {comm.direction && (
                                  <span className="text-[8px] font-bold text-gray-400 bg-gray-50 px-1 rounded-sm uppercase border border-gray-100">
                                    {comm.direction}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-500 truncate group-hover:whitespace-normal group-hover:break-words transition-all">
                              {comm.notes}
                            </p>
                          </div>

                          <div className="text-[9px] text-gray-400 font-medium whitespace-nowrap text-right">
                            {new Date(comm.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
