import React, { useEffect, useState, useCallback, useMemo } from"react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card";
import { DataTable } from"@/components/ui/DataTable";
import { Button } from"@/components/atoms/Button/Button";
import {
 Gift,
 Star,
 BadgePercent,
 RefreshCcw,
 TrendingUp,
 UserCheck,
 Building2,
 Calendar,
} from"lucide-react";
import { fetchClientBenefits, ClientBenefit } from"@/services/managerCrm.service";
import { cn } from"@/lib/utils";

export const Benefits: React.FC = () => {
 const [rows, setRows] = useState<ClientBenefit[]>([]);
 const [loading, setLoading] = useState(true);
 const [isRefreshing, setIsRefreshing] = useState(false);

 const loadData = useCallback(async (isRefresh = false) => {
 if (isRefresh) setIsRefreshing(true);
 else setLoading(true);
 try {
 const data = await fetchClientBenefits();
 setRows(data);
 } catch (error) {
 console.error("Failed to fetch client benefits:", error);
 } finally {
 setLoading(false);
 setIsRefreshing(false);
 }
 }, []);

 useEffect(() => { loadData(); }, [loadData]);

 // ── Helpers (stable — not recreated per render) ──────────────────────────
 const parseDiscountValue = useCallback((discount?: string | null): number => {
 if (!discount) return 0;
 const match = discount.match(/(\d+(\.\d+)?)/);
 return match ? parseFloat(match[1]) : 0;
 }, []);

 // ── Dynamic Stats (recalculate only when rows change) ────────────────────
 const activeMemberships = useMemo(
 () => rows.filter(r => r.membership).length,
 [rows]
 );

 const discountedRows = useMemo(
 () => rows.filter(r => r.discount && parseDiscountValue(r.discount) > 0),
 [rows, parseDiscountValue]
 );

 const avgDiscount = useMemo(() => {
 if (discountedRows.length === 0) return"0%";
 const total = discountedRows.reduce((sum, r) => sum + parseDiscountValue(r.discount), 0);
 return (total / discountedRows.length).toFixed(0) +"%";
 }, [discountedRows, parseDiscountValue]);

 const pendingGifts = useMemo(
 () => rows.filter(r => r.gift && r.gift !=="None" && r.gift !=="null").length,
 [rows]
 );

 // ── Table Columns ────────────────────────────────────────────────────────
 const columns = [
 {
 accessorKey:"customerName",
 header:"Customer",
 cell: ({ row }: any) => (
 <div className="flex items-center gap-2">
 <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
 <UserCheck className="h-4 w-4 text-blue-600" />
 </div>
 <span className="font-bold text-gray-900">{row.original.customerName ||"—"}</span>
 </div>
 ),
 },
 {
 accessorKey:"clinicName",
 header:"Clinic",
 cell: ({ row }: any) => (
 <div className="flex items-center gap-1.5 text-xs text-gray-600">
 <Building2 className="h-3.5 w-3.5" />
 {row.original.clinicName ||"—"}
 </div>
 ),
 },
 {
 accessorKey:"discount",
 header:"Active Discount",
 cell: ({ row }: any) => {
 const discount = row.original.discount;
 const hasDiscount = discount && parseDiscountValue(discount) > 0;
 return (
 <div className="flex items-center gap-1.5">
 <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
 hasDiscount ?"bg-emerald-100 text-emerald-700" :"bg-gray-100 text-gray-400"
 )}>
 {hasDiscount ? `${discount} OFF` :"OFF"}
 </div>
 </div>
 );
 },
 },
 {
 accessorKey:"gift",
 header:"Gift / Reward",
 cell: ({ row }: any) => {
 const gift = row.original.gift;
 const hasGift = gift && gift !=="None" && gift !=="null";
 return (
 <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
 <Gift className={cn("h-3.5 w-3.5", hasGift ?"text-pink-500" :"text-gray-300")} />
 {hasGift ? gift : <span className="text-gray-400">None</span>}
 </div>
 );
 },
 },
 {
 accessorKey:"membership",
 header:"Membership Level",
 cell: ({ row }: any) => {
 const level = row.original.membership;
 if (!level) {
 return (
 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-50 text-gray-400 border border-gray-100">
 <Star className="h-3 w-3" /> None
 </div>
 );
 }
 const isGold = level.toLowerCase().includes("gold");
 const isSilver = level.toLowerCase().includes("silver");
 return (
 <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
 isGold ?"bg-amber-100 text-amber-700 border border-amber-200" :
 isSilver ?"bg-gray-100 text-gray-700 border border-gray-200" :"bg-[#CBFF38]/10 text-gray-800 border border-[#CBFF38]/30"
 )}>
 <Star className={cn("h-3 w-3", isGold ?"fill-amber-500" :"")} />
 {level}
 </div>
 );
 },
 },
 {
 accessorKey:"lastUpdated",
 header:"Last Updated",
 cell: ({ row }: any) => {
 const raw = row.original.lastUpdated;
 let display ="—";
 if (raw) {
 try {
 display = new Date(raw).toLocaleDateString("en-GB", {
 day:"2-digit", month:"short", year:"numeric",
 });
 } catch { /* ignore */ }
 }
 return (
 <div className="flex items-center gap-1.5 text-xs text-gray-400">
 <Calendar className="h-3.5 w-3.5" />
 {display}
 </div>
 );
 },
 },
 ];

 return (
 <div className="p-6 space-y-8 bg-gray-50/50 min-h-screen">
 {/* Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
 <Star className="h-8 w-8 text-[#CBFF38]" />
 Customer Benefits &amp; Loyalty
 </h1>
 <p className="text-muted-foreground mt-1">
 Manage active discounts, gifts, and membership tiers for your clients.
 </p>
 </div>
 <Button
 variant="outline"
 onClick={() => loadData(true)}
 disabled={loading || isRefreshing}
 className="flex items-center gap-2 bg-white"
 >
 <RefreshCcw className={cn("h-4 w-4", isRefreshing &&"animate-spin")} />
 Refresh Rewards
 </Button>
 </div>

 {/* Summary Stats */}
 <div className="grid gap-4 md:grid-cols-3">
 {/* Active Memberships */}
 <Card className="hover:shadow-md transition-shadow">
 <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider text-gray-500">
 Active Memberships
 <Star className="h-4 w-4 text-[#CBFF38]" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-gray-900">
 {loading ?"—" : activeMemberships}
 </div>
 <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 font-medium text-emerald-600">
 <TrendingUp className="h-3 w-3" /> Loyalty base growing
 </p>
 </CardContent>
 </Card>

 {/* Avg Discount — fully dynamic, no mock */}
 <Card className="hover:shadow-md transition-shadow">
 <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider text-gray-500">
 Avg. Tier Discount
 <BadgePercent className="h-4 w-4 text-emerald-500" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-gray-900">
 {loading ?"—" : avgDiscount}
 </div>
 <p className="text-[10px] text-muted-foreground mt-1 font-medium">
 {discountedRows.length > 0
 ? `Across ${discountedRows.length} client${discountedRows.length > 1 ?"s" :""}`
 :"No active discounts yet"}
 </p>
 </CardContent>
 </Card>

 {/* Pending Gifts */}
 <Card className="hover:shadow-md transition-shadow">
 <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider text-gray-500">
 Pending Gifts
 <Gift className="h-4 w-4 text-pink-500" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-gray-900">
 {loading ?"—" : pendingGifts}
 </div>
 <p className="text-[10px] text-gray-500 mt-1 font-medium">
 Unredeemed rewards available
 </p>
 </CardContent>
 </Card>
 </div>

 {/* Main Table */}
 <Card className="shadow-sm border-gray-200/60 overflow-hidden">
 <CardHeader className="bg-gray-50/50 border-b">
 <div className="flex items-center gap-2">
 <Star className="h-4 w-4 text-gray-500" />
 <CardTitle className="text-lg">Loyalty Registry</CardTitle>
 </div>
 <CardDescription>
 Detailed overview of individual client benefits and their status.
 </CardDescription>
 </CardHeader>
 <CardContent className="p-0">
 <DataTable
 columns={columns as any}
 data={rows as any}
 searchKey="customerName"
 />
 </CardContent>
 </Card>
 </div>
 );
};

export default Benefits;
