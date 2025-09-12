import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import {
  fetchLoyaltyTiers,
  updateLoyaltyTiers,
} from "@/store/slices/adminSlice";
import type { RootState, AppDispatch } from "@/store";
import type { LoyaltyTier } from "@/types";
import { Sidebar } from "@/components/organisms/Sidebar";

export const LoyaltyManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loyaltyTiers, isLoading, error } = useSelector(
    (state: RootState) => state.admin
  );
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);

  useEffect(() => {
    dispatch(fetchLoyaltyTiers());
  }, [dispatch]);

  useEffect(() => {
    if (loyaltyTiers) {
      setTiers(loyaltyTiers);
    }
  }, [loyaltyTiers]);

  const handleAddTier = () => {
    setTiers([...tiers, { name: "", points: 0, rewards: [] }]);
  };

  const handleTierChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateLoyaltyTiers(tiers));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Loyalty Management</h2>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {tiers.map((tier, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="Tier Name"
              value={tier.name}
              onChange={(e) => handleTierChange(index, "name", e.target.value)}
            />
            <Input
              type="number"
              placeholder="Points"
              value={tier.points}
              onChange={(e) =>
                handleTierChange(index, "points", Number(e.target.value))
              }
            />
          </div>
        ))}
        <Button variant="outline" onClick={handleAddTier}>
          Add Tier
        </Button>
        <Button type="submit">Save Tiers</Button>
      </form>
    </div>
  );
};
