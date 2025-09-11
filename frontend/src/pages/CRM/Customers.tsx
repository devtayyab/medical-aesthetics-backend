import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CustomerCard } from "@/components/molecules/CustomerCard";
import { fetchLeads } from "@/store/slices/crmSlice";
import type { RootState, AppDispatch } from "@/store";
import type { Lead } from "@/types";
import { Sidebar } from "@/components/organisms/Sidebar";

export const Customers: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { leads, isLoading, error } = useSelector(
    (state: RootState) => state.crm
  );

  useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);

  return (
    <div className="flex max-w-[1200px] mx-auto p-4">
      <Sidebar />
      <div className="flex-1 ml-64">
        <h2 className="text-2xl font-bold mb-4">Customers</h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leads.map((lead: Lead) => (
            <CustomerCard key={lead.id} customer={lead} />
          ))}
        </div>
      </div>
    </div>
  );
};
