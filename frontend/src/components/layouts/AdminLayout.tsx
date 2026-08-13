import React, { useState } from"react";
import { Sidebar } from"@/components/organisms/Sidebar";
import { Menu, X } from"lucide-react";

type Props = { children: React.ReactNode };

const AdminLayout: React.FC<Props> = ({ children }) => {
 const [isSidebarOpen, setIsSidebarOpen] = useState(false);

 return (
 <div className="flex h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] bg-[#F8FAFC] relative">
 {/* Mobile Toggle Button */}
 <button 
 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
 className="lg:hidden fixed bottom-6 right-6 z-[1001] size-14 bg-black text-[#CBFF38] rounded-full shadow-2xl flex items-center justify-center transition-transform active:scale-95 shadow-lime-500/20"
 >
 {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
 </button>

 {/* Backdrop for mobile */}
 {isSidebarOpen && (
 <div 
 className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] lg:hidden transition-opacity"
 onClick={() => setIsSidebarOpen(false)}
 />
 )}

 {/* Sidebar Container */}
 <div className={`
 fixed lg:relative top-[56px] sm:top-[64px] lg:top-0 bottom-0 left-0 z-[1001] lg:z-10 transform lg:translate-x-0 transition-transform duration-300 ease-in-out h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] lg:h-full
 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
 `}>
 <Sidebar onNavigate={() => setIsSidebarOpen(false)} />
 </div>

 {/* Main Content Area */}
 <div className="flex-1 flex flex-col min-w-0 overflow-auto relative">
 <main className="flex-1 overflow-y-auto p-4 md:p-8" style={{ WebkitOverflowScrolling: 'touch' }}>
 <div className="max-w-[1600px] mx-auto h-full">
 {children}
 </div>
 </main>
 </div>
 </div>
 );
};

export default AdminLayout;
