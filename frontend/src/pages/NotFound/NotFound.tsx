import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

/**
 * Friendly "page not found" screen (Greek first, English fallback).
 * `homePath` lets a portal send people back to its own start page.
 */
export const NotFound: React.FC<{ homePath?: string; message?: { el: string; en: string } }> = ({
  homePath,
  message,
}) => {
  const [isGreek, setIsGreek] = useState<boolean>(
    () => typeof window === "undefined" || localStorage.getItem("preferredLang") !== "en"
  );
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const handleLang = () => setIsGreek(localStorage.getItem("preferredLang") !== "en");
    window.addEventListener("storage", handleLang);
    window.addEventListener("languagechange", handleLang);
    return () => {
      window.removeEventListener("storage", handleLang);
      window.removeEventListener("languagechange", handleLang);
    };
  }, []);

  const role = user?.role || "";
  const fallbackHome =
    ["clinic_owner", "doctor", "secretariat"].includes(role)
      ? "/clinic"
      : ["admin", "SUPER_ADMIN", "manager"].includes(role)
        ? "/admin/dashboard"
        : role === "salesperson"
          ? "/crm"
          : "/";
  const target = homePath || fallbackHome;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <p className="text-6xl font-black tracking-tighter text-gray-900">404</p>
        <h1 className="mt-4 text-xl font-black uppercase tracking-tight text-gray-900">
          {isGreek ? "Η ΣΕΛΙΔΑ ΔΕΝ ΒΡΕΘΗΚΕ" : "Page not found"}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {message
            ? isGreek
              ? message.el
              : message.en
            : isGreek
              ? "Η σελίδα που ζητήσατε δεν υπάρχει ή έχει μετακινηθεί."
              : "The page you requested does not exist or has been moved."}
        </p>
        <Link
          to={target}
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#CBFF38] px-6 py-3 text-xs font-black uppercase tracking-widest text-black hover:bg-lime-400 transition-colors"
        >
          {isGreek ? "ΕΠΙΣΤΡΟΦΗ ΣΤΗΝ ΑΡΧΙΚΗ" : "Back to home"}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
