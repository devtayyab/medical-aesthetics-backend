import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "@/components/atoms/Card/Card";
import { authAPI } from "@/services/api";
import { isSafeRedirect } from "@/services/client";

/** Landing page of the email verification link: /verify-email?token=...&redirect=... */
const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const redirect = searchParams.get("redirect");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setStatus("error");
      setMessage("The verification link is incomplete.");
      return;
    }
    authAPI
      .verifyEmail(token)
      .then(() => setStatus("ok"))
      .catch((err: any) => {
        setStatus("error");
        setMessage(err?.response?.data?.message || "The verification link has expired or is invalid.");
      });
  }, [token]);

  const loginHref = isSafeRedirect(redirect)
    ? `/login?redirect=${encodeURIComponent(redirect)}`
    : "/login";

  return (
    <div className="flex justify-center items-center min-h-[80vh] p-4">
      <Card className="w-full max-w-[480px] p-8 text-center">
        {status === "loading" && <p className="text-gray-600">Επιβεβαίωση email... / Verifying your email...</p>}
        {status === "ok" && (
          <>
            <h2 className="text-2xl font-bold mb-3">Το email επιβεβαιώθηκε / Email verified</h2>
            <p className="text-gray-600 mb-6">Μπορείτε τώρα να συνδεθείτε. You can now log in.</p>
            <Link to={loginHref} className="inline-block bg-[#CBFF38] text-[#33373F] font-bold px-6 py-3 rounded-xl">
              Σύνδεση / Log in
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <h2 className="text-2xl font-bold mb-3">Η επιβεβαίωση απέτυχε / Verification failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link to={loginHref} className="inline-block bg-[#CBFF38] text-[#33373F] font-bold px-6 py-3 rounded-xl">
              Σύνδεση / Log in
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Από τη σελίδα σύνδεσης μπορείτε να ζητήσετε νέο σύνδεσμο. You can request a new link from the login page.
            </p>
          </>
        )}
      </Card>
    </div>
  );
};

export default VerifyEmail;
