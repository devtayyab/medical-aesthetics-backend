import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { 
  testFacebookConnection, 
  getFacebookForms, 
  importFacebookLeads,
  handleFacebookWebhook 
} from "@/store/slices/crmSlice";
import type { RootState, AppDispatch } from "@/store";

interface FacebookForm {
  id: string;
  name: string;
  status: string;
  leads_count: number;
  created_time: string;
}

export const FacebookIntegration: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.crm);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [facebookForms, setFacebookForms] = useState<FacebookForm[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"leads" | "name" | "date">("leads");
  const [isFetchingForms, setIsFetchingForms] = useState(false);
  const [importData, setImportData] = useState({ formId: "", limit: 10 });
  const [webhookData, setWebhookData] = useState({
    leadId: "", formId: "", campaignId: "", adsetId: "",
    adId: "", firstName: "", lastName: "", email: "", phone: ""
  });

  const handleTestConnection = async () => {
    try {
      const result = await dispatch(testFacebookConnection()).unwrap();
      setConnectionStatus("Connection successful!");
      console.log("Facebook connection test result:", result);
    } catch (error) {
      setConnectionStatus("Connection failed!");
      console.error("Facebook connection test failed:", error);
    }
  };

  const handleGetForms = async () => {
    setIsFetchingForms(true);
    try {
      const result = await dispatch(getFacebookForms()).unwrap();
      const forms: FacebookForm[] = Array.isArray(result) ? result : (result as any)?.data || [];
      setFacebookForms(forms);
      console.log("Facebook forms total:", forms.length);
    } catch (error) {
      console.error("Failed to fetch Facebook forms:", error);
      alert("Failed to fetch Facebook forms");
    } finally {
      setIsFetchingForms(false);
    }
  };

  const handleImportLeads = async () => {
    if (!importData.formId) { alert("Please enter a Form ID"); return; }
    try {
      const result = await dispatch(importFacebookLeads({ formId: importData.formId, limit: importData.limit })).unwrap();
      alert(`Successfully imported ${result.length || 0} leads`);
    } catch (error) {
      console.error("Failed to import leads:", error);
      alert("Failed to import leads");
    }
  };

  const handleWebhookTest = async () => {
    try {
      await dispatch(handleFacebookWebhook(webhookData)).unwrap();
      alert("Webhook test successful!");
    } catch (error) {
      console.error("Webhook test failed:", error);
      alert("Webhook test failed");
    }
  };

  const filteredForms = facebookForms
    .filter(f => (f.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || f.id.includes(searchQuery))
    .sort((a, b) => {
      if (sortBy === "leads") return (b.leads_count || 0) - (a.leads_count || 0);
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "date") return new Date(b.created_time).getTime() - new Date(a.created_time).getTime();
      return 0;
    });

  const totalLeads = facebookForms.reduce((sum, f) => sum + (f.leads_count || 0), 0);
  const formsWithLeads = facebookForms.filter(f => f.leads_count > 0).length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Facebook Integration</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle>Connection Test</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleTestConnection} disabled={isLoading} className="w-full">
              Test Facebook Connection
            </Button>
            {connectionStatus && (
              <div className={`p-3 rounded ${connectionStatus.includes("successful") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {connectionStatus}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Import Leads</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Form ID</label>
              <Input placeholder="Enter Facebook Form ID" value={importData.formId}
                onChange={(e) => setImportData(prev => ({ ...prev, formId: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Limit (Optional)</label>
              <Input type="number" placeholder="Number of leads to import" value={importData.limit}
                onChange={(e) => setImportData(prev => ({ ...prev, limit: parseInt(e.target.value) || 10 }))} />
            </div>
            <Button onClick={handleImportLeads} disabled={isLoading || !importData.formId} className="w-full">
              Import Leads
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle>
              Facebook Forms
              {facebookForms.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({facebookForms.length} forms &middot; {formsWithLeads} with leads &middot; {totalLeads.toLocaleString()} total leads)
                </span>
              )}
            </CardTitle>
            <Button onClick={handleGetForms} disabled={isFetchingForms} className="shrink-0">
              {isFetchingForms ? "Fetching all forms..." : "Fetch Facebook Forms"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {facebookForms.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-700">{facebookForms.length}</div>
                  <div className="text-xs text-blue-500 mt-1">Total Forms</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-700">{formsWithLeads}</div>
                  <div className="text-xs text-green-500 mt-1">Forms with Leads</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-700">{totalLeads.toLocaleString()}</div>
                  <div className="text-xs text-purple-500 mt-1">Total Leads</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                <Input placeholder="Search by form name or ID..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 min-w-[200px]" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "leads" | "name" | "date")}
                  className="border rounded px-3 py-2 text-sm bg-white">
                  <option value="leads">Sort: Most Leads</option>
                  <option value="date">Sort: Newest</option>
                  <option value="name">Sort: Name A-Z</option>
                </select>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredForms.map((form) => (
                  <div key={form.id} className="border rounded-lg p-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{form.name || "(Unnamed)"}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        ID: {form.id}{form.created_time ? ` · ${new Date(form.created_time).toLocaleDateString()}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${form.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {form.status}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded font-bold min-w-[60px] text-center ${(form.leads_count || 0) > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>
                        {form.leads_count || 0} leads
                      </span>
                      <Button onClick={() => setImportData(prev => ({ ...prev, formId: form.id }))} className="text-xs py-1 px-2 h-auto">
                        Use
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredForms.length === 0 && (
                  <div className="text-center text-gray-400 py-8">No forms match your search.</div>
                )}
              </div>
            </>
          )}

          {facebookForms.length === 0 && !isFetchingForms && (
            <div className="text-center text-gray-400 py-12">
              Click "Fetch Facebook Forms" to load all forms from your Facebook Page.
            </div>
          )}
          {isFetchingForms && (
            <div className="text-center text-blue-500 py-12">
              Loading all forms from Facebook... (this may take a few seconds)
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Test Webhook</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Lead ID" value={webhookData.leadId} onChange={(e) => setWebhookData(prev => ({ ...prev, leadId: e.target.value }))} />
            <Input placeholder="Form ID" value={webhookData.formId} onChange={(e) => setWebhookData(prev => ({ ...prev, formId: e.target.value }))} />
            <Input placeholder="Campaign ID" value={webhookData.campaignId} onChange={(e) => setWebhookData(prev => ({ ...prev, campaignId: e.target.value }))} />
            <Input placeholder="Adset ID" value={webhookData.adsetId} onChange={(e) => setWebhookData(prev => ({ ...prev, adsetId: e.target.value }))} />
            <Input placeholder="Ad ID" value={webhookData.adId} onChange={(e) => setWebhookData(prev => ({ ...prev, adId: e.target.value }))} />
            <Input placeholder="First Name" value={webhookData.firstName} onChange={(e) => setWebhookData(prev => ({ ...prev, firstName: e.target.value }))} />
            <Input placeholder="Last Name" value={webhookData.lastName} onChange={(e) => setWebhookData(prev => ({ ...prev, lastName: e.target.value }))} />
            <Input placeholder="Email" value={webhookData.email} onChange={(e) => setWebhookData(prev => ({ ...prev, email: e.target.value }))} />
            <Input placeholder="Phone" value={webhookData.phone} onChange={(e) => setWebhookData(prev => ({ ...prev, phone: e.target.value }))} />
          </div>
          <Button onClick={handleWebhookTest} disabled={isLoading} className="w-full">Test Webhook</Button>
        </CardContent>
      </Card>
    </div>
  );
};
