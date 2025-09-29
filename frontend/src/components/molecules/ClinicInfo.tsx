import React, { useState } from "react";
import{ Button }from '@/components/atoms/Button/Button';

type ClinicInfoProps = {
  title: string;
  duration: string;
  description:string;
  discount: string;
  price:string;
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
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
     <div className="flex  justify-end gap-6 items-end ">  
       {/* Left Info */}
<div className="flex flex-col gap-2">
  {/* First Row */}
  <div className="flex flex-row gap-6">
    <p className="font-semibold">{title}</p>
    <p className="font-semibold">from {price}</p>
  </div>

  {/* Second Row */}
  <div className="flex flex-row gap-6">
    <p className="text-sm text-gray-600">{duration}</p>
    <p className="text-sm font-bold text-gray-600">{description}</p>
    <p className="text-green-600 text-sm">{discount}</p>
  </div>
  <hr />
 
</div>
<div className="pr-4 pl-2">
        <Button
            onClick={() => setSelectedId(id)}
            className={`px-4 py-1  mb-2 rounded border ${
              selectedId === id
                ? "bg-green-100 text-green-800 "
                : "bg-white text-red-600 border-red-600"
            }`}
          >
            {selectedId === id ? "Selected" : "Selected"}
          </Button>
          </div>
        
  
      </div>
     
     
   
  );
};

export default ClinicInfo;
