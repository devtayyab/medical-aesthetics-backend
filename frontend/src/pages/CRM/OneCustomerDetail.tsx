import React, { useEffect, useState } from "react";
import { User, Mail, Phone, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/molecules/Card/Card";
import type { Lead, Customer } from "@/types";
interface OneCustomerDetailProps {
    isLoading: boolean;
    error: string | null;
    SelectedCustomer: Customer;

}
export const OneCustomerDetail: React.FC<OneCustomerDetailProps> = ({
    isLoading = false,
    error = null,
    SelectedCustomer,
}) => {

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);


    if (!isMounted || isLoading) {
        return <div className="text-center py-12 text-gray-600">Loading customer details...</div>;
    }

    // Show error state
    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-500 mb-2">Error loading customer details</div>
                <p className="text-sm text-gray-600">{error}</p>
            </div>
        );
    }

    // Show not found state
    if (!SelectedCustomer) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-600">Customer not found</div>
            </div>
        );
    }

    // Safely access nested properties with fallbacks
    const assignedSales = SelectedCustomer.assignedSales || {};
    const email = assignedSales?.email || 'No email';
    const firstName = assignedSales?.firstName || '';
    const lastName = assignedSales?.lastName || '';
    const createdAt = assignedSales?.createdAt
        ? new Date(assignedSales.createdAt).toLocaleDateString()
        : 'N/A';

    return (
        <div className="space-y-6">
            {/* Back Button */}


            {/* Assigned Salesperson Section */}
            <Card>

                {(assignedSales && email && email !== 'No email') && <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-[1rem] font-bold">
                                    {email}
                                </h2>
                                <div className="flex items-center gap-4 text-gray-600 mt-1">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {createdAt}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Assigned to</div>
                            <div className="font-medium">
                                {firstName}{" "}
                                {lastName}
                            </div>
                        </div>
                    </div>
                </CardContent>}


                {/* Customer Details */}
                <Card className="shadow-md border border-gray-200 mt-6">
                    <CardContent className="p-6">

                        <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-200 rounded-lg">
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    <tr>
                                        <td className="font-semibold px-4 py-2 bg-gray-50 w-40">
                                            Name
                                        </td>
                                        <td className="px-4 py-2 capitalize">
                                            {SelectedCustomer.firstName} {SelectedCustomer.lastName}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold px-4 py-2 bg-gray-50">Email</td>
                                        <td className="px-4 py-2 flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-gray-500" />
                                            {SelectedCustomer.email}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold px-4 py-2 bg-gray-50">Phone</td>
                                        <td className="px-4 py-2 flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-500" />
                                            {SelectedCustomer.phone || "No phone"}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold px-4 py-2 bg-gray-50">Status</td>
                                        <td className="px-4 py-2">
                                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                                {SelectedCustomer.status}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold px-4 py-2 bg-gray-50">Source</td>
                                        <td className="px-4 py-2">{SelectedCustomer.source}</td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold px-4 py-2 bg-gray-50">
                                            Created At
                                        </td>
                                        <td className="px-4 py-2">
                                            {new Date(
                                                SelectedCustomer.createdAt
                                            ).toLocaleDateString()}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </Card>
        </div>
    );

};
