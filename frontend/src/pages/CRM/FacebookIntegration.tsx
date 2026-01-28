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
  const [facebookForms, setFacebookForms] = useState<any[]>([]);
  const [importData, setImportData] = useState({
    formId: "",
    limit: 10
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
    try {
      const result = await dispatch(getFacebookForms()).unwrap();
      setFacebookForms(result);
      console.log("Facebook forms:", result);
    } catch (error) {
      console.error("Failed to fetch Facebook forms:", error);
      alert("Failed to fetch Facebook forms");
    }
  };

  const handleImportLeads = async () => {
    if (!importData.formId) {
      alert("Please enter a Form ID");
      return;
    }

    try {
      const result = await dispatch(importFacebookLeads({
        formId: importData.formId,
        limit: importData.limit
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
              <div className={`p-3 rounded ${connectionStatus.includes("successful") ?
                  "bg-green-100 text-green-800" :
                  "bg-red-100 text-red-800"
                }`}>
                {connectionStatus}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Facebook Forms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGetForms}
              disabled={isLoading}
              className="w-full"
            >
              Fetch Facebook Forms
            </Button>
            {facebookForms.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Available Forms:</h4>
                {facebookForms.map((form: any) => (
                  <div key={form.id} className="border rounded p-2 text-sm">
                    <div className="font-medium">{form.name}</div>
                    <div className="text-gray-600">ID: {form.id}</div>
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
                placeholder="Enter Facebook Form ID"
                value={importData.formId}
                onChange={(e) => setImportData(prev => ({ ...prev, formId: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Limit (Optional)</label>
              <Input
                type="number"
                placeholder="Number of leads to import"
                value={importData.limit}
                onChange={(e) => setImportData(prev => ({ ...prev, limit: parseInt(e.target.value) || 10 }))}
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
