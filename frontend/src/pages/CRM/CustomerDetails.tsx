import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { TagSelector } from "@/components/molecules/TagSelector";
import { ActionLog } from "@/components/organisms/ActionLog";
import type { RootState, AppDispatch } from "@/store";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";

import {
  fetchLeads, fetchCustomerRecord,
  fetchCustomerCommunications, logAction, fetchActions
} from "@/store/slices/crmSlice";

export const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedLead, actions, communications, isLoading, error } = useSelector(
    (state: RootState) => state.crm
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [actionType, setActionType] = useState("follow_up");
  const [activeTab, setActiveTab] = useState<"details" | "history" | "actions">("details");
  useEffect(() => {
    if (id) dispatch(fetchLeads());
  }, [dispatch, id]);

  const handleLogAction = () => {
    if (selectedLead && title && description) {
      dispatch(
        logAction({
          customerId: selectedLead.id,
          salespersonId: user?.id || "N/A",
          actionType,
          title,
          description,
        })
      );
      setTitle("");
      setDescription("");
    }
  };


  const handleFetchActions = () => {
    if (id) dispatch(fetchActions());
  };
  useEffect(() => {
    handleFetchActions();
  }, [dispatch]);
  useEffect(() => {
    if (id) {
      dispatch(fetchCustomerRecord(id));
      dispatch(fetchCustomerCommunications(id));
    }
  }, [dispatch, id]);


  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Customer Details</h2>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {selectedLead && (
        <div className="flex flex-col gap-6">
          {/* ---- Info Card ---- */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-lg font-semibold">{selectedLead.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-lg font-semibold">{selectedLead.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-lg font-semibold">{selectedLead.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-lg font-semibold capitalize">{selectedLead.status}</p>
              </div>
            </div>
          </div>

          {/* ---- Tabs ---- */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-4">
              {["details", "history", "actions"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`pb-2 px-4 font-medium ${activeTab === tab
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {tab === "details" && "Details & Notes"}
                  {tab === "history" && "📋 Record Submissions"}
                  {tab === "actions" && "Action Log"}
                </button>
              ))}
            </nav>
          </div>

          {/* ---- Tab Content ---- */}
          {activeTab === "details" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Log Action</h3>

              <div className="flex flex-col gap-4">
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="follow_up">Follow Up</option>
                  <option value="phone_call">Phone Call</option>
                  <option value="meeting">Meeting</option>
                  <option value="email_sent">Email Sent</option>
                  <option value="update">Update</option>
                  <option value="other">Other</option>
                </select>

                <Input
                  placeholder="Action title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                />

                <textarea
                  placeholder="Write description or notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border rounded-lg p-3 w-full h-24 resize-none text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                <Button
                  onClick={handleLogAction}
                  disabled={!title.trim() || !description.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Log Action
                </Button>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="bg-white rounded-lg shadow p-6">
              History
            </div>
          )}



          <h3 className="text-lg font-semibold mt-6 mb-4">Communications</h3>
          {communications.length ? (
            communications.map((comm) => (
              <div key={comm.id} className="p-2 border-b">
                <p>{comm.type}: {comm.title}</p>
                <p>{new Date(comm.type).toLocaleString()}</p>
                <p>{comm.description}</p>
              </div>
            ))
          ) : (
            <p>No communications found.</p>
          )}
        </div>
      )}

    </div>
  )
}


