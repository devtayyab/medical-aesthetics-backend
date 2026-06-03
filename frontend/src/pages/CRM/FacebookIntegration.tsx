import React, { useEffect, useState } from "react";
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

export const FacebookIntegration: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.crm);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [connectionError, setConnectionError] = useState<string>("");
  const [facebookForms, setFacebookForms] = useState<any[]>([]);
  const [pageId, setPageId] = useState("");
  const [formsError, setFormsError] = useState("");
  const [importData, setImportData] = useState({
    formId: ""
  });
  const [webhookData, setWebhookData] = useState({
    leadId: "",
    formId: "",
    campaignId: "",
    adsetId: "",
    adId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });

  const handleTestConnection = async () => {
    setConnectionStatus("");
    setConnectionError("");
    try {
      const result = await dispatch(testFacebookConnection()).unwrap();
      setConnectionStatus(result?.message || "Connection successful!");
      console.log("Facebook connection test result:", result);
    } catch (error: any) {
      setConnectionError(error?.message || "Connection failed!");
      console.error("Facebook connection test failed:", error);
    }
  };

  const handleGetForms = async () => {
    setFormsError("");
    if (!pageId.trim()) {
      setFormsError("Please enter your Facebook Page ID to fetch forms.");
      return;
    }
    try {
      const result = await dispatch(getFacebookForms(pageId.trim())).unwrap();
      setFacebookForms(result || []);
      if (!result || result.length === 0) {
        setFormsError("No forms found for this Page ID. Make sure the Page ID is correct and the token has leadgen permissions.");
      }
      console.log("Facebook forms:", result);
    } catch (error: any) {
      setFormsError(error?.message || "Failed to fetch Facebook forms");
      console.error("Failed to fetch Facebook forms:", error);
    }
  };

  const handleImportLeads = async () => {
    if (!importData.formId) {
      alert("Please enter a Form ID");
      return;
    }

    try {
      const result = await dispatch(importFacebookLeads({
        formId: importData.formId
      })).unwrap();
      console.log("Imported leads:", result);
      alert(`Successfully imported ${result.length || 0} leads`);
    } catch (error) {
      console.error("Failed to import leads:", error);
      alert("Failed to import leads");
    }
  };

  const handleWebhookTest = async () => {
    try {
      // Construct payload to match FacebookWebhookDto
      const payload = {
        object: "page",
        entry: [
          {
            id: webhookData.leadId || "test_lead_id",
            created_time: new Date().toISOString(),
            form_id: webhookData.formId,
            campaign_id: webhookData.campaignId,
            adset_id: webhookData.adsetId,
            ad_id: webhookData.adId,
            field_data: [
              { name: "first_name", values: [webhookData.firstName] },
              { name: "last_name", values: [webhookData.lastName] },
              { name: "email", values: [webhookData.email] },
              { name: "phone_number", values: [webhookData.phone] }
            ]
          }
        ]
      };

      const result = await dispatch(handleFacebookWebhook(payload)).unwrap();
      console.log("Webhook test result:", result);
      alert("Webhook test successful!");
    } catch (error) {
      console.error("Webhook test failed:", error);
      alert("Webhook test failed");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Facebook Integration</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleTestConnection}
              disabled={isLoading}
              className="w-full"
            >
              Test Facebook Connection
            </Button>
            {connectionStatus && (
              <div className="p-3 rounded bg-green-100 text-green-800 text-sm">
                ✅ {connectionStatus}
              </div>
            )}
            {connectionError && (
              <div className="p-3 rounded bg-red-100 text-red-800 text-sm">
                ❌ {connectionError}
              </div>
            )}
          </CardContent>
        </Card>

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
              <p className="text-xs text-gray-400 mt-1">
                Find it at: facebook.com/&lt;YourPage&gt; → About → Page ID
              </p>
            </div>
            <Button
              onClick={handleGetForms}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Fetching..." : "Fetch Facebook Forms"}
            </Button>
            {formsError && (
              <div className="p-3 rounded bg-red-100 text-red-800 text-sm">
                ⚠️ {formsError}
              </div>
            )}
            {facebookForms.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Available Forms ({facebookForms.length}):</h4>
                {facebookForms.map((form: any) => (
                  <div key={form.id} className="border rounded p-2 text-sm flex justify-between items-center">
                    <div>
                      <div className="font-medium">{form.name}</div>
                      <div className="text-gray-500 text-xs">ID: {form.id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {form.leads_count !== undefined && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {form.leads_count} leads
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${form.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {form.status}
                      </span>
                      <button
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => setImportData({ formId: form.id })}
                      >
                        Use
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Form ID</label>
              <Input
                placeholder="Enter Facebook Form ID (or click Use above)"
                value={importData.formId}
                onChange={(e) => setImportData({ formId: e.target.value })}
              />
            </div>
            <Button
              onClick={handleImportLeads}
              disabled={isLoading || !importData.formId}
              className="w-full"
            >
              Import Leads
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Webhook</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Lead ID"
                value={webhookData.leadId}
                onChange={(e) => setWebhookData(prev => ({ ...prev, leadId: e.target.value }))}
              />
              <Input
                placeholder="Form ID"
                value={webhookData.formId}
                onChange={(e) => setWebhookData(prev => ({ ...prev, formId: e.target.value }))}
              />
              <Input
                placeholder="Campaign ID"
                value={webhookData.campaignId}
                onChange={(e) => setWebhookData(prev => ({ ...prev, campaignId: e.target.value }))}
              />
              <Input
                placeholder="Adset ID"
                value={webhookData.adsetId}
                onChange={(e) => setWebhookData(prev => ({ ...prev, adsetId: e.target.value }))}
              />
              <Input
                placeholder="Ad ID"
                value={webhookData.adId}
                onChange={(e) => setWebhookData(prev => ({ ...prev, adId: e.target.value }))}
              />
              <Input
                placeholder="First Name"
                value={webhookData.firstName}
                onChange={(e) => setWebhookData(prev => ({ ...prev, firstName: e.target.value }))}
              />
              <Input
                placeholder="Last Name"
                value={webhookData.lastName}
                onChange={(e) => setWebhookData(prev => ({ ...prev, lastName: e.target.value }))}
              />
              <Input
                placeholder="Email"
                value={webhookData.email}
                onChange={(e) => setWebhookData(prev => ({ ...prev, email: e.target.value }))}
              />
              <Input
                placeholder="Phone"
                value={webhookData.phone}
                onChange={(e) => setWebhookData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <Button
              onClick={handleWebhookTest}
              disabled={isLoading}
              className="w-full"
            >
              Test Webhook
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
