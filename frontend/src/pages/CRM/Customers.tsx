import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CustomerCard } from "@/components/molecules/CustomerCard";
import { fetchLeads } from "@/store/slices/crmSlice";
import type { RootState, AppDispatch } from "@/store";
import type { Lead } from "@/types";

export const Customers: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { leads, isLoading, error } = useSelector(
    (state: RootState) => state.crm
  );

  useEffect(() => {
    dispatch(fetchLeads({}));
  }, [dispatch]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Customers</h2>
      {isLoading && <div className="text-center py-10">Loading customers...</div>}
      
      {!isLoading && !error && leads.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
             <p className="text-gray-500 text-lg">No customers found.</p>
             <p className="text-gray-400 text-sm">New leads and customers will appear here.</p>
        </div>
      )}

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leads.map((lead: Lead) => (
          <CustomerCard key={lead.id} customer={lead} />
        ))}
      </div>
    </div>
  );
};
