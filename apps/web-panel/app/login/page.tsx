'use client';

import type { ConfirmationResult } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useState } from 'react';
import Image from 'next/image';

import {
  confirmPhoneCode,
  startPhoneVerification,
} from '@/utils/firebase/auth-client';

import { createSessionAction } from './actions';

const COUNTRY_CODE = '+51';
const PHONE_LENGTH = 9;
const OTP_LENGTH = 6;
const RECAPTCHA_CONTAINER_ID = 'recaptcha-container';

type Step = 'phone' | 'otp';

const COLUMNS = [
  { key: 'pending', label: 'Pendiente', color: '#F59E0B', fillers: ['#7C02'] },
  { key: 'accepted', label: 'Aceptado', color: '#3B82F6', fillers: [] as string[] },
  { key: 'preparing', label: 'Preparando', color: '#EA580C', fillers: ['#B9D4', '#5E18'] },
  { key: 'ready', label: 'Listo', color: '#16A34A', fillers: ['#2A0F'] },
];

const STEP_COPY: Record<Step, { eyebrow: string; title: string; caption: string; hint: string }> = {
  phone: {
    eyebrow: 'Paso 1 de 2 · Teléfono',
    title: 'Un pedido nuevo entra a cocina',
    caption: 'Ingresa tu celular para ver la cola en vivo.',
    hint: 'Hola de nuevo',
  },
  otp: {
    eyebrow: 'Paso 2 de 2 · Código',
    title: 'Pedido aceptado',
    caption: 'Confirma el código y entra al tablero.',
    hint: 'Verifica tu número',
  },
};

const RecaptchaContainer = memo(() => (
  <div id={RECAPTCHA_CONTAINER_ID} aria-hidden="true" />
));
RecaptchaContainer.displayName = 'RecaptchaContainer';

function LoginBoard({ step }: { step: Step }) {
  const heroIndex = step === 'phone' ? 0 : 1;
  const hero = COLUMNS[heroIndex];

  return (
    <div className="relative" aria-hidden="true">
      <div className="grid grid-cols-4 gap-3">
        {COLUMNS.map((col, i) => {
          const count = col.fillers.length + (i === heroIndex ? 1 : 0);
          return (
            <div key={col.key} className="flex flex-col gap-2 min-w-0">
              <div className="flex h-8 items-center justify-between px-1">
                <span
                  className="truncate text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: col.color }}
                >
                  {col.label}
                </span>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {count}
                </span>
              </div>

              {i !== heroIndex && (
                <div
                  className="h-16 rounded-lg"
                  style={{ border: '1px dashed rgba(255,255,255,0.12)' }}
                />
              )}

              {col.fillers.map((id) => (
                <div
                  key={id}
                  className="hidden h-14 rounded-lg px-3 py-2 lg:block"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderLeft: `3px solid ${col.color}`,
                  }}
                >
                  <div
                    className="font-mono text-[11px]"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    {id}
                  </div>
                  <div
                    className="mt-2 h-1.5 w-2/3 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.12)' }}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div
        className="login-hero absolute left-0 top-10 flex h-16 flex-col justify-between rounded-lg px-2.5 py-2"
        style={{
          width: 'calc((100% - 36px) / 4)',
          background: 'var(--surface)',
          borderLeft: `3px solid ${hero.color}`,
          boxShadow: `0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px ${hero.color}55`,
          transform: `translateX(calc(${heroIndex} * (100% + 12px)))`,
        }}
      >
        <span
          className="font-mono text-[10px]"
          style={{ color: 'var(--ink-muted)' }}
        >
          #A7K2
        </span>
        <span
          className="text-[11px] font-semibold"
          style={{ color: hero.color }}
        >
          {step === 'phone' ? 'Nuevo' : 'Aceptado'}
        </span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('phone');
  const [digits, setDigits] = useState('');
  const [otp, setOtp] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDigitsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDigits(e.target.value.replace(/\D/g, '').slice(0, PHONE_LENGTH));
  }, []);

  const handleOtpChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH));
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

  const copy = STEP_COPY[step];

  return (
    <div className="flex min-h-screen flex-col lg:flex-row" style={{ background: 'var(--canvas)' }}>
      <aside
        className="flex flex-col justify-between gap-8 px-6 py-6 lg:w-[52%] lg:min-h-screen lg:px-12 lg:py-12"
        style={{ background: 'var(--surface-sidebar)' }}
        aria-hidden="true"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white shadow-sm flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Al Toque"
              fill
              sizes="40px"
              className="object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--ink-on-dark)' }}>Al Toque</p>
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--ink-muted-on-dark)' }}>
              Panel de operaciones
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl">
          <LoginBoard step={step} />
        </div>

        <div className="mx-auto w-full max-w-xl" key={step} style={{ animation: 'fadeIn 0.35s ease-out' }}>
          <p className="text-lg font-semibold" style={{ color: 'var(--ink-on-dark)' }}>
            {copy.title}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-muted-on-dark)' }}>
            {copy.caption}
          </p>
          <div className="mt-5 flex items-center gap-2">
            <span
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: step === 'phone' ? 24 : 6, background: step === 'phone' ? 'var(--brand-on-dark)' : 'rgba(255,255,255,0.2)' }}
            />
            <span
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: step === 'otp' ? 24 : 6, background: step === 'otp' ? 'var(--brand-on-dark)' : 'rgba(255,255,255,0.2)' }}
            />
          </div>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-5 py-10 lg:px-12">
        <div className="w-full max-w-sm" style={{ animation: 'slideUp 0.5s ease-out' }}>
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--brand)' }}>
              {copy.eyebrow}
            </p>
            <h1 className="page-title mt-2">{copy.hint}</h1>
            <p className="page-subtitle">
              {step === 'phone'
                ? 'Ingresa tu celular para recibir un código por SMS'
                : `Ingresa el código enviado al ${phone}`}
            </p>
          </div>

          <div className="section-card p-6">
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-lg p-3 text-center text-sm"
                style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
              >
                {error}
              </div>
            )}

            {step === 'phone' ? (
              <form onSubmit={handleSendCode} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="phone" className="panel-label">
                    Número de celular
                  </label>
                  <div className="login-phone">
                    <span
                      className="border-r px-4 py-3 text-sm font-medium"
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
                      className="flex-1 border-0 bg-transparent px-4 py-3 focus:outline-none"
                      style={{
                        color: 'var(--ink)',
                        fontSize: '16px',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="panel-btn-primary w-full" style={{ padding: '12px 24px' }}>
                  {loading ? 'Enviando código...' : 'Enviar código'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-5" noValidate>
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

                <button type="submit" disabled={loading} className="panel-btn-primary w-full" style={{ padding: '12px 24px' }}>
                  {loading ? 'Verificando...' : 'Ingresar'}
                </button>

                <button
                  type="button"
                  onClick={handleBackToPhone}
                  className="w-full text-center text-sm transition-colors"
                  style={{ color: 'var(--ink-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink-secondary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-muted)'; }}
                >
                  Usar otro número
                </button>
              </form>
            )}
          </div>
        </div>

        <RecaptchaContainer />
      </main>
    </div>
  );
}
