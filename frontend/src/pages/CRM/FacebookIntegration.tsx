import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import {
  testFacebookConnection,
  getFacebookForms,
  getFacebookStats,
  importFacebookLeads,
  importAllFacebookLeads,
  fetchLeads,
  handleFacebookWebhook
} from "@/store/slices/crmSlice";
import toast from "react-hot-toast";
import type { RootState, AppDispatch } from "@/store";
import { crmAPI } from "@/services/api";

type Tab = "overview" | "forms" | "webhook-leads";

export const FacebookIntegration: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, leadFilters } = useSelector((state: RootState) => state.crm);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [connectionError, setConnectionError] = useState<string>("");
  const [facebookForms, setFacebookForms] = useState<any[]>([]);
  const [facebookStats, setFacebookStats] = useState<any>(null);
  const [pageId, setPageId] = useState("");
  const [formsError, setFormsError] = useState("");
  const [importData, setImportData] = useState({ formId: "" });
  const [importingFormId, setImportingFormId] = useState<string | null>(null);
  const [isImportingAll, setIsImportingAll] = useState(false);
  const [formsPage, setFormsPage] = useState(1);
  const FORMS_PER_PAGE = 10;

  // Webhook leads tab state
  const [webhookLeads, setWebhookLeads] = useState<any>(null);
  const [webhookLeadsLoading, setWebhookLeadsLoading] = useState(false);
  const [webhookDays, setWebhookDays] = useState(30);
  const [webhookPage, setWebhookPage] = useState(1);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    dispatch(testFacebookConnection())
      .unwrap()
      .then((result) => {
        if (result?.pageId) setPageId(result.pageId);
      })
      .catch(() => {});
  }, [dispatch]);

  // Auto-load stats on mount (no page ID needed — stats cover all pages)
  useEffect(() => {
    loadStats(pageId || undefined);
  }, [pageId]);

  const loadStats = async (pid?: string) => {
    try {
      const stats = await dispatch(getFacebookStats(pid)).unwrap();
      setFacebookStats(stats);
    } catch (e) {}
  };

  const handleTestConnection = async () => {
    setConnectionStatus("");
    setConnectionError("");
    try {
      const result = await dispatch(testFacebookConnection()).unwrap();
      setConnectionStatus(result?.message || "Connection successful!");
      if (result?.pageId) setPageId(result.pageId);
    } catch (error: any) {
      setConnectionError(error?.message || "Connection failed!");
    }
  };

  const handleGetForms = async () => {
    setFormsError("");
    // Empty page ID = fetch forms from ALL pages the token can access
    const pid = pageId.trim() || undefined;
    try {
      const result = await dispatch(getFacebookForms(pid)).unwrap();
      setFacebookForms(result || []);
      setFormsPage(1); // reset to page 1 on new fetch
      const stats = await dispatch(getFacebookStats(pid)).unwrap();
      setFacebookStats(stats);
      if (!result || result.length === 0) {
        setFormsError(pid ? "No forms found for this Page ID." : "No forms found on any accessible page.");
      }
    } catch (error: any) {
      setFormsError(error?.message || "Failed to fetch Facebook forms");
    }
  };

  const handleImportForm = async (formId: string) => {
    setImportingFormId(formId);
    try {
      const result = await dispatch(importFacebookLeads({ formId })).unwrap();
      toast.success(`Imported ${result.length || 0} new leads from this form`);
      loadStats(pageId || undefined);
      // Refresh the leads list in the store (with the active filters, so the
      // Leads page stays consistent with its filter chips)
      dispatch(fetchLeads(leadFilters));
    } catch (error) {
      toast.error("Failed to import leads from this form");
    } finally {
      setImportingFormId(null);
    }
  };

  const handleImportAllForms = async () => {
    setIsImportingAll(true);
    try {
      const result = await dispatch(importAllFacebookLeads()).unwrap();
      toast.success(`Imported ${result.totalImported || 0} leads from ${result.totalForms || 0} forms`);
      loadStats(pageId || undefined);
      dispatch(fetchLeads(leadFilters));
      // Refresh forms list to update counts
      handleGetForms();
    } catch (error) {
      toast.error("Failed to import leads from all forms");
    } finally {
      setIsImportingAll(false);
    }
  };

  const handleImportLeads = async () => {
    if (!importData.formId) {
      alert("Please enter a Form ID");
      return;
    }
    await handleImportForm(importData.formId);
  };

  const loadWebhookLeads = useCallback(async () => {
    setWebhookLeadsLoading(true);
    try {
      const res = await crmAPI.getWebhookLeads({ days: webhookDays, page: webhookPage, limit: 50 });
      setWebhookLeads(res.data);
    } catch (e) {
      console.error("Failed to load webhook leads", e);
    } finally {
      setWebhookLeadsLoading(false);
    }
  }, [webhookDays, webhookPage]);

  useEffect(() => {
    if (activeTab === "webhook-leads") {
      loadWebhookLeads();
    }
  }, [activeTab, webhookDays, webhookPage, loadWebhookLeads]);

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date); else next.add(date);
      return next;
    });
  };

  const tabs = [
    { id: "overview" as Tab, label: "📊 Overview & Forms" },
    { id: "webhook-leads" as Tab, label: "🔔 Webhook Leads" },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Facebook Integration</h1>
      </div>

      {/* Stats Bar */}
      {facebookStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col items-center text-center">
            <div className="text-xs text-blue-500 font-semibold uppercase tracking-wider mb-1">Total FB Forms</div>
            <div className="text-2xl font-bold text-blue-700">{facebookStats.totalFbForms}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex flex-col items-center text-center">
            <div className="text-xs text-green-500 font-semibold uppercase tracking-wider mb-1">Total FB Leads</div>
            <div className="text-2xl font-bold text-green-700">{facebookStats.totalFbLeads}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex flex-col items-center text-center">
            <div className="text-xs text-purple-500 font-semibold uppercase tracking-wider mb-1">Manual Import</div>
            <div className="text-2xl font-bold text-purple-700">{facebookStats.manualLeads}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 flex flex-col items-center text-center">
            <div className="text-xs text-orange-500 font-semibold uppercase tracking-wider mb-1">Webhook Leads</div>
            <div className="text-2xl font-bold text-orange-700">{facebookStats.webhookLeads}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connection Test */}
          <Card>
            <CardHeader>
              <CardTitle>Connection Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleTestConnection} disabled={isLoading} className="w-full">
                Test Facebook Connection
              </Button>
              {connectionStatus && (
                <div className="p-3 rounded bg-green-100 text-green-800 text-sm">✅ {connectionStatus}</div>
              )}
              {connectionError && (
                <div className="p-3 rounded bg-red-100 text-red-800 text-sm">❌ {connectionError}</div>
              )}
            </CardContent>
          </Card>

          {/* Facebook Forms */}
          <Card>
            <CardHeader>
              <CardTitle>Facebook Forms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Facebook Page ID <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. 123456789012345"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Find it at: facebook.com/&lt;YourPage&gt; → About → Page ID</p>
              </div>
              <Button onClick={handleGetForms} disabled={isLoading} className="w-full">
                {isLoading ? "Fetching..." : "Fetch Facebook Forms"}
              </Button>
              {formsError && (
                <div className="p-3 rounded bg-red-100 text-red-800 text-sm">⚠️ {formsError}</div>
              )}
              {facebookForms.length > 0 && (() => {
                const totalPages = Math.ceil(facebookForms.length / FORMS_PER_PAGE);
                const pageForms = facebookForms.slice(
                  (formsPage - 1) * FORMS_PER_PAGE,
                  formsPage * FORMS_PER_PAGE
                );
                return (
                  <div className="mt-2 space-y-2">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b pb-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-sm">Available Forms ({facebookForms.length}):</h4>
                        <Button 
                          onClick={handleImportAllForms} 
                          disabled={isImportingAll || isLoading} 
                          className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                        >
                          {isImportingAll ? "Importing All..." : "Import All Remaining"}
                        </Button>
                      </div>
                      <span className="text-xs text-gray-400">Page {formsPage} of {totalPages}</span>
                    </div>

                    {/* Forms List */}
                    {pageForms.map((form: any) => (
                      <div key={form.id} className="border rounded p-2 text-sm flex justify-between items-center">
                        <div>
                          <div className="font-medium text-xs">{form.name}</div>
                          <div className="text-gray-400 text-xs">
                            ID: {form.id}
                            {form.page_name && <span className="ml-2 text-purple-500">• Page: {form.page_name}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {form.leads_count !== undefined && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full" title="Total leads on Facebook">
                              {form.leads_count} on FB
                            </span>
                          )}
                          {form.imported_count !== undefined && (() => {
                            const fbKnown = form.leads_count !== undefined && form.leads_count !== null;
                            const complete = fbKnown && Number(form.imported_count) >= Number(form.leads_count);
                            return (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${!fbKnown ? 'bg-gray-100 text-gray-600' : complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                                title={!fbKnown ? 'Facebook total unknown — coverage cannot be verified' : complete ? 'All leads imported into the CRM' : 'Some Facebook leads are not in the CRM yet — click Import'}
                              >
                                {form.imported_count} imported
                              </span>
                            );
                          })()}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${form.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {form.status}
                          </span>
                          <button
                            className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                            disabled={importingFormId === form.id}
                            onClick={() => handleImportForm(form.id)}
                          >
                            {importingFormId === form.id ? "Importing..." : "Import"}
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center pt-2">
                        <button
                          onClick={() => setFormsPage(p => Math.max(1, p - 1))}
                          disabled={formsPage === 1}
                          className="px-3 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          ← Prev
                        </button>
                        <div className="flex gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - formsPage) <= 1)
                            .reduce<(number | string)[]>((acc, p, idx, arr) => {
                              if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                              acc.push(p);
                              return acc;
                            }, [])
                            .map((p, idx) =>
                              p === '...' ? (
                                <span key={`dot-${idx}`} className="px-2 py-1 text-xs text-gray-400">...</span>
                              ) : (
                                <button
                                  key={p}
                                  onClick={() => setFormsPage(p as number)}
                                  className={`px-2 py-1 text-xs border rounded ${
                                    formsPage === p
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'hover:bg-gray-50'
                                  }`}
                                >
                                  {p}
                                </button>
                              )
                            )
                          }
                        </div>
                        <button
                          onClick={() => setFormsPage(p => Math.min(totalPages, p + 1))}
                          disabled={formsPage === totalPages}
                          className="px-3 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Manual Import Card */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Import by Form ID</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Form ID</label>
                <Input
                  placeholder="Enter Facebook Form ID"
                  value={importData.formId}
                  onChange={(e) => setImportData({ formId: e.target.value })}
                />
              </div>
              <Button
                onClick={handleImportLeads}
                disabled={isLoading || !importData.formId}
                className="w-full"
              >
                Import Leads from this Form
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== WEBHOOK LEADS TAB ===== */}
      {activeTab === "webhook-leads" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Show last:</label>
              {[7, 14, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => { setWebhookDays(d); setWebhookPage(1); }}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    webhookDays === d
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {d} days
                </button>
              ))}
            </div>
            <Button
              onClick={loadWebhookLeads}
              disabled={webhookLeadsLoading}
              className="ml-auto"
            >
              {webhookLeadsLoading ? "Loading..." : "🔄 Refresh"}
            </Button>
          </div>

          {/* Summary */}
          {webhookLeads && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-semibold text-orange-600 text-lg">{webhookLeads.total}</span>
              <span>webhook leads in the last {webhookDays} days</span>
            </div>
          )}

          {/* Daily Groups */}
          {webhookLeadsLoading ? (
            <div className="text-center py-12 text-gray-400">Loading webhook leads...</div>
          ) : webhookLeads?.dailyGroups?.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🔔</div>
              <div className="text-gray-500 font-medium">No webhook leads in the last {webhookDays} days</div>
              <div className="text-gray-400 text-sm mt-1">Leads from Facebook Ads will appear here automatically when someone fills a form.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {webhookLeads?.dailyGroups?.map((group: any) => (
                <div key={group.date} className="border rounded-lg overflow-hidden">
                  {/* Date Header */}
                  <button
                    className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => toggleDate(group.date)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-700">
                        📅 {new Date(group.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </span>
                      <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {group.count} lead{group.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="text-gray-400 text-xs">{expandedDates.has(group.date) ? "▲ Hide" : "▼ Show"}</span>
                  </button>

                  {/* Leads Table */}
                  {expandedDates.has(group.date) && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b text-left">
                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Email</th>
                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Ad</th>
                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Time</th>
                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.leads.map((lead: any) => (
                            <tr key={lead.id} className="border-b hover:bg-orange-50 transition-colors">
                              <td className="px-4 py-2 font-medium">
                                {lead.firstName} {lead.lastName}
                              </td>
                              <td className="px-4 py-2 text-gray-600">{lead.email || "—"}</td>
                              <td className="px-4 py-2 text-gray-600">{lead.phone || "—"}</td>
                              <td className="px-4 py-2 text-gray-500 text-xs">{lead.facebookAdName || "—"}</td>
                              <td className="px-4 py-2 text-gray-500 text-xs">
                                {new Date(lead.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  lead.status === 'new' ? 'bg-blue-100 text-blue-700'
                                  : lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-700'
                                  : lead.status === 'converted' ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {lead.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}

              {/* Pagination */}
              {webhookLeads && webhookLeads.total > 50 && (
                <div className="flex justify-center items-center gap-3 pt-2">
                  <button
                    onClick={() => setWebhookPage(p => Math.max(1, p - 1))}
                    disabled={webhookPage === 1}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {webhookPage} of {Math.ceil(webhookLeads.total / 50)}
                  </span>
                  <button
                    onClick={() => setWebhookPage(p => p + 1)}
                    disabled={webhookPage >= Math.ceil(webhookLeads.total / 50)}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
