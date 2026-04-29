import React, { useState } from "react";
import { Link } from "react-router-dom";
import { css } from "@emotion/css";
import { Gift, Copy, CheckCircle, ChevronRight, ArrowRight, Sparkles, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// Use the user's provided green banner image for the gift card hero section
import HeroBg from "@/assets/giftcard_bg.png";

const sectionStyles = css`
  min-height: 100vh;
  background: radial-gradient(circle at top right, rgba(203, 255, 56, 0.05), transparent), #FFFFFF;
`;

const heroSection = css`
  position: relative;
  height: 520px;
  width: 100%;
  display: flex;
  align-items: center;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, rgba(255,255,255,0.7) 0%, transparent 40%);
    z-index: 1;
  }
`;

const glassCard = css`
  background: white;
  border-radius: 40px;
  box-shadow: 0 50px 100px rgba(0, 0, 0, 0.04);
  border: 1px solid #F1F5F9;
  width: 100%;
  max-width: 1100px;
  margin: -140px auto 60px;
  position: relative;
  z-index: 10;
  overflow: hidden;
`;

const giftInput = css`
  background: #F8FAFC;
  border-radius: 20px;
  padding: 0 32px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #F1F5F9;
  transition: all 0.3s ease;
  
  &:focus-within {
    background: white;
    border-color: #CBFF38;
    box-shadow: 0 10px 30px rgba(203, 255, 56, 0.1);
  }
`;

const voucherStyle = css`
  background: #1A1A1A;
  color: white;
  border-radius: 32px;
  padding: 48px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.25);

  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 40px;
    height: 40px;
    background: white;
    border-radius: 50%;
    transform: translateY(-50%);
    z-index: 2;
  }
  &::before { left: -20px; }
  &::after { right: -20px; }
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
      toast.success("Voucher generated successfully!");
    }, 1500);
  };

  const copyToClipboard = () => {
    if (giftCardCode) {
      navigator.clipboard.writeText(giftCardCode);
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={sectionStyles}>
      {/* Immersive Hero */}
      <div className={heroSection}>
        <div className="absolute inset-0 z-0 bg-white">
          <img
            src={HeroBg}
            style={{ objectPosition: 'center 40%' }}
            className="w-full h-full object-cover opacity-70"
            alt="Voucher Hero"
          />
        </div>

        <div className="container mx-auto px-8 relative z-10">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6 text-gray-400 text-[11px] font-black uppercase tracking-[0.2em] italic">
              <Link to="/my-account" className="text-gray-900 border-b border-gray-900 pb-0.5">ACCOUNT</Link>
              <ChevronRight size={12} className="text-lime-500" />
              <span className="text-lime-500">GIFT VOUCHERS</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none text-gray-900">
              BEAUTY GIFT <span className="text-[#CBFF38]">CARDS</span>
            </h1>

            <p className="text-gray-500 mt-6 font-bold text-lg max-w-lg leading-relaxed italic">
              Give the gift of excellence with a digital gift card instantly and elevate someone's confidence.
            </p>
          </div>
        </div>
      </div>

      <div className="px-8">
        <AnimatePresence mode="wait">
          {!giftCardCode ? (
            <motion.div
              key="purchase"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={glassCard}
            >
              {/* Card Header matching mockup */}
              <div className="px-10 py-6 border-b border-gray-50 bg-gray-50/20 flex items-center gap-3">
                <Gift className="text-lime-500" size={18} />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">GIFTS S4-P098G <span className="text-lime-500/50">· 1160</span></span>
              </div>

              <div className="flex flex-col lg:flex-row">
                <div className="flex-1 p-10 lg:p-16">
                  <h3 className="text-2xl font-black uppercase italic text-gray-900 tracking-tight leading-none mb-12">Purchase Gift Card</h3>

                  <div className="space-y-8">
                    <div className={giftInput}>
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-2xl font-black text-gray-900">€</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(Number(e.target.value))}
                          className="bg-transparent text-2xl font-black outline-none w-full tabular-nums"
                          placeholder="50"
                        />
                      </div>
                      <span className="text-2xl font-black text-[#CBFF38] opacity-60">€ {amount}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {[25, 100, 50, 150].map(val => (
                        <button
                          key={val}
                          onClick={() => setAmount(val)}
                          className={`h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${amount === val ? 'bg-black text-[#CBFF38]' : 'bg-gray-100 text-gray-400 hover:text-black hover:bg-gray-200'}`}
                        >
                          €{val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-[420px] p-8">
                  <div className="bg-[#CBFF38] rounded-[32px] p-10 h-full flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                    <div>
                      <div className="size-14 rounded-2xl bg-black flex items-center justify-center text-[#CBFF38] mb-8">
                        <Gift size={28} />
                      </div>
                      <h4 className="text-2xl font-black uppercase italic leading-tight tracking-[0.02em] text-gray-900">GIFT <br />EXCELLENCE</h4>
                      <div className="w-full h-px bg-black/10 my-6" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Digital Delivery</p>
                    </div>

                    <div className="mt-12">
                      <button
                        onClick={handlePurchase}
                        disabled={amount <= 0 || isPaying}
                        className="w-full bg-black/10 hover:bg-black/20 text-black/80 h-16 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all"
                      >
                        {isPaying ? (
                          <div className="size-5 border-2 border-black/40 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>CHECKOUT € {amount}</>
                        )}
                      </button>
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
              className="max-w-3xl mx-auto"
            >
              <div className={voucherStyle}>
                {/* Decorative Patterns */}
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Sparkles size={120} />
                </div>

                <div className="flex justify-between items-start mb-16 relative z-10">
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#CBFF38] italic mb-3">DIGITAL BEAUTY VOUCHER</h3>
                    <h4 className="text-6xl font-black uppercase italic tracking-tighter leading-none">Value €{amount}</h4>
                  </div>
                  <div className="size-20 rounded-3xl bg-[#CBFF38] flex items-center justify-center text-black shadow-xl shadow-lime-500/20">
                    <CheckCircle size={40} />
                  </div>
                </div>

                <div className="border-2 border-dashed border-white/10 pt-10 pb-10 text-center bg-white/5 rounded-3xl relative z-10">
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-6 italic">Secure Voucher Code</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 px-10">
                    <span className="text-5xl font-black tracking-[0.25em] text-white tabular-nums">{giftCardCode}</span>
                    <button
                      onClick={copyToClipboard}
                      className={`h-16 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase text-[10px] tracking-widest ${copied ? 'bg-[#CBFF38] text-black shadow-xl shadow-lime-500/20' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    >
                      {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                      {copied ? "COPIED" : "COPY CODE"}
                    </button>
                  </div>
                </div>

                <div className="mt-16 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-10 relative z-10">
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 max-w-[350px] leading-relaxed italic">
                      THIS DIGITAL VOUCHER IS REDEEMABLE FOR ALL TREATMENTS AND SERVICES AT ANY CLINIC WITHIN THE BEAUTIDOC NETWORK.
                    </p>
                  </div>
                  <div className="text-center sm:text-right border-l-2 border-[#CBFF38] pl-6 py-2">
                    <p className="text-[11px] font-black uppercase italic tracking-widest text-[#CBFF38]">Powered by Beautidoc</p>
                    <p className="text-[10px] font-bold text-gray-600 mt-1">Verification Required at Checkout</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setGiftCardCode(null)}
                  className="flex-1 h-18 py-6 bg-black text-[#CBFF38] rounded-[24px] text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-900 transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  <CreditCard size={18} /> Purchase Another
                </button>
                <Link to="/my-account" className="flex-1 h-18 py-6 bg-white border-2 border-gray-100 flex items-center justify-center rounded-[24px] text-xs font-black uppercase tracking-[0.2em] hover:border-black transition-all group">
                  Back to Dashboard <ChevronRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
