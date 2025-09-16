
type BookingCardProps = {
  name: string;
  price: number;
  location: string;
};

const BookingCard: React.FC<BookingCardProps> = ({ name, price, location }) => {
  return (
<div className="flex justify-center">
  <div className="bg-white shadow-md rounded-lg p-4 items-center flex max-w-full flex-col md:flex-row gap-4">
      <div className="flex flex-col">
<div className="flex gap-4">
        {/* Image */}
      <div className=" w-full md:w-1/4 bg-gray-200 flex items-center justify-center h-32 rounded-md">
        <img src='./yourimage.png' className="text-gray-400  "/>
      </div>

      {/* Info */}
      <div className="flex-1">
        <h2 className="text-lg font-semibold">{name}</h2>
        <div className="flex items-center text-yellow-500 text-sm">
         4.0 ★★★★☆ <span className="text-gray-600 ml-2">(2 reviews)</span>
        </div>
        <p className="text-sm text-gray-600">
          {location} ·{" "}
          
          <a href="#" className="text-green-600">
            Show on map
          </a>
        </p>
        <p className="text-sm text-green-500 font-medium">% Off peak</p>
        </div>
      </div>
      {/* 1st  */}
    <div className="flex  items-center justify-between gap-4 text-sm text-gray-600">
  {/* Left side */}
  <p className="text-sm text-gray-600">
    Can't find availability? Call the clinic · 15 mins </p>
  {/* Right side */}
<div className="flex flex-col items-end gap-1">
  <div className="flex items-center gap-2">
    <p className="text-sm text-gray-500">from</p>
    <p className="text-sm font-bold text-green-700">${price}</p>
  </div>
  <p className="text-xs text-blue-500">save up to 99%</p>
</div>
</div>
 <hr/>

{/* 2nd  */}
  
   <div className="flex  items-center justify-between gap-4 text-sm text-gray-600">
  {/* Left side */}
  <p className="text-sm text-gray-600">
    Can't find availability? Call the clinic · 15 mins
  </p>
  {/*Right side */}
<div className="flex flex-col items-end gap-1">
  <div className="flex items-center gap-2">
    <p className="text-sm text-gray-500">from</p>
    <p className="text-sm font-bold text-green-700">${price}</p>
  </div>
  <p className="text-xs text-blue-500">save up to 99%</p>
</div>
</div>
<hr/>
{/* 3rd */}
   <div className="flex  items-center justify-between gap-4 text-sm text-gray-600">
  {/* Left side */}
  <p className="text-sm text-gray-600">
    Can't find availability? Call the clinic · 15 mins
  </p>

  {/* right side*/}
<div className="flex flex-col items-end gap-1">
  <div className="flex items-center gap-2">
    <p className="text-sm text-gray-500">from</p>
    <p className="text-sm font-bold text-green-700">${price}</p>
  </div>
  <p className="text-xs text-blue-500">save up to 99%</p>
</div>
</div>
{/* end  */}

</div>
</div>
</div>

 
    
  
    
  );
};

export default BookingCard;
