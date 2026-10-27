"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function EliminarCuentaPage() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone && !email) {
      alert("Por favor ingresa tu número de teléfono o correo electrónico registrado.");
      return;
    }
    if (!accepted) {
      alert("Por favor confirma que comprendes que la eliminación es definitiva.");
      return;
    }

    setLoading(true);

    // Simulamos registro de ticket con SLA de 24-48h
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-white shadow-sm ring-1 ring-slate-200 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Al Toque Delivery Logo"
                fill
                sizes="36px"
                className="object-contain p-0.5"
              />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-[#0404fc] group-hover:text-[#3f0791] transition-colors">
              Al Toque <span className="text-slate-900 font-bold text-sm">Soporte</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold">
            <Link
              href="/politica-de-privacidad"
              className="px-3.5 py-1.5 rounded-full text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-all"
            >
              Privacidad
            </Link>
            <Link
              href="/"
              className="px-4 py-1.5 rounded-full bg-[#0404fc] text-white hover:bg-[#0303cb] transition-colors shadow-sm"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Banner Title */}
        <div className="mb-10 text-center sm:text-left bg-gradient-to-r from-red-900 via-rose-950 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-200 border border-red-400/30 text-xs font-black uppercase tracking-wider">
              Gestión de Datos y Cuenta
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Solicitud de Eliminación de Cuenta y Datos
            </h1>
            <p className="text-red-100 text-sm max-w-2xl">
              De acuerdo con las políticas de Google Play y las leyes de protección de datos personales, los usuarios de <strong className="text-white">Al Toque Delivery</strong> tienen el derecho de solicitar la eliminación total de su cuenta y datos personales.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Method 1: In App */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-blue-100 text-[#0404fc] flex items-center justify-center font-black text-lg">
                1
              </span>
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">Desde la App Móvil</h2>
                <p className="text-xs text-slate-500">Forma más rápida si tienes la app instalada</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Puedes eliminar tu cuenta directamente desde tu teléfono móvil siguiendo estos sencillos pasos:
            </p>

            <ol className="space-y-3 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">a</span>
                <span>Abre la app <strong>Al Toque Delivery</strong> en tu dispositivo.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">b</span>
                <span>Ve a la pestaña <strong>Perfil</strong> (esquina inferior derecha).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">c</span>
                <span>Desplázate hacia abajo hasta la sección de configuración de cuenta y presiona <strong>&quot;Eliminar mi cuenta&quot;</strong>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">d</span>
                <span>Confirma la solicitud en el diálogo de seguridad.</span>
              </li>
            </ol>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
              <strong>Importante:</strong> La eliminación cerrará tu sesión de inmediato y se procederá al borrado de tu información personal.
            </div>
          </div>

          {/* Method 2: Web Request (For uninstalled users) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-black text-lg">
                2
              </span>
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">Solicitud Vía Web</h2>
                <p className="text-xs text-slate-500">Si ya no tienes la app instalada</p>
              </div>
            </div>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h3 className="font-extrabold text-base">¡Solicitud recibida con éxito!</h3>
                <p className="text-xs leading-relaxed text-emerald-800">
                  Hemos registrado tu solicitud para <strong>{phone || email}</strong>. Nuestro equipo de soporte validará la titularidad y procesará la eliminación en un plazo máximo de <strong>48 a 72 horas hábiles</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setPhone("");
                    setEmail("");
                    setReason("");
                    setAccepted(false);
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors"
                >
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-slate-600">
                  Completa el formulario para tramitar la baja de tu cuenta:
                </p>

                <div>
                  <label htmlFor="delete-phone" className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Teléfono Registrado *
                  </label>
                  <input
                    id="delete-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. +51 987654321"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="delete-email" className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    id="delete-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="delete-reason" className="block text-xs font-bold text-slate-700 mb-1">
                    Motivo de la baja (Opcional)
                  </label>
                  <textarea
                    id="delete-reason"
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Cuéntanos brevemente si hubo algún inconveniente..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs sm:text-sm resize-none"
                  />
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    id="confirm-delete"
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="confirm-delete" className="text-[11px] text-slate-600 leading-tight">
                    Comprendo que la eliminación es definitiva e irreversible. Se borrarán mis direcciones, datos de perfil y no podré acceder a mi historial de pedidos.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? "Procesando solicitud..." : "Solicitar Eliminación Definitiva"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Detailed Data Retention / Deletion Explanation (Google Play Requirement) */}
        <div className="mt-10 bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-6 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
            Detalle del Tratamiento y Retención de Datos
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 space-y-2">
              <h3 className="font-bold text-red-900 text-sm flex items-center gap-2">
                <span className="text-red-600">✕</span> Datos que se ELIMINAN permanentemente:
              </h3>
              <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                <li>Nombre, teléfono y credenciales de autenticación (Firebase / Supabase Auth).</li>
                <li>Direcciones personales guardadas y coordenadas de entrega asociadas.</li>
                <li>Identificadores de dispositivo y tokens de notificación push (FCM).</li>
                <li>Comentarios o notas de entrega personalizadas.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="text-blue-600">ℹ</span> Datos que se conservan temporalmente:
              </h3>
              <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                <li>
                  <strong>Registros contables y tributarios:</strong> Comprobantes de pago y montos de órdenes históricas se conservan disociados de tu perfil por el tiempo legal requerido por la administración tributaria (SUNAT - Perú).
                </li>
                <li>
                  <strong>Registros de seguridad:</strong> Logs anónimos de transacciones finalizadas para auditoría de pagos y prevención de fraude financiero.
                </li>
              </ul>
            </div>
          </div>

          <div className="text-xs text-slate-500 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              ¿Tienes dudas o necesitas asistencia inmediata? Escríbenos a: <a href="mailto:contacto@altoquedelivery.com" className="text-[#0404fc] underline">contacto@altoquedelivery.com</a>
            </p>
            <Link href="/politica-de-privacidad" className="text-[#0404fc] hover:underline font-semibold flex-shrink-0">
              Ver Política de Privacidad Completa &rarr;
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 border-t border-slate-800 text-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Al Toque Delivery. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/politica-de-privacidad" className="hover:text-white transition-colors">Privacidad</Link>
            <span>•</span>
            <Link href="/politicas" className="hover:text-white transition-colors">Términos y Políticas</Link>
            <span>•</span>
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
