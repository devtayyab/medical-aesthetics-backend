import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { fetchSalespersonAnalytics, fetchCrmMetrics } from "@/store/slices/crmSlice";
import type { RootState, AppDispatch } from "@/store";

export const Analytics: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { analytics, isLoading } = useSelector((state: RootState) => state.crm);
  const [salespersonId, setSalespersonId] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    dispatch(fetchCrmMetrics());
  }, [dispatch]);

  useEffect(() => {
    if (salespersonId) {
      dispatch(fetchSalespersonAnalytics({ 
        salespersonId, 
        dateRange 
      }));
    }
  }, [dispatch, salespersonId, dateRange]);

  const handleRefresh = () => {
    dispatch(fetchCrmMetrics());
    if (salespersonId) {
      dispatch(fetchSalespersonAnalytics({ 
        salespersonId, 
        dateRange 
      }));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">CRM Analytics</h1>
        <Button onClick={handleRefresh} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Salesperson ID</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Enter Salesperson ID"
              value={salespersonId}
              onChange={(e) => setSalespersonId(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Start Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>End Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleRefresh}
              disabled={!salespersonId || isLoading}
              className="w-full"
            >
              Load Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CRM Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading metrics...</div>
            ) : analytics ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Leads:</span>
                  <span className="font-semibold">{analytics.totalLeads || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Converted Leads:</span>
                  <span className="font-semibold">{analytics.convertedLeads || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Conversion Rate:</span>
                  <span className="font-semibold">
                    {analytics.conversionRate ? `${(analytics.conversionRate * 100).toFixed(2)}%` : '0%'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Actions:</span>
                  <span className="font-semibold">{analytics.totalActions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed Actions:</span>
                  <span className="font-semibold">{analytics.completedActions || 0}</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No metrics available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salesperson Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {salespersonId && analytics ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Leads Assigned:</span>
                  <span className="font-semibold">{analytics.leadsAssigned || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Leads Contacted:</span>
                  <span className="font-semibold">{analytics.leadsContacted || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Conversion Rate:</span>
                  <span className="font-semibold">
                    {analytics.salespersonConversionRate ? 
                      `${(analytics.salespersonConversionRate * 100).toFixed(2)}%` : '0%'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Average Response Time:</span>
                  <span className="font-semibold">
                    {analytics.averageResponseTime || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tasks Completed:</span>
                  <span className="font-semibold">{analytics.tasksCompleted || 0}</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">
                {!salespersonId ? 'Enter a salesperson ID to view performance' : 'No performance data available'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
