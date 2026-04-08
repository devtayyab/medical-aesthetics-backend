import React, { useState } from "react";
import { Link } from "react-router-dom";
import { css } from "@emotion/css";
import { FaChevronRight, FaGift, FaCopy, FaCircleCheck } from "react-icons/fa6";
import { Button } from "@/components/atoms/Button/Button";
import { motion, AnimatePresence } from "framer-motion";

const sectionStyles = css`
  min-height: 100vh;
  background: #FDFDFD;
  background-image: 
    radial-gradient(at 0% 0%, rgba(203, 255, 56, 0.08) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(203, 255, 56, 0.05) 0px, transparent 50%);
  padding-bottom: 80px;
`;

const premiumCard = css`
  background: white;
  border: 1px solid rgba(241, 245, 249, 1);
  border-radius: 32px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.02);
  padding: 40px;
  position: relative;
  overflow: hidden;
`;

const voucherStyle = css`
  background: #1A1A1A;
  color: white;
  border-radius: 24px;
  padding: 40px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.3);

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: -15px;
    width: 30px;
    height: 30px;
    background: white;
    border-radius: 50%;
    transform: translateY(-50%);
    box-shadow: inset -5px 0 10px rgba(0,0,0,0.1);
  }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    right: -15px;
    width: 30px;
    height: 30px;
    background: white;
    border-radius: 50%;
    transform: translateY(-50%);
    box-shadow: inset 5px 0 10px rgba(0,0,0,0.1);
  }
`;

export const GiftCard: React.FC = () => {
    const [amount, setAmount] = useState<number>(50);
    const [giftCardCode, setGiftCardCode] = useState<string | null>(null);
    const [isPaying, setIsPaying] = useState<boolean>(false);
    const [copied, setCopied] = useState(false);

    const handlePurchase = async () => {
        if (amount <= 0) return;
        setIsPaying(true);

        setTimeout(() => {
            const generatedCode = `BD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            setGiftCardCode(generatedCode);
            setIsPaying(false);
        }, 1500);
    };

    const copyToClipboard = () => {
        if (giftCardCode) {
            navigator.clipboard.writeText(giftCardCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className={sectionStyles}>
            {/* Visual Header */}
            <div className="bg-[#1A1A1A] text-white pt-16 pb-24 px-6 relative overflow-hidden">
                <div className="max-w-4xl mx-auto relative z-10 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-4 mb-4 text-[#CBFF38] text-[10px] font-black uppercase tracking-[0.2em] italic">
                        <Link to="/my-account" className="hover:opacity-80 transition-opacity">Account</Link>
                        <FaChevronRight size={10} />
                        <span>Voucher Portal</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-tight">
                        Beauty Gift Cards
                    </h1>
                    <p className="text-gray-400 mt-2 font-medium max-w-lg mx-auto md:mx-0">
                        Give the gift of confidence. Purchase a digital voucher instantly and elevate someone's aesthetic journey.
                    </p>
                </div>
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#CBFF38]/10 to-transparent pointer-events-none" />
            </div>

            <div className="max-w-4xl mx-auto px-6 -mt-12 relative z-20">
              <AnimatePresence mode="wait">
                {!giftCardCode ? (
                    <motion.div 
                      key="purchase"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={premiumCard}
                    >
                        <div className="flex flex-col md:flex-row gap-12">
                           <div className="flex-1">
                              <h3 className="text-2xl font-black uppercase italic text-gray-900 mb-6">Purchase Voucher</h3>
                              
                              <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3 italic">Voucher Amount (€)</label>
                                    <div className="relative">
                                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black">€</span>
                                      <input
                                          type="number"
                                          value={amount}
                                          onChange={(e) => setAmount(Number(e.target.value))}
                                          className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl h-20 pl-14 pr-6 text-3xl font-black focus:border-[#CBFF38] outline-none transition-all"
                                          placeholder="50"
                                      />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                   {[25, 50, 100, 250].map(val => (
                                     <button 
                                      key={val} 
                                      onClick={() => setAmount(val)}
                                      className={`h-12 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest transition-all ${amount === val ? 'bg-black text-[#CBFF38] border-black' : 'border-gray-100 text-gray-400 hover:border-black hover:text-black'}`}
                                     >
                                       €{val}
                                     </button>
                                   ))}
                                </div>
                           </div>
                        </div>

                        <div className="w-full md:w-80">
                           <div className="bg-[#CBFF38] rounded-3xl p-8 h-full flex flex-col justify-between shadow-xl">
                              <div>
                                 <FaGift size={32} />
                                 <h4 className="text-xl font-black uppercase italic mt-4">Gift <br /> Excellence</h4>
                              </div>
                              <div className="mt-8">
                                 <p className="text-xs font-bold uppercase tracking-widest">Digital Delivery</p>
                                 <Button
                                    onClick={handlePurchase}
                                    className="w-full mt-4 bg-black text-[#CBFF38] hover:bg-gray-900 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                                    disabled={amount <= 0 || isPaying}
                                  >
                                    {isPaying ? "Processing..." : `Checkout €${amount}`}
                                  </Button>
                              </div>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                ) : (
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="max-w-2xl mx-auto"
                    >
                       <div className={voucherStyle}>
                          <div className="flex justify-between items-start mb-12">
                             <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#CBFF38] italic">Aesthetics Voucher</h3>
                                <h4 className="text-4xl font-black uppercase italic mt-2 tracking-tighter">Value €{amount}</h4>
                             </div>
                             <FaCircleCheck className="text-[#CBFF38]" size={32} />
                          </div>

                          <div className="border-t border-dashed border-white/20 pt-8 pb-8 text-center bg-white/5 rounded-2xl">
                             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Voucher Code</p>
                             <div className="flex items-center justify-center gap-4">
                                <span className="text-4xl font-black tracking-[0.2em]">{giftCardCode}</span>
                                <button 
                                  onClick={copyToClipboard}
                                  className={`size-10 rounded-xl flex items-center justify-center transition-all ${copied ? 'bg-[#CBFF38] text-black' : 'bg-white/10 hover:bg-white/20'}`}
                                >
                                   {copied ? <FaCircleCheck /> : <FaCopy />}
                                </button>
                             </div>
                          </div>

                          <div className="mt-12 flex justify-between items-end">
                             <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 max-w-[200px] leading-relaxed">THIS VOUCHER IS VALID FOR ALL TREATMENTS AND CLINICS ON THE BEAUTIDOC NETWORK.</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-black uppercase italic">Powered by Beautidoc</p>
                             </div>
                          </div>
                       </div>

                       <div className="mt-8 flex gap-4">
                           <Button 
                             onClick={() => setGiftCardCode(null)}
                             className="flex-1 h-14 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
                           >
                             Purchase Another
                           </Button>
                           <Link to="/my-account" className="flex-1 h-14 bg-white border-2 border-gray-100 flex items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-black transition-all">
                              Back to Dashboard
                           </Link>
                       </div>
                    </motion.div>
                )}
              </AnimatePresence>
            </div>
        </div>
    );
};
