import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBg.svg";
import HeroImage from "@/assets/ReferralHeaderImg.jpg";
import { FaChevronRight, FaChevronDown, FaChevronUp } from "react-icons/fa6";
import type { RootState } from "@/store";

const containerStyle = css`
  width: 100%;
  max-width: 940px;
  margin: 0 auto;
  padding: 0 16px;
`;

export const InviteFriend: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const referralCode = (user as any)?.referralCode || "GET5NOW";
  const inviteLink = `${window.location.origin}/register?ref=${referralCode}`;

  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFAQ = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const faqs = [
    {
      q: "How do I earn the $5 bonus?",
      a: "Just share your unique referral link with your friends. When they register using your link and complete their first booking, both of you will receive $5 worth of loyalty points in your accounts.",
    },
    {
      q: "Is there a limit to how many friends I can invite?",
      a: "No! There is no limit. You can invite as many friends as you want and keep earning rewards for each one who books a treatment.",
    },
    {
      q: "When will I see the bonus in my account?",
      a: "The bonus points are automatically credited to your account as soon as your friend's first appointment is marked as completed by the clinic.",
    },
    {
      q: "Can I use the $5 for any treatment?",
      a: "Yes, you can use your loyalty points to get discounts on any treatment available on our platform.",
    },
  ];

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
          <Link
            to="/my-account"
            className="hover:text-[#405C0B] transition-colors"
          >
            Account
          </Link>
          <span className="px-3">
            <FaChevronRight size={11} className="pt-[1px] text-[#767676]" />
          </span>
          Referral Program
        </div>

        {/* Title */}
        <h2 className="text-[#33373F] text-[30px] font-semibold mb-8">
          Referral Program
        </h2>

        {/* Hero Section */}
        <div className="relative rounded-[24px] overflow-hidden mb-10 shadow-2xl">
          <img
            src={HeroImage}
            alt="Invite a friend"
            className="w-full h-[420px] object-cover filter brightness-75"
          />
          <div className="absolute top-0 left-0 p-8 text-white max-w-[600px]">
            <h3 className="text-[54px] leading-[60px] font-bold mb-4 drop-shadow-lg">
              Invite a friend <br /> and earn $5!
            </h3>
            <p className="text-xl text-gray-100 drop-shadow-md">Share the love for aesthetics and get rewarded for every friend you bring.</p>
          </div>

          {/* Referral Link Card */}
          <div className="md:min-w-[500px] absolute bottom-6 left-6 bg-white/95 backdrop-blur shadow-xl rounded-[20px] px-6 py-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="size-12 flex items-center justify-center bg-[#CBFF38]/20 rounded-xl">
                <span className="text-2xl">🎁</span>
              </div>
              <div>
                <p className="font-bold text-[#33373F] text-lg">
                  Your Referral Link
                </p>
                <p className="text-sm text-[#586271]">
                  Copy and share this link to start earning
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center overflow-hidden">
                <code className="text-sm text-[#357A7B] font-mono truncate">{inviteLink}</code>
              </div>
              <button
                onClick={copyToClipboard}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${copied
                  ? "bg-green-500 text-white"
                  : "bg-[#CBFF38] text-[#203400] hover:bg-[#A7E52F]"
                  }`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center text-sm">
              <div className="text-gray-500">
                Code: <span className="font-bold text-black font-mono">{referralCode}</span>
              </div>
              <Link to="/search" className="text-[#357A7B] font-bold hover:underline">
                Find treatments to share →
              </Link>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-10">
          <h3 className="text-[22px] font-semibold mb-6 text-[#33373F]">
            How it works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white shadow rounded-[12px] p-6 text-center">
            <div>
              <div className="text-[32px] mb-2">👥</div>
              <p className="font-semibold">Invite your friends</p>
              <p className="text-sm text-[#586271]">
                By sharing your referral link
              </p>
            </div>
            <div>
              <div className="text-[32px] mb-2">🎁</div>
              <p className="font-semibold">You get $5</p>
              <p className="text-sm text-[#586271]">
                For every friend who registers and makes a purchase
              </p>
            </div>
            <div>
              <div className="text-[32px] mb-2">💵</div>
              <p className="font-semibold">They get $5</p>
              <p className="text-sm text-[#586271]">
                To be used on their first online booking
              </p>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h3 className="text-[22px] font-semibold mb-6 text-[#33373F]">
            FAQs
          </h3>
          <div className="bg-white rounded-[12px] shadow divide-y divide-[#E5E7EB]">
            {faqs.map((faq, index) => (
              <div key={index}>
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex justify-between items-center px-6 py-4 text-left"
                >
                  <span className="font-medium text-[#33373F]">{faq.q}</span>
                  {faqOpen === index ? (
                    <FaChevronUp className="text-[#405C0B]" />
                  ) : (
                    <FaChevronDown className="text-[#586271]" />
                  )}
                </button>
                {faqOpen === index && (
                  <div className="px-6 pb-4 text-[#586271] text-sm">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="mt-4 text-sm font-medium text-[#405C0B] hover:underline">
            View All →
          </button>
        </div>
      </div>
    </section>
  );
};
