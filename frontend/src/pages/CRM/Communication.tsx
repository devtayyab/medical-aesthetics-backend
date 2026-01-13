import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { fetchCommunicationHistory, logCommunication } from "@/store/slices/crmSlice";
import { CommunicationForm } from "@/components/organisms/CommunicationForm/CommunicationForm";
import type { RootState, AppDispatch } from "@/store";
import type { CommunicationLog } from "@/types";

export const Communication: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { communications, isLoading } = useSelector((state: RootState) => state.crm);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (selectedCustomerId) {
      dispatch(fetchCommunicationHistory({ customerId: selectedCustomerId }));
    }
  }, [dispatch, selectedCustomerId]);

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  const handleCommunicationLogged = () => {
    setShowForm(false);
    if (selectedCustomerId) {
      dispatch(fetchCommunicationHistory({ customerId: selectedCustomerId }));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Communication Management</h1>
        <Button 
          onClick={() => setShowForm(true)}
          disabled={!selectedCustomerId}
        >
          Log Communication
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Customer Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Enter Customer ID"
                value={selectedCustomerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {showForm && selectedCustomerId && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Log New Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <CommunicationForm
                  customerId={selectedCustomerId}
                  onSuccess={handleCommunicationLogged}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Loading...</div>
              ) : communications.length === 0 ? (
                <div className="text-gray-500">No communications found</div>
              ) : (
                <div className="space-y-4">
                  {communications.map((comm: CommunicationLog) => (
                    <div key={comm.id} className="border rounded p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold">{comm.type}</div>
                          <div className="text-sm text-gray-600">{comm.notes}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(comm.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          comm.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          comm.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {comm.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
