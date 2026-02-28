import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLeads } from "@/store/slices/crmSlice";
import type { RootState, AppDispatch } from "@/store";
import type { Lead } from "@/types";
import { Search, Filter, X, ArrowRight, ArrowLeft, User, Tag, MessageSquare, Mail, Phone, Archive } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { OneCustomerDetail } from "@/pages/CRM/OneCustomerDetail";
import { Button } from "@/components/atoms/Button/Button";
import { Card } from "@/components/molecules/Card/Card";

export const ArchivedLeads: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { leads, isLoading, error } = useSelector(
        (state: RootState) => state.crm
    );

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<Lead | null>(null);

    // Fetch archived leads on mount
    useEffect(() => {
        const appliedFilters: any = {
            status: ['lost'] // Archive = Lost in our flow
        };
        if (searchTerm.trim()) appliedFilters.search = searchTerm.trim();

        dispatch(fetchLeads(appliedFilters));
    }, [dispatch, searchTerm]);

    if (selectedCustomer) {
        return (
            <div className="p-6 h-full flex flex-col relative space-y-6">
                <Card className="border-none shadow-sm pb-6">
                    <div className="px-8 pt-6 border-b pb-4 mb-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">
                                Archived Lead Details
                            </h2>
                            <Button variant="outline" onClick={() => setSelectedCustomer(null)} className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" /> Back to Archive
                            </Button>
                        </div>
                    </div>
                    <OneCustomerDetail
                        SelectedCustomer={selectedCustomer as any}
                        isLoading={isLoading}
                        error={error}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 h-full flex flex-col relative animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-50 rounded-xl">
                        <Archive className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Archived & Lost Leads</h2>
                        <p className="text-sm text-gray-500 font-medium">View and manage contacts marked as lost or inactive</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search archived leads..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm("")}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
                    >
                        Clear Search
                    </button>
                )}
            </div>

            {isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Archive...</p>
                </div>
            )}

            {!isLoading && !error && leads.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm flex-1 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                        <Archive className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-lg font-bold">The archive is empty.</p>
                    <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto font-medium">Leads that are marked as 'Not Interested' or manually lost will appear here.</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl mb-6 border border-red-100 flex items-center gap-3">
                    <X className="w-6 h-6" />
                    <div>
                        <p className="font-bold">Error loading archive</p>
                        <p className="text-sm opacity-80">{error}</p>
                    </div>
                </div>
            )}

            {/* List View with DataTable */}
            {!isLoading && leads.length > 0 && (
                <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
                    <DataTable
                        columns={[
                            {
                                accessorKey: "name",
                                header: "Customer Name",
                                cell: ({ row }: any) => (
                                    <div className="flex items-center gap-3 py-1">
                                        <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm border border-red-100">
                                            {row.original.firstName[0]}{row.original.lastName[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 leading-none mb-1">
                                                {row.original.firstName} {row.original.lastName}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{row.original.source || 'Manual Entry'}</div>
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                accessorKey: "email",
                                header: "Contact Details",
                                cell: ({ row }: any) => (
                                    <div className="space-y-1">
                                        <div className="text-sm text-gray-600 font-medium flex items-center gap-2">
                                            <Mail className="w-3 h-3 text-gray-400" /> {row.original.email}
                                        </div>
                                        <div className="text-xs text-gray-400 flex items-center gap-2">
                                            <Phone className="w-3 h-3" /> {row.original.phone || "No phone recorded"}
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                accessorKey: "lastContactedAt",
                                header: "Last Activity",
                                cell: ({ row }: any) => (
                                    <div className="text-sm text-gray-600 flex items-center gap-2 font-medium">
                                        <MessageSquare className="w-4 h-4 text-emerald-500" />
                                        {row.original.lastContactedAt ? new Date(row.original.lastContactedAt).toLocaleDateString() : "Never contacted"}
                                    </div>
                                ),
                            },
                            {
                                accessorKey: "status",
                                header: "Status",
                                cell: ({ row }: any) => (
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-700 border border-red-200 shadow-sm`}>
                                            {row.original.status}
                                        </span>
                                    </div>
                                ),
                            },
                            {
                                id: "actions",
                                header: "",
                                cell: ({ row }: any) => (
                                    <div className="flex justify-end pr-6">
                                        <Button
                                            onClick={() => setSelectedCustomer(row.original)}
                                            variant="ghost"
                                            className="h-10 px-4 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-100 rounded-xl font-bold text-xs transition-all flex items-center gap-2"
                                        >
                                            View Profile <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ),
                            },
                        ]}
                        data={leads}
                        searchKey="email"
                    />
                </div>
            )}
        </div>
    );
};
