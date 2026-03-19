import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { OneCustomerDetail } from "./OneCustomerDetail";
import type { RootState } from "@/store";

export const CustomerDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { isLoading, error, leads } = useSelector(
        (state: RootState) => state.crm
    );

    // Try to find the lead in the store if we already fetched them in CRM dashboard
    const existingLead = leads.find(l => l.id === id);

    return (
        <div className="p-4 md:p-8">
            <OneCustomerDetail 
                customerId={id} 
                SelectedCustomer={existingLead}
                isLoading={isLoading}
                error={error}
            />
        </div>
    );
};
