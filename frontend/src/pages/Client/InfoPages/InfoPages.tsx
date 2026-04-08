import React from "react";
import { Link } from "react-router-dom";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBg.svg";
import { FaChevronRight } from "react-icons/fa6";
import { Card } from "@/components/atoms/Card/Card";

const containerStyle = css`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
`;

export const Legal: React.FC = () => {
    return (
        <section className="relative bg-cover bg-center flex items-center justify-center px-4 py-[60px]" style={{ backgroundImage: `url(${LayeredBG})`, backgroundPosition: "center", backgroundSize: "cover", backgroundRepeat: "no-repeat" }}>
            <div className={containerStyle}>
                <div className="flex items-center text-[#33373F] text-[15px] font-medium mb-1">
                    <Link to="/my-account" className="hover:text-[#405C0B] transition-colors">Account</Link>
                    <span className="px-3"><FaChevronRight size={11} className="pt-[1px] text-[#767676]" /></span>
                    Legal
                </div>
                <h2 className="text-[#33373F] text-[30px] font-black italic uppercase mb-8">Legal & <span className="text-lime-700">Policies</span></h2>
                <Card className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6">
                    <div><h3 className="text-xl font-bold mb-2">Terms of Service</h3><p className="text-gray-600 italic">Our terms of service provide detailed information about our commitment to your privacy and the rules governing the use of our aesthetics platform.</p></div>
                    <div className="border-t pt-6"><h3 className="text-xl font-bold mb-2">Privacy Policy</h3><p className="text-gray-600 italic">Your data security is our priority. We treat your personal information with the highest standards of confidentiality.</p></div>
                    <div className="border-t pt-6"><h3 className="text-xl font-bold mb-2">Cookie Policy</h3><p className="text-gray-600 italic">Experience a more personalized browsing experience with our transparent cookie policy.</p></div>
                </Card>
            </div>
        </section>
    );
};

export const SupportCenter: React.FC = () => {
    return (
        <section className="relative bg-cover bg-center flex items-center justify-center px-4 py-[60px]" style={{ backgroundImage: `url(${LayeredBG})`, backgroundPosition: "center", backgroundSize: "cover", backgroundRepeat: "no-repeat" }}>
            <div className={containerStyle}>
                <div className="flex items-center text-[#33373F] text-[15px] font-medium mb-1">
                    <Link to="/my-account" className="hover:text-[#405C0B] transition-colors">Account</Link>
                    <span className="px-3"><FaChevronRight size={11} className="pt-[1px] text-[#767676]" /></span>
                    Support
                </div>
                <h2 className="text-[#33373F] text-[30px] font-black italic uppercase mb-8">Help <span className="text-lime-700">Center</span></h2>
                <Card className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6">
                    <div><h3 className="text-xl font-bold mb-2">How to Book an Appointment?</h3><p className="text-gray-600 italic">Booking is easy! Simply navigate to the search page, select your preferred treatment, and choose a time slot that works for you.</p></div>
                    <div className="border-t pt-6"><h3 className="text-xl font-bold mb-2">Rescheduling & Cancellations</h3><p className="text-gray-600 italic">Need to change your plans? You can manage your appointments directly from your dashboard up to 24 hours before your session.</p></div>
                    <div className="border-t pt-6"><h3 className="text-xl font-bold mb-2">Payment Options</h3><p className="text-gray-600 italic">We accept all major credit cards, Stripe payments, and cash on-site at our certified clinics.</p></div>
                </Card>
            </div>
        </section>
    );
};

export const ChatSupport: React.FC = () => {
    return (
        <section className="relative bg-cover bg-center flex items-center justify-center px-4 py-[60px]" style={{ backgroundImage: `url(${LayeredBG})`, backgroundPosition: "center", backgroundSize: "cover", backgroundRepeat: "no-repeat" }}>
            <div className={containerStyle}>
                <div className="flex items-center text-[#33373F] text-[15px] font-medium mb-1">
                    <Link to="/my-account" className="hover:text-[#405C0B] transition-colors">Account</Link>
                    <span className="px-3"><FaChevronRight size={11} className="pt-[1px] text-[#767676]" /></span>
                    Chat
                </div>
                <h2 className="text-[#33373F] text-[30px] font-black italic uppercase mb-8">Live <span className="text-lime-700">Chat</span></h2>
                <Card className="bg-white p-12 rounded-2xl shadow-2xl border border-gray-100 text-center max-w-lg mx-auto">
                    <div className="size-20 bg-lime-50 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-lime-600 text-3xl shrink-0">ðŸ’¬</span></div>
                    <h3 className="text-2xl font-black italic uppercase text-gray-900 mb-4">Connect with an Expert</h3>
                    <p className="text-gray-500 italic mb-8">Our support specialists are available 24/7 to help you with your booking or any questions about our treatments.</p>
                    <button className="w-full bg-[#CBFF38] hover:bg-lime-600 text-black font-black uppercase tracking-widest py-4 rounded-xl shadow-lg transition-transform active:scale-95">Start Chat Now</button>
                </Card>
            </div>
        </section>
    );
};
