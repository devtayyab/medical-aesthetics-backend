import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MessageSquare,
  Send,
  User,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  FileText
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { Select } from "@/components/atoms/Select/Select";
import { fetchCommunicationHistory } from "@/store/slices/crmSlice";
import { CommunicationForm } from "@/components/organisms/CommunicationForm/CommunicationForm";
import type { RootState, AppDispatch } from "@/store";
import type { CommunicationLog } from "@/types";
import { userAPI } from "@/services/api";
import { Input } from "@/components/atoms/Input/Input";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Communication: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { communications, isLoading } = useSelector((state: RootState) => state.crm);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [customers, setCustomers] = useState<{ value: string; label: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await userAPI.getAllUsers({ role: 'client' });
        const users = Array.isArray(response.data) ? response.data : response.data.users || [];

        const customerOptions = users.map((user: any) => ({
          value: user.id,
          label: `${user.firstName} ${user.lastName} (${user.email || 'No email'})`,
        }));
        setCustomers(customerOptions);
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      if (UUID_REGEX.test(selectedCustomerId)) {
        dispatch(fetchCommunicationHistory({ customerId: selectedCustomerId }));
        setErrorHeader(null);
      }
    }
  }, [dispatch, selectedCustomerId]);

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setErrorHeader(null);
  };

  const handleCommunicationLogged = () => {
    setShowForm(false);
    if (selectedCustomerId && UUID_REGEX.test(selectedCustomerId)) {
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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Communication Center</h1>
          <p className="text-gray-500 mt-1">Manage and log customer interactions.</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          disabled={!selectedCustomerId || !UUID_REGEX.test(selectedCustomerId)}
          className="flex items-center gap-2"
        >
          {showForm ? <FileText className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          {showForm ? "View History" : "Log Communication"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar: Selection */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Select Customer</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter Customer Email..."
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      // Find customer by email from the fetched list
                      const customer = customers.find(c => c.label.toLowerCase().includes(inputValue.toLowerCase()));
                      if (customer) {
                        handleCustomerSelect(customer.value);
                        setInputValue(customer.label); // Show full label on select
                      } else {
                        // If checking backend is needed, we'd add that logic here. 
                        // For now we match against the loaded list.
                        setErrorHeader("Customer not found in list");
                      }
                    }}
                    disabled={!inputValue}
                  >
                    Find
                  </Button>
                </div>
              </div>
              {errorHeader && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errorHeader}
                </p>
              )}
              <div className="mt-4 bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
                <p className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  Select a customer to view history or log new interactions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {showForm && selectedCustomerId && UUID_REGEX.test(selectedCustomerId) ? (
            <Card className="border-none shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="bg-blue-50 border-b border-blue-100">
                <CardTitle className="text-blue-900">Log New Interaction</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <CommunicationForm
                  customerId={selectedCustomerId}
                  onSuccess={handleCommunicationLogged}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-md min-h-[500px]">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    Interaction History
                  </CardTitle>
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {communications.length} Records
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <p>Loading history...</p>
                  </div>
                ) : communications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                    <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                    <p>No communication history found</p>
                    {selectedCustomerId && !UUID_REGEX.test(selectedCustomerId) && (
                      <p className="text-xs text-red-400 mt-2">Invalid ID format</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {communications.map((comm: CommunicationLog) => (
                      <div
                        key={comm.id}
                        className="group flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all"
                      >
                        <div className={`p-3 rounded-full h-fit shrink-0 ${comm.type === 'call' ? 'bg-green-100 text-green-600' :
                          comm.type === 'email' ? 'bg-purple-100 text-purple-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                          {getIconForType(comm.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-semibold text-gray-900 capitalize truncate">
                              {comm.subject || comm.type}
                            </h4>
                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(comm.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                            {comm.notes}
                          </p>

                          <div className="mt-3 flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${comm.status === 'completed' ? 'bg-green-100 text-green-700' :
                              comm.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                              {comm.status}
                            </span>
                            {comm.direction && (
                              <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full uppercase border border-gray-100">
                                {comm.direction}
                              </span>
                            )}
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
