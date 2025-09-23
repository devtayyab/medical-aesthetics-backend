import { TfiMapAlt } from "react-icons/tfi"; // location pin icon

type ClinicCardProps = {
  name: string;
  price: number;
  location: string;
};

const ClinicCard: React.FC<ClinicCardProps> = ({ name, price, location }) => {
  return (
    <div className="container rounded-lg shadow-md p-6 bg-white w-full md:w-[600px]">
      {/* Top Section */}
      <div className="flex gap-4">
        {/* Image */}
        <div className="w-40 bg-gray-200 flex items-center justify-center h-32  mt-2 rounded-md">
          <img src="./yourimage.jpg" className="object-cover rounded-md" />
        </div>

        {/* Info */}
        <div className="flex-1 space-y-2 mt-1 ">
          <h2 className="text-lg font-semibold">{name}</h2>
          <div className="flex items-center gap-1 text-gray-700 text-sm">
            4.0
            <span className="text-yellow-500 text-sm">★★★★☆</span>
            <span className="text-gray-400 whitespace-nowrap">2 reviews</span>
          </div>

          <p className="flex items-center text-sm text-gray-700 gap-2">
            <span>{location}</span>
            <TfiMapAlt className="w-5 h-9 text-gray-800" />
            <a href="#" className="text-black hover:underline">
              Show on map
            </a>
          </p>
          <p className="text-sm text-green-700 font-medium">% Off peak</p>
        </div>
      </div>

      {/* 3 Rows */}
      {[1, 2, 3].map((row) => (
        <div key={row}>
          <div className="flex w-full items-center justify-between text-sm text-gray-600 mt-4">
            {/* Left side */}
            <div className="flex flex-col  ">
              <p className="text-sm text-gray-800 whitespace-nowrap">
                Can't find availability? Call the clinic;
              </p>
              <span className="text-sm text-gray-600 ml-2 ">15 mins</span>
            </div>
            {/* Right side */}
            <div className="flex flex-col items-end  mb-2">
              <div className="flex items-center gap-1">
                <p className="text-sm text-black">from</p>
                <p className="text-sm font-bold text-black">${price}</p>
              </div>
              <p className="text-xs text-blue-600">save up to 99%</p>
            </div>
          </div>
          {row < 3 && <hr className="mt-2" />}
        </div>
      ))}
    </div>
  );
};

export default ClinicCard;
