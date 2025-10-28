// import { TfiMapAlt } from "react-icons/tfi"; // location pin icon

type ClinicCardProps = {
  name: string;
  price: number;
  location: string;
};

const ClinicCard: React.FC<ClinicCardProps> = ({ name, price, location }) => {
  return (  
  // Main container
  <div className=" w-full h-auto max-w-7xl mx-auto p-2 flex flex-col  gap-6">
  {/* Card 2 */}
   <div className=" flex flex-col md:flex-col w-full h-auto border items-center justify-center rounded-xl pt-[16px]  pr-[16px] pb-[16px] pl-[16px] gap-[20px] bg-white ">  
    {/* Top Section */}
    <div className="flex  w-full h-auto gap-[12px]">
      {/* Image */}
       <div className="bg-gray-200 flex items-center justify-center h-auto w-full  md:w-96 md:h-52 rounded">
        <img src="./yourimage.jpg"  className="object-cover w-full h-full rounded"  />
      </div>
      <div className="flex-1  flex flex-col w-full h-auto mt-2 md:mt-0  gap-[10px]  ">
  <h2 className="text-lg  font-semibold">{name}</h2>

  <div className="flex items-center gap-3 text-gray-700 text-sm">
    4.0
    <span className="text-yellow-500 text-lg">★★★★☆</span>
    <span className="text-gray-400 whitespace-nowrap">2 reviews</span>
  </div>

  <p className="text-sm text-gray-700 font-normal">{location}</p>

  <p className="text-sm text-green-700 font-semibold">% Off peak</p>
</div>
</div>
    {/* Rows */}
   <div className="w-full h-auto  flex flex-col gap-[10px]">
  {["1", "2","3"].map((row ) => (
    <div
     key={row}
      className="w-full h-auto flex flex-row md:flex-row md:items-center justify-between border-b"
        >
      {/* Left side */}
      <div className="flex flex-col">
        <p className="text-base text-gray-700   font-semibold">
          Cant find availability? Call the clinic
        </p>
        <span className="text-base text-gray-600 pb-2">15 mins</span>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end md:mt-0">
        <div className="flex items-center gap-1">
          <p className="text-base text-black font-semibold">from</p>
          <p className="text-base font-bold text-black">${price}</p>
        </div>
        <p className="text-base whitespace-nowrap  text-blue-500">save up to 99%</p>
      </div>
    </div>
  ))}
</div>


    
    </div>
    </div>

 


  );
};

export default ClinicCard;
