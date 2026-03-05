import React, { useState } from "react";
import { Link } from "react-router-dom";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBg.svg";
import { FaChevronRight, FaGift, FaCopy } from "react-icons/fa6";
import { Card } from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";

const containerStyle = css`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
`;

export const GiftCard: React.FC = () => {
    const [amount, setAmount] = useState<number>(0);
    const [giftCardCode, setGiftCardCode] = useState<string | null>(null);
    const [isPaying, setIsPaying] = useState<boolean>(false);

    const handlePurchase = async () => {
        if (amount <= 0) return;
        setIsPaying(true);

        // Simulating API call and payment
        setTimeout(() => {
            const generatedCode = `BD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            setGiftCardCode(generatedCode);
            setIsPaying(false);
        }, 1500);
    };

    const copyToClipboard = () => {
        if (giftCardCode) {
            navigator.clipboard.writeText(giftCardCode);
            alert("Gift card code copied!");
        }
    };

    return (
        <section
            className="relative bg-cover bg-center flex items-center justify-center px-4 py-[60px]"
            style={{
                backgroundImage: `url(${LayeredBG})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div className={containerStyle}>
                {/* Breadcrumb */}
                <div className="flex items-center text-[#33373F] text-[15px] font-medium mb-1">
                    <Link to="/my-account" className="hover:text-[#405C0B] transition-colors">Account</Link>
                    <span className="px-3">
                        <FaChevronRight size={11} className="pt-[1px] text-[#767676]" />
                    </span>
                    Gift Card
                </div>

                {/* Title */}
                <h2 className="text-[#33373F] text-[30px] font-semibold mb-8">
                    Gift Cards
                </h2>

                {!giftCardCode ? (
                    <Card className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 max-w-md mx-auto">
                        <div className="flex justify-center mb-6">
                            <FaGift className="text-6xl text-lime-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 text-center mb-4">Purchase a Gift Card</h3>
                        <p className="text-gray-500 text-sm text-center mb-6">Enter an amount and pay to generate a gift card code which can be redeemed at checkout.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gift Card Amount (£)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-lime-500"
                                    placeholder="e.g. 50"
                                />
                            </div>
                            <Button
                                onClick={handlePurchase}
                                className="w-full bg-[#CBFF38] hover:bg-lime-600 text-black font-bold py-3 rounded-xl disabled:opacity-50"
                                disabled={amount <= 0 || isPaying}
                            >
                                {isPaying ? "Processing Payment..." : `Pay £${amount} and Generate Code`}
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <Card className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 max-w-md mx-auto text-center">
                        <div className="flex justify-center mb-6">
                            <FaGift className="text-6xl text-lime-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Gift Card Generated!</h3>
                        <p className="text-gray-500 text-sm mb-6">Share this code with your friend or save it for your next treatment.</p>

                        <div className="bg-gray-50 border border-dashed border-gray-400 p-4 rounded-xl mb-6 relative group">
                            <p className="text-2xl font-black text-[#1A1A1A] tracking-widest">{giftCardCode}</p>
                            <button
                                onClick={copyToClipboard}
                                className="absolute top-2 right-2 text-gray-400 hover:text-lime-600 transition-colors"
                                title="Copy code"
                            >
                                <FaCopy />
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 mb-6 italic">This code can be redeemed during checkout or on-site at any of our clinics.</p>

                        <Button
                            onClick={() => setGiftCardCode(null)}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 rounded-xl"
                        >
                            Purchase Another Gift Card
                        </Button>
                    </Card>
                )}
            </div>
        </section>
    );
};
