import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBG.svg";
import HeroImage from "@/assets/ReferralHeaderImg.jpg";
import { FaChevronRight, FaChevronDown, FaChevronUp } from "react-icons/fa6";
import type { RootState } from "@/store";
import { Input } from "@/components/atoms/Input/Input";
import { IoMdLock } from "react-icons/io";

const containerStyle = css`
  width: 100%;
  max-width: 940px;
  margin: 0 auto;
  padding: 0 16px;
`;

export const InviteFriend: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const inviteLink = `https://example.com/invite?ref=${user?.id}`;

  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const faqs = [
    {
      q: "Lorem ipsum dolor sit amet consectetur?",
      a: "Lorem ipsum dolor sit amet consectetur. Aliquam in arcu scelerisque amet lorem morbi...",
    },
    {
      q: "Lorem ipsum dolor sit amet consectetur. Eros vitae?",
      a: "Suspendisse potenti. Integer ut quam sed turpis dictum blandit in nec dui.",
    },
    {
      q: "Lorem ipsum dolor sit amet consectetur. Purus venenatis ultrices?",
      a: "Vestibulum sit amet quam in tortor mattis rhoncus ut at lacus.",
    },
    {
      q: "Lorem ipsum dolor sit amet consectetur?",
      a: "Mauris eget felis in metus varius finibus sit amet ut augue.",
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
        <div className="relative rounded-[24px] overflow-hidden mb-10">
          <img
            src={HeroImage}
            alt="Invite a friend"
            className="w-full h-[420px] object-cover"
          />
          <div className="absolute top-0 left-0 p-6 text-white">
            <h3 className="text-[64px] leading-[70px] font-bold">
              Invite a friend <br /> and earn 5$!
            </h3>
          </div>

          {/* Unlock Card */}
          <div className="md:min-w-[470px] absolute bottom-6 left-6 bg-white shadow-lg rounded-[12px] px-4 py-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="px-2 py-[5px] size-[46px] flex items-center justify-center bg-[#E7E7E7] rounded-[12px]">
                <IoMdLock size={28} className="text-[#717171]" />
              </div>
              <span>
                <p className="font-semibold text-[#33373F] mb-1">
                  Unlock your referral now!
                </p>
                <p className="text-[14px] text-[#586271]">
                  Make at least one booking to start inviting your friends
                </p>
              </span>
            </div>
            <div className="flex gap-4">
              <Input
                placeholder="Make an appointment"
                style={{ border: "1px solid #586271" }}
                fullWidth
              />
              <button className="w-[140px] px-4 py-3 rounded-[12px] border-[0.45px] border-[#203400] bg-[#CBFF38] text-[#203400] font-medium hover:bg-[#A7E52F]">
                Book Now
              </button>
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
