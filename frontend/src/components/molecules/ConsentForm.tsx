import React, { useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";

interface ConsentFormProps {
  onConsent: (granted: boolean) => void;
}

export const ConsentForm: React.FC<ConsentFormProps> = ({ onConsent }) => {
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConsent(accepted);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="flex items-center gap-2">
          <Input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          I agree to the terms and privacy policy
        </label>
      </div>
      <Button type="submit" disabled={!accepted}>
        Submit Consent
      </Button>
    </form>
  );
};
