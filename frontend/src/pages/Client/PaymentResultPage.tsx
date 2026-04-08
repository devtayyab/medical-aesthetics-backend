import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { css } from '@emotion/css';

const container = css`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  padding: 24px;
`;

const card = css`
  background: white;
  border-radius: 24px;
  padding: 48px 40px;
  text-align: center;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
`;

const iconWrap = css`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
`;

const successIcon = css`
  background: #dcfce7;
`;

const failureIcon = css`
  background: #fee2e2;
`;

const title = css`
  font-size: 26px;
  font-weight: 800;
  color: #111;
  margin-bottom: 12px;
`;

const subtitle = css`
  font-size: 15px;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 32px;
`;

const btn = css`
  display: inline-block;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  margin: 6px;
`;

const primaryBtn = css`
  background: #cbff38;
  color: #111;
  &:hover { background: #b8e832; transform: translateY(-1px); }
`;

const secondaryBtn = css`
  background: #f3f4f6;
  color: #374151;
  &:hover { background: #e5e7eb; }
`;

export const PaymentResultPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'success' | 'failure' | 'verifying'>('verifying');

    useEffect(() => {
        // Check URL params from Viva Wallet redirect
        // Success: /payment/result?t={transactionId}&s={orderCode}&paid=true
        // Failure: /payment/result?failure=true
        const transactionId = searchParams.get('t');
        const orderCode = searchParams.get('s');
        const isPaid = searchParams.get('paid') === 'true';
        const isFailure = searchParams.get('failure') === 'true';
        const aptId = searchParams.get('appointmentId');
        console.log('[PaymentResult] appointmentId:', aptId);

        if (isFailure) {
            setStatus('failure');
            return;
        }

        if (transactionId || isPaid || orderCode) {
            setStatus('success');
        } else {
            setStatus('failure');
        }
    }, [searchParams]);

    if (status === 'verifying') {
        return (
            <div className={container}>
                <div className={card}>
                    <p style={{ fontSize: 16, color: '#6b7280' }}>Verifying your payment...</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className={container}>
                <div className={card}>
                    <div className={`${iconWrap} ${successIcon}`}>âœ…</div>
                    <h1 className={title}>Payment Successful!</h1>
                    <p className={subtitle}>
                        Your appointment has been confirmed and payment received.
                        You will receive an email confirmation shortly.
                    </p>
                    <div>
                        <button className={`${btn} ${primaryBtn}`} onClick={() => navigate('/appointments')}>
                            View My Appointments
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={css`
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
      padding: 24px;
    `}>
            <div className={card}>
                <div className={`${iconWrap} ${failureIcon}`}>âŒ</div>
                <h1 className={title}>Payment Not Completed</h1>
                <p className={subtitle}>
                    Your payment was not processed. Your appointment reservation may still be active for a short time.
                    Please try again or choose a different payment method.
                </p>
                <div>
                    <button className={`${btn} ${primaryBtn}`} onClick={() => navigate('/appointments')}>
                        My Appointments
                    </button>
                    <button className={`${btn} ${secondaryBtn}`} onClick={() => navigate('/search')}>
                        Browse Services
                    </button>
                </div>
            </div>
        </div>
    );
};
