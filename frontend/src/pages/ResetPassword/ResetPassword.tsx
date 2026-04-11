import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "@/store/slices/authSlice";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Card } from "@/components/atoms/Card/Card";
import type { RootState, AppDispatch } from "@/store";
import { css } from "@emotion/css";
import { Lock, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

const containerStyle = css`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
`;

const cardStyle = css`
  width: 100%;
  max-width: 480px;
  padding: 40px;
  border-radius: 32px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
  background: white;
  z-index: 10;
`;

const headerStyle = css`
  text-align: center;
  margin-bottom: 32px;
`;

const iconContainerStyle = css`
  width: 64px;
  height: 64px;
  background: #CBFF38;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
`;

const titleStyle = css`
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
`;

const subtitleStyle = css`
  font-size: 15px;
  color: #64748b;
  font-weight: 500;
`;

const formStyle = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const errorStyle = css`
  background: #fef2f2;
  border: 1px solid #fee2e2;
  color: #ef4444;
  padding: 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
`;

export const ResetPassword: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setPasswordError("Invalid or missing reset token.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    try {
      await dispatch(resetPassword({ password, resetToken: token })).unwrap();
      setIsSuccess(true);
    } catch (err: any) {
      setPasswordError(err || "Failed to reset password. Link may be expired.");
    }
  };

  if (isSuccess) {
    return (
      <div className={containerStyle}>
        <Card className={cardStyle}>
          <div className={headerStyle}>
            <div className={iconContainerStyle} style={{ background: '#dcfce7' }}>
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className={titleStyle}>Password Reset!</h2>
            <p className={subtitleStyle}>
              Your security credentials have been updated successfully.
            </p>
          </div>
          <Button
            onClick={() => navigate("/login")}
            fullWidth
            className="h-14 rounded-[16px] bg-slate-900 text-white font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-2"
          >
            Go to Login <ArrowRight size={18} />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={containerStyle}>
      <Card className={cardStyle}>
        <div className={headerStyle}>
          <div className={iconContainerStyle}>
            <Lock className="h-8 w-8 text-slate-900" />
          </div>
          <h2 className={titleStyle}>New Password</h2>
          <p className={subtitleStyle}>Please enter a strong new password below.</p>
        </div>

        {(passwordError || error) && (
          <div className={errorStyle + " mb-6 flex items-center gap-2 justify-center"}>
            <AlertTriangle size={16} />
            {passwordError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={formStyle}>
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
            <Input
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
              }}
              fullWidth
              passwordToggle
              className="bg-slate-50 border-slate-100 h-14 rounded-[16px] text-[15px]"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
            <Input
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordError("");
              }}
              fullWidth
              passwordToggle
              className="bg-slate-50 border-slate-100 h-14 rounded-[16px] text-[15px]"
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            fullWidth
            disabled={isLoading || !token}
            className="mt-4 h-14 rounded-[16px] bg-[#CBFF38] text-slate-900 hover:bg-[#b0e625] font-black uppercase tracking-widest text-[12px]"
          >
            {isLoading ? "Updating..." : "Secure Account"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
