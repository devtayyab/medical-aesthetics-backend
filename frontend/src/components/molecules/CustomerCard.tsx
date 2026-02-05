import React from "react";
import { Card } from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { Link } from "react-router-dom";
import type { Lead } from "@/types";

interface CustomerCardProps {
  customer: Lead;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ customer }) => {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">{customer.firstName} {customer.lastName}</h3>
        <p className="text-gray-600">Email: {customer.email}</p>
        <p className="text-gray-600">Phone: {customer.phone || "N/A"}</p>
        <p className="text-gray-600">Status: {customer.status}</p>
        <Link to={`/crm/customer/${customer.id}`}>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </Link>
      </div>
    </Card>
  );
};
