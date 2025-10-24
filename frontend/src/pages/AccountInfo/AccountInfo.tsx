import { useEffect, useState } from "react";

const AccountInfo:React.FC = () => {
  const [firstName, setfirstName] = useState("");
  const [lastName, setlastName] = useState("");
  const [id, setId] = useState("");
  const [email, setEmail] = useState("");
   const [role, setRole] = useState("");
  
 const loginUser = async () => {
    try {
      const res = await fetch("https://51.20.72.67/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "john.doe@email.com",
          password: "securePassword123",
        }),
      });

      if (!res.ok) throw new Error("Login failed");

      const data = await res.json();

      //  Save tokens to localStorage
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      console.log("Tokens saved successfully!");
    }
     catch (err) {
      console.error("Login Error:", err); 
    }
  };

  //Fetch user data using access token
  const fetchUserData = async () => {
    try {
      let accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!accessToken) {
        console.warn(" No access token found. Please log in.");
          await loginUser(); 
        return;
      }
      let res = await fetch("https://51.20.72.67/users/me", {
        method: "GET",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });

      //  If token expired, refresh it
      if (res.status === 401 && refreshToken) {
        console.log("Access token expired. Refreshing...");
        const refreshRes = await fetch("https://51.20.72.67/auth/refresh", {
  method: "POST",
  headers: {
    accept: "*/*",
  },
  credentials: "include", 
});
        if (refreshRes.ok) {
        const newTokens = await refreshRes.json();
        localStorage.setItem("accessToken", newTokens.accessToken);
          localStorage.setItem("refreshToken", newTokens.refreshToken);
        
        res = await fetch("https://51.20.72.67/users/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${newTokens.accessToken}`,
          },
          credentials: "include",
        });
      }
      else{
            console.warn("Refresh token invalid — logging in again...");
        await loginUser();   
        return await fetchUserData(); 
      }
      }

      if(!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      console.log(" User Data:", data);
      setfirstName(data.firstName || "");
      setlastName(data.lastName || "");
      setEmail(data.email || "");
      setId(data.id || "");
      setRole(data.role || "");
      
    } catch (err) {
      console.error(" Error fetching user data:", err);
    
    }
  };
   
const updateProfile = async () => {
  try {
    const token = localStorage.getItem("accessToken");
    const res = await fetch("https://51.20.72.67/users/me/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName,
        
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const data = await res.json();
    console.log("✅ Profile updated:", data);
  } catch (err) {
    console.error("❌ Error updating profile:", err);
  }
};

useEffect(()=>{
  fetchUserData(); 
  updateProfile();
},[])
  return (
    <div className="w-full h-auto bg-gray-50 flex flex-col items-center py-10 px-4 sm:px-6 md:px-10 lg:justify-between">
      {/* Top Section */}
      <div className="w-full max-w-3xl text-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">My Account</h1>
        <p className="text-gray-500 text-sm mt-1">Account / Personal Info</p>
      </div>

      {/* Card */}
      <div className="bg-white shadow-md rounded-2xl w-full max-w-3xl p-6">
        {/* Profile Section */}
        <div className="flex items-center gap-5 border-b pb-5 mb-5">
          <img
            src={`https://api.dicebear.com/6.x/initials/svg?seed=${firstName}`}
            alt="profile"
            className="w-24 h-24 justify-center object-cover rounded-full p-6 border"
          />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{firstName}</h2>
            <p className="text-gray-500">{email}</p>
          </div>
        </div>

        {/* Personal Info */}
        <div className=" gap-6">
          <div>
            <label className="text-gray-600 text-sm mb-2 block">First Name</label>
            <input
              type="text"  
              value={firstName}
              onChange={(e) => setfirstName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="text-gray-600 text-sm mb-2 block">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setlastName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100"
              placeholder="Enter your Username"
            />
          </div>
          <div>
            <label className="text-gray-600 text-sm mb-2 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100"
              placeholder="abc@example.com"
            />
          </div>
          <div>
            <label className="text-gray-600 text-sm mb-2 block">Id</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100"
              placeholder="+1 234 567 890"
            />
          </div>
           <label className="text-gray-600 text-sm mb-2 block">Role</label>
            <input
              type="text"  
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100"
              placeholder="Enter your name"
            />
           
          </div>
        </div>
      </div>
    
  );
};

export default AccountInfo;