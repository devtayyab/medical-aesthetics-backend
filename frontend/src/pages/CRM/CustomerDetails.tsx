import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { TagSelector } from "@/components/molecules/TagSelector";
import { ActionLog } from "@/components/organisms/ActionLog";
import { fetchLead, updateLead, logAction } from "@/store/slices/crmSlice";
import type { RootState, AppDispatch } from "@/store";
import type { Lead } from "@/types";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";

export const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedLead, actions, isLoading, error } = useSelector(
    (state: RootState) => state.crm
  );
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (id) {
      dispatch(fetchLead(id));
    }
  }, [dispatch, id]);

  const handleAddTag = (tag: string) => {
    if (selectedLead) {
      dispatch(
        updateLead({
          id: selectedLead.id,
          updates: { tags: [...(selectedLead.tags || []), tag] },
        })
      );
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (selectedLead) {
      dispatch(
        updateLead({
          id: selectedLead.id,
          updates: { tags: selectedLead.tags?.filter((t) => t !== tag) },
        })
      );
    }
  };

  const handleLogAction = () => {
    if (selectedLead && notes) {
      dispatch(logAction({ customerId: selectedLead.id, type: "note", notes }));
      setNotes("");
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Customer Details</h2>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {selectedLead && (
        <div className="flex flex-col gap-4">
          <p>Name: {selectedLead.name}</p>
          <p>Email: {selectedLead.email}</p>
          <p>Phone: {selectedLead.phone || "N/A"}</p>
          <p>Status: {selectedLead.status}</p>
          <TagSelector
            tags={selectedLead.tags || []}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
          <div>
            <h3 className="text-lg font-semibold">Log Action</h3>
            <Input
              placeholder="Add note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
            />
            <Button onClick={handleLogAction}>Log Note</Button>
          </div>
          <ActionLog actions={actions} />
        </div>
      )}
    </>
  );
};
