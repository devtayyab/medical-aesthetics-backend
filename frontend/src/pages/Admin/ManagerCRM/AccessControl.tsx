import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/atoms/Button/Button";
import {
  ShieldCheck,
  Lock,
  UserCheck,
  Building2,
  RefreshCcw,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  EyeOff,
  Search,
  Check
} from "lucide-react";
import { fetchAccessMatrix, updateAgentAccess, AccessMatrixRow } from "@/services/managerCrm.service";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

export const AccessControl: React.FC = () => {
  const [rows, setRows] = useState<AccessMatrixRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingRowId, setUpdatingRowId] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchAccessMatrix();
      setRows(data);
    } catch (error) {
      console.error("Failed to fetch access matrix:", error);
      toast.error("Failed to sync access registry");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleAccess = async (agentId: string, clinicId: string, currentHasAccess: boolean) => {
    // Optimistic update
    const previousRows = [...rows];
    const newRows = rows.map(row => {
      if (row.agentId === agentId) {
        return {
          ...row,
          clinics: row.clinics.map(clinic => {
            if (clinic.clinicId === clinicId) {
              return { ...clinic, hasAccess: !currentHasAccess };
            }
            return clinic;
          })
        };
      }
      return row;
    });

    setRows(newRows);
    setUpdatingRowId(`${agentId}-${clinicId}`);

    try {
      const targetAgent = newRows.find(r => r.agentId === agentId);
      if (!targetAgent) return;

      const clinicAccessPayload = targetAgent.clinics.map(c => ({
        clinicId: c.clinicId,
        hasAccess: c.hasAccess
      }));

      await updateAgentAccess(agentId, clinicAccessPayload);
      toast.success("Permissions updated successfully", {
        icon: <ShieldCheck className="h-4 w-4 text-emerald-600" />,
        style: {
          borderRadius: '1.25rem',
          background: '#F0FDF4',
          color: '#166534',
          fontWeight: '900',
          fontSize: '0.8rem',
          border: '1px solid #BBF7D0'
        }
      });
    } catch (error) {
      console.error("Failed to update access:", error);
      setRows(previousRows); // Revert
      toast.error("Security sync failed. Check connectivity.");
    } finally {
      setUpdatingRowId(null);
    }
  };

  const columns = [
    {
      accessorKey: "agentName",
      header: "Agent",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100/50">
            <UserCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-slate-800 text-sm tracking-tight">{row.original.agentName}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorized Agent</span>
          </div>
        </div>
      )
    },
    {
      id: "clinics",
      header: "Clinics Access Permissions",
      cell: ({ row }: any) => (
        <div className="flex flex-wrap gap-2 py-2">
          {row.original.clinics.map((c: any) => {
            const isIndividualLoading = updatingRowId === `${row.original.agentId}-${c.clinicId}`;
            return (
              <button
                key={c.clinicId}
                disabled={!!updatingRowId}
                onClick={() => handleToggleAccess(row.original.agentId, c.clinicId, c.hasAccess)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-2xl border text-[11px] font-black tracking-tight transition-all active:scale-95 group",
                  c.hasAccess
                    ? "bg-emerald-50/80 border-emerald-100 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-200 shadow-sm shadow-emerald-500/5"
                    : "bg-white border-slate-100 text-slate-400 opacity-60 hover:opacity-100 hover:border-slate-300"
                )}
              >
                {isIndividualLoading ? (
                  <RefreshCcw className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                ) : c.hasAccess ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-slate-200" />
                )}
                <span className="uppercase">{c.clinicName}</span>
                {c.isPrivateToOwner && (
                  <div className="flex items-center gap-1 text-[9px] text-red-500 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100 ml-1 font-black">
                    <EyeOff className="h-2.5 w-2.5" />
                    OWNER
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ),
    },
  ];

  // Calculated Stats
  const totalAgents = rows.length;
  const privateClinicsCount = rows[0]?.clinics.filter(c => c.isPrivateToOwner).length || 0;
  const totalClinicsCount = rows[0]?.clinics.length || 0;

  return (
    <div className="p-8 space-y-10 bg-[#f8fafc] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-14 w-14 rounded-3xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
              <ShieldCheck className="h-8 w-8 text-[#CBFF38]" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">
                Access Control <span className="text-blue-600">Matrix</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Deployment System v4.0 PRO</p>
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => loadData(true)}
          disabled={loading || isRefreshing}
          className="h-12 px-6 flex items-center gap-2 bg-white border-2 border-slate-100 hover:border-slate-300 rounded-[1.25rem] font-black text-xs uppercase tracking-widest text-slate-600 transition-all shadow-sm active:scale-95"
        >
          <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin text-blue-500")} />
          Sync Registry
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-[2rem] border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-[10px] font-black uppercase text-slate-400 tracking-[0.15em]">
            Managed Agents
            <UserCheck className="h-5 w-5 text-blue-500 group-hover:rotate-12 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-800 italic">{totalAgents}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-lg border border-emerald-100 flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> SYNCHRONIZED
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-[10px] font-black uppercase text-slate-400 tracking-[0.15em]">
            Clinic Inventory
            <Building2 className="h-5 w-5 text-[#CBFF38] group-hover:rotate-12 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-800 italic">{totalClinicsCount}</div>
            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
              Registered network locations
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-[10px] font-black uppercase text-slate-400 tracking-[0.15em]">
            Access Restrictions
            <ShieldAlert className="h-5 w-5 text-red-500 group-hover:rotate-12 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-800 italic">{privateClinicsCount}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-black rounded-lg border border-red-100 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> OWNERS ONLY
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Matrix Table */}
      <Card className="rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border-none overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 px-8 py-8 border-b border-slate-100/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Security Policy mapping</CardTitle>
              <CardDescription className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mt-0.5">Toggle clinic visibility per individual agent profile.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="px-4 py-2 bg-blue-50/50 rounded-2xl border border-blue-100 mb-6 flex items-center gap-3">
             <ShieldAlert className="w-4 h-4 text-blue-600" />
             <p className="text-[10px] font-black text-blue-700 uppercase">Changes are applied immediately to agent dashboards upon clicking clinic markers.</p>
          </div>
          <DataTable
            columns={columns as any}
            data={rows as any}
            searchKey="agentName"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessControl;
