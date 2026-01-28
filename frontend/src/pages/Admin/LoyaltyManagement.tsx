import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/molecules/Card/Card";
import { Badge } from "@/components/atoms/Badge";
import { Award, Plus, Save, Trash2, Gift } from "lucide-react";
import {
  fetchLoyaltyTiers,
  updateLoyaltyTiers,
} from "@/store/slices/adminSlice";
import type { RootState, AppDispatch } from "@/store";
import type { LoyaltyTier } from "@/types";

export const LoyaltyManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loyaltyTiers, isLoading, error } = useSelector(
    (state: RootState) => state.admin
  );
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    dispatch(fetchLoyaltyTiers());
  }, [dispatch]);

  useEffect(() => {
    if (loyaltyTiers) {
      setTiers(loyaltyTiers);
    }
  }, [loyaltyTiers]);

  const handleAddTier = () => {
    setTiers([...tiers, { name: "New Tier", points: 0, rewards: [] }]);
    setHasChanges(true);
  };

  const handleRemoveTier = (index: number) => {
    const newTiers = tiers.filter((_, i) => i !== index);
    setTiers(newTiers);
    setHasChanges(true);
  };

  const handleTierChange = (
    index: number,
    field: string,
    value: string | number | string[]
  ) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
    setHasChanges(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateLoyaltyTiers(tiers));
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Loyalty Management</h1>
          <p className="text-muted-foreground mt-2 text-gray-500">
            Configure customer loyalty tiers, point thresholds, and rewards.
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!hasChanges || isLoading}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((tier, index) => (
          <Card key={index} className="relative overflow-hidden transition-all hover:shadow-md">
            <div className="absolute top-0 right-0 p-4 opacity-10 hover:opacity-100 transition-opacity">
              <Award className="w-24 h-24 text-blue-500 -mr-6 -mt-6 transform rotate-12" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Input
                  className="font-bold text-lg border-transparent hover:border-gray-200 focus:border-blue-500 transition-colors bg-transparent px-2 -ml-2 w-full"
                  value={tier.name}
                  onChange={(e) => handleTierChange(index, "name", e.target.value)}
                  placeholder="Tier Name"
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">
                  Points Required
                </label>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-500" />
                  <Input
                    type="number"
                    value={tier.points}
                    onChange={(e) =>
                      handleTierChange(index, "points", Number(e.target.value))
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">
                  Rewards (Comma separated)
                </label>
                <div className="flex items-start gap-2">
                  <Gift className="w-4 h-4 text-green-500 mt-2" />
                  <div className="flex-1">
                    <Input
                      value={tier.rewards?.join(", ")}
                      onChange={(e) => handleTierChange(index, "rewards", e.target.value.split(",").map(s => s.trim()))}
                      placeholder="e.g. 5% Discount, Free Consultation"
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tier.rewards?.map((reward, i) => (
                        reward && <Badge key={i} variant="secondary" className="text-xs">{reward}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50/50 flex justify-end p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveTier(index)}
                className="text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </CardFooter>
          </Card>
        ))}

        {/* Add New Tier Card */}
        <button
          onClick={handleAddTier}
          className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
        >
          <div className="p-4 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors mb-4">
            <Plus className="w-8 h-8 text-gray-500 group-hover:text-blue-600" />
          </div>
          <span className="font-medium text-gray-600 group-hover:text-blue-600">Add New Tier</span>
        </button>
      </div>
    </div>
  );
};
