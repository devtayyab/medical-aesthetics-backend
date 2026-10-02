import React from 'react';
import { ShieldCheck } from 'lucide-react';
import LayeredBG from '@/assets/layered-waves-haikei.svg';

const ProviderTerms: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-[#121212] pt-14 pb-16 sm:pt-20 sm:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={LayeredBG} alt="Background" className="w-full h-full object-cover opacity-30" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-white/10 text-[#CBFF38] mb-2 shadow-lg backdrop-blur-md">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
            Provider Terms <span className="text-[#CBFF38]">for Clinics</span>
          </h1>
          <p className="text-sm sm:text-lg text-gray-300 max-w-2xl mx-auto font-medium">
            Placeholder for Provider Terms / P2B Regulation details.
          </p>
        </div>
      </header>

      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-[800px] mx-auto bg-white p-6 sm:p-12 rounded-3xl shadow-sm border border-gray-100 text-gray-700 space-y-8">
          <div className="prose prose-sm sm:prose-base prose-lime max-w-none">
            <h2 className="text-xl font-bold text-gray-900">Provider Terms Overview (Placeholder)</h2>
            <p>
              Final legal copy will be supplied after lawyer review regarding the P2B Regulation. 
              This section will explain the main ranking criteria, any paid placement, access to data, 
              and the reasons for suspension/termination.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProviderTerms;
