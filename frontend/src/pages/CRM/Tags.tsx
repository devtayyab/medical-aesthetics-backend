import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { addCustomerTag, removeCustomerTag, fetchCustomersByTag } from "@/store/slices/crmSlice";
import type { RootState, AppDispatch } from "@/store";
import type { CustomerTag } from "@/types";

export const Tags: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.crm);
  const [customersByTag, setCustomersByTag] = useState<any[]>([]);
  const [tagData, setTagData] = useState({
    customerId: "",
    tagId: "",
    addedBy: "",
    notes: ""
  });

  const handleAddTag = async () => {
    if (!tagData.customerId || !tagData.tagId || !tagData.addedBy) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await dispatch(addCustomerTag(tagData)).unwrap();
      setTagData({
        customerId: "",
        tagId: "",
        addedBy: "",
        notes: ""
      });
      alert("Tag added successfully!");
    } catch (error) {
      console.error("Failed to add tag:", error);
      alert("Failed to add tag");
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await dispatch(removeCustomerTag(tagId)).unwrap();
      alert("Tag removed successfully!");
    } catch (error) {
      console.error("Failed to remove tag:", error);
      alert("Failed to remove tag");
    }
  };

  const handleFetchCustomersByTag = async () => {
    if (!tagData.tagId) {
      alert("Please enter a tag ID");
      return;
    }

    try {
      const result = await dispatch(fetchCustomersByTag({ 
        tagId: tagData.tagId,
        salespersonId: tagData.addedBy || undefined 
      })).unwrap();
      setCustomersByTag(result);
    } catch (error) {
      console.error("Failed to fetch customers by tag:", error);
      alert("Failed to fetch customers");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tag Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Customer Tag</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Customer ID</label>
              <Input
                placeholder="Enter Customer ID"
                value={tagData.customerId}
                onChange={(e) => setTagData(prev => ({ ...prev, customerId: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tag ID</label>
              <Input
                placeholder="Enter Tag ID"
                value={tagData.tagId}
                onChange={(e) => setTagData(prev => ({ ...prev, tagId: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Added By (User ID)</label>
              <Input
                placeholder="Enter User ID"
                value={tagData.addedBy}
                onChange={(e) => setTagData(prev => ({ ...prev, addedBy: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
              <Input
                placeholder="Enter notes"
                value={tagData.notes}
                onChange={(e) => setTagData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <Button 
              onClick={handleAddTag}
              disabled={isLoading}
              className="w-full"
            >
              Add Tag
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Find Customers by Tag</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tag ID</label>
              <Input
                placeholder="Enter Tag ID"
                value={tagData.tagId}
                onChange={(e) => setTagData(prev => ({ ...prev, tagId: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Salesperson ID (Optional)</label>
              <Input
                placeholder="Enter Salesperson ID"
                value={tagData.addedBy}
                onChange={(e) => setTagData(prev => ({ ...prev, addedBy: e.target.value }))}
              />
            </div>
            <Button 
              onClick={handleFetchCustomersByTag}
              disabled={isLoading || !tagData.tagId}
              className="w-full"
            >
              Fetch Customers
            </Button>
          </CardContent>
        </Card>
      </div>

      {customersByTag.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Customers with Tag "{tagData.tagId}"</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customersByTag.map((customer: any) => (
                <div key={customer.id} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">
                        {customer.firstName} {customer.lastName}
                      </div>
                      <div className="text-sm text-gray-600">{customer.email}</div>
                      <div className="text-sm text-gray-600">{customer.phone}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveTag(customer.tagId)}
                    >
                      Remove Tag
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
