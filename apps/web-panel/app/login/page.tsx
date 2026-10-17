'use client';

import type { ConfirmationResult } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState, useCallback, memo } from 'react';

import {
  confirmPhoneCode,
  startPhoneVerification,
} from '@/utils/firebase/auth-client';

import { createSessionAction } from './actions';

// Constantes hoisted para evitar recreación en cada render
const COUNTRY_CODE = '+51';
const PHONE_LENGTH = 9;
const OTP_LENGTH = 6;
const RECAPTCHA_CONTAINER_ID = 'recaptcha-container';

// Componente memoizado para el contenedor estático de reCAPTCHA
const RecaptchaContainer = memo(() => (
  <div id={RECAPTCHA_CONTAINER_ID} aria-hidden="true" />
));
RecaptchaContainer.displayName = 'RecaptchaContainer';

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [digits, setDigits] = useState('');
  const [otp, setOtp] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Functional setState para evitar closures obsoletas
  const handleDigitsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, PHONE_LENGTH);
    setDigits(value);
  }, []);

  const handleOtpChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(value);
  }, []);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (digits.length !== PHONE_LENGTH) {
      setError(`Ingresa los ${PHONE_LENGTH} dígitos de tu celular.`);
      return;
    }

    const fullPhone = `${COUNTRY_CODE}${digits}`;
    setLoading(true);
    try {
      const result = await startPhoneVerification(fullPhone);
      setConfirmation(result);
      setPhone(fullPhone);
      setStep('otp');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo enviar el código.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (otp.length !== OTP_LENGTH) {
      setError(`Ingresa los ${OTP_LENGTH} dígitos del código.`);
      return;
    }
    if (!confirmation) {
      setError('Sesión expirada. Solicita un nuevo código.');
      setStep('phone');
      return;
    }

    setLoading(true);
    try {
      const idToken = await confirmPhoneCode(confirmation, otp);
      const result = await createSessionAction(idToken);

      if (result.error) {
        setError(result.error);
        setStep('phone');
        return;
      }

      router.push('/dashboard-redirect');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Código incorrecto. Inténtalo de nuevo.',
      );
      setOtp('');
    } finally {
      setLoading(false);
    }
  }

  const handleBackToPhone = useCallback(() => {
    setStep('phone');
    setOtp('');
    setConfirmation(null);
    setError(null);
  }, []);

  return (
    <main 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ 
        background: 'var(--canvas)',
        animation: 'fadeIn 0.4s ease-out',
      }}
    >
      <div 
        className="max-w-md w-full"
        style={{
          animation: 'slideUp 0.5s ease-out',
        }}
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ 
              background: 'var(--brand)',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)',
            }}
          >
            <svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--ink)' }}
          >
            Al Toque
          </h1>
          <p 
            className="text-sm"
            style={{ color: 'var(--ink-secondary)' }}
          >
            {step === 'phone'
              ? 'Ingresa tu celular para recibir un código por SMS'
              : `Ingresa el código enviado al ${phone}`}
          </p>
        </div>

        {/* Card */}
        <div 
          className="section-card p-8"
          style={{
            background: 'var(--surface)',
          }}
        >
          {error && (
            <div 
              className="mb-6 p-4 rounded-lg text-sm text-center"
              style={{ 
                background: 'var(--danger-soft)',
                color: 'var(--danger)',
              }}
            >
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendCode} className="space-y-6" noValidate>
              <div>
                <label htmlFor="phone" className="panel-label">
                  Número de celular
                </label>
                <div 
                  className="flex items-center rounded-lg overflow-hidden"
                  style={{ 
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface)',
                  }}
                >
                  <span 
                    className="pl-4 pr-3 py-3 text-sm font-medium border-r"
                    style={{ 
                      color: 'var(--ink-secondary)',
                      borderColor: 'var(--border)',
                      background: 'var(--surface-inset)',
                    }}
                  >
                    {COUNTRY_CODE}
                  </span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={PHONE_LENGTH}
                    required
                    placeholder="987654321"
                    disabled={loading}
                    onChange={handleDigitsChange}
                    className="flex-1 px-4 py-3 border-0 focus:outline-none"
                    style={{ 
                      color: 'var(--ink)',
                      background: 'transparent',
                      fontSize: '16px',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="panel-btn-primary w-full"
                style={{ padding: '12px 24px' }}
              >
                {loading ? 'Enviando código...' : 'Enviar código'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6" noValidate>
              <div>
                <label htmlFor="otp" className="panel-label">
                  Código de verificación
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={OTP_LENGTH}
                  required
                  placeholder="000000"
                  disabled={loading}
                  onChange={handleOtpChange}
                  className="panel-input text-center"
                  style={{ 
                    fontSize: '24px',
                    letterSpacing: '0.5em',
                    fontWeight: 600,
                    padding: '16px',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="panel-btn-primary w-full"
                style={{ padding: '12px 24px' }}
              >
                {loading ? 'Verificando...' : 'Ingresar'}
              </button>

              <button
                type="button"
                onClick={handleBackToPhone}
                className="w-full text-center text-sm transition-colors"
                style={{ 
                  color: 'var(--ink-muted)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--ink-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--ink-muted)';
                }}
              >
                Usar otro número
              </button>
            </form>
          )}
        </div>
      </div>

      {/* reCAPTCHA invisible de Firebase Phone Auth */}
      <RecaptchaContainer />
    </main>
  );
}