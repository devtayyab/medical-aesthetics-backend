import React, { useState } from "react";
import { Button } from "@/components/atoms/Button/Button";

type ClinicInfoProps = {
  title: string;
  duration: string;
  description: string;
  discount: string;
  price: string;
  id: number;
};

const ClinicInfo: React.FC<ClinicInfoProps> = ({
  title,
  duration,
  description,
  discount,
  price,
  id,
}) => {
  // const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <div className="w-full flex justify-between gap-6 items-end mt-2">
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-6">
          {/* <p className="font-semibold">{title}</p> */}
          {/* <p className="font-semibold">{price}</p> */}
        </div>
        <div className="flex flex-row gap-6">
          {/* <p className="text-sm text-gray-600">{duration}</p> */}
          <p className="text-sm font-bold text-gray-600">{description}</p>
          {/* <p className="text-green-600 text-sm">{discount}</p> */}
        </div>
        <hr />
      </div>
      {/* <div className="pr-4 pl-2">
        <Button
          onClick={() => setSelectedId(id)}
          className={`px-4 py-1 mb-2 rounded-[12px] border hover:!bg-[#32BA1A26] hover:!text-[#2DA219] hover:!border-[#2DA219] ${
            selectedId === id
              ? "bg-[#32BA1A26] text-[#2DA219] border-green-600"
              : "bg-white text-red-600 border-red-600"
          }`}
        >
          {selectedId === id ? "Selected" : "Select"}
        </Button>
      </div> */}
    </div>
  );
};

export default ClinicInfo;
