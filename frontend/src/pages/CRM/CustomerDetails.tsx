import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  getCustomerRecord,
  updateCustomerRecord,
  logCommunication,
  createAction,
  addCustomerTag,
  removeCustomerTag
} from "@/store/slices/crmSlice";
import { CustomerDetails as CustomerDetailsComponent } from "@/components/organisms/CustomerDetails/CustomerDetails";
import type { RootState, AppDispatch } from "@/store";
import type { CustomerSummary } from "@/types";

export const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { customerRecord, isLoading, error, customer } = useSelector(
    (state: RootState) => state.crm
  );
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (id) {
      dispatch(getCustomerRecord(id));
    }
  }, [dispatch, id]);

  const handleUpdate = () => {
    if (id) {
      dispatch(getCustomerRecord(id));
    }
  };

  const handleCall = (phone: string) => {
    // Open mobile dialer
    window.location.href = `tel:${phone}`;
    // Fire-and-forget log for analytics (click-based, not provider-based)
    if (customerRecord && user) {
      dispatch(
        logCommunication({
          customerId: customerRecord.record.customerId,
          salespersonId: user.id,
          type: "call",
          direction: "outgoing",
          status: "completed",
          subject: "Call initiated via CRM",
          notes: `Dialed ${phone} from CRM (tel: link)`,
          metadata: { clickOnly: true },
        })
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading customer: {error}</p>
      </div>
    );
  }

  if (!customerRecord) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Customer not found</p>
      </div>
    );
  }

  return (


    <CustomerDetailsComponent
      customerData={customerRecord}
      onUpdate={handleUpdate}
      onCall={handleCall}
    />
  );
};
