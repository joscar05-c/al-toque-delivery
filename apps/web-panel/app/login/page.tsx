'use client';

import type { ConfirmationResult } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  confirmPhoneCode,
  startPhoneVerification,
} from '@/utils/firebase/auth-client';

import { createSessionAction } from './actions';

const COUNTRY_CODE = '+51';
const PHONE_LENGTH = 9;
const OTP_LENGTH = 6;

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [digits, setDigits] = useState('');
  const [otp, setOtp] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Panel Web</h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'phone'
              ? 'Ingresa tu celular para recibir un código por SMS'
              : `Ingresa el código enviado al ${phone}`}
          </p>
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendCode} className="space-y-6" noValidate>
            <div>
              <label htmlFor="phone" className="sr-only">
                Celular
              </label>
              <div className="flex items-center rounded-md border border-gray-300 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                <span className="pl-3 pr-2 text-sm text-gray-500 border-r border-gray-200">
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
                  onChange={(e) =>
                    setDigits(e.target.value.replace(/\D/g, '').slice(0, PHONE_LENGTH))
                  }
                  className="appearance-none relative block w-full px-3 py-2 border-0 focus:outline-none focus:ring-0 text-gray-900 sm:text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando código...' : 'Enviar código'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-6" noValidate>
            <div>
              <label htmlFor="otp" className="sr-only">
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
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))
                }
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center tracking-[0.5em]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setOtp('');
                setConfirmation(null);
                setError(null);
              }}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
            >
              Usar otro número
            </button>
          </form>
        )}
      </div>

      {/* reCAPTCHA invisible de Firebase Phone Auth */}
      <div id="recaptcha-container" />
    </main>
  );
}