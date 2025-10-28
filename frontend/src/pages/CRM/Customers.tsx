import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CustomerCard } from "@/components/molecules/CustomerCard";
import { fetchLeads } from "@/store/slices/crmSlice";
import type { RootState, AppDispatch } from "@/store";
import type { Lead } from "@/types";
import { createLead } from "@/store/slices/crmSlice";



export const Customers: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { leads, isLoading, error } = useSelector(
    (state: RootState) => state.crm
  );

  useEffect(() => {
    console.log("🔍 Fetching leads...");
    dispatch(fetchLeads());
  }, [dispatch]);

  console.log("📊 Customers Page State:", { leads, isLoading, error, count: leads?.length });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Customers</h2>

      {/* Debug Info */}
      <div className="mb-4 p-3 bg-yellow-100 rounded text-sm">
        <p><strong>Loading:</strong> {isLoading ? "Yes" : "No"}</p>
        <p><strong>Error:</strong> {error || "None"}</p>
        <p><strong>Leads Count:</strong> {leads?.length || 0}</p>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="size-12 border-4 border-t-blue-500 border-gray-300 rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!isLoading && !error && leads && leads.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-6 text-center">
          <p className="text-lg text-blue-800 mb-2">📝 No customers yet</p>
          <p className="text-sm text-blue-600">
            Customers will appear here when they submit forms through Facebook Lead Ads.
          </p>
        </div>
      )}

      {!isLoading && !error && leads && leads.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leads.map((lead: Lead) => (
            <CustomerCard key={lead.id} customer={lead} />
          ))}
        </div>
      )}
    </div>
  );
};
