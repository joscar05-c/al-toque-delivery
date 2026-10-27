import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Términos, Políticas y Condiciones | Al Toque Delivery",
  description:
    "Centro de términos, condiciones de servicio, políticas de privacidad y gestión de datos de Al Toque Delivery para usuarios, restaurantes y repartidores.",
};

export default function PoliticasHubPage() {
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
              Al Toque <span className="text-slate-900 font-bold text-sm">Políticas</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold">
            <Link
              href="/"
              className="px-4 py-1.5 rounded-full bg-[#0404fc] text-white hover:bg-[#0303cb] transition-colors shadow-sm"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
        {/* Hero */}
        <div className="text-center sm:text-left bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4e687] text-[#3f0791] text-xs font-black uppercase tracking-wider">
              Centro Legal y de Transparencia
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Términos, Políticas y Privacidad
            </h1>
            <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
              Consulta todas nuestras directrices legales, derechos del consumidor, tratamiento de información confidencial y procedimiento para la eliminación de cuenta en <strong>Al Toque Delivery</strong>.
            </p>
          </div>
        </div>

        {/* Quick Links Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            href="/politica-de-privacidad"
            className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-[#0404fc] hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0404fc] flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                🔒
              </div>
              <h2 className="font-extrabold text-slate-900 text-lg group-hover:text-[#0404fc] transition-colors">
                Política de Privacidad
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Descubre cómo recopilamos, usamos y resguardamos tus datos personales, ubicación GPS y no uso de identificador de publicidad.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-[#0404fc] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Leer política completa &rarr;
            </span>
          </Link>

          <Link
            href="/eliminar-cuenta"
            className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-red-500 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                🗑️
              </div>
              <h2 className="font-extrabold text-slate-900 text-lg group-hover:text-red-600 transition-colors">
                Eliminación de Cuenta y Datos
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instrucciones para eliminar tu cuenta desde la app o formulario web directo si ya desinstalaste la aplicación.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-red-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Gestionar o solicitar baja &rarr;
            </span>
          </Link>
        </div>

        {/* General Terms of Service Summary */}
        <div id="terminos" className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 space-y-6 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-2xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">
            Términos y Condiciones Generales de Uso
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1">1. Objeto y Naturaleza del Servicio</h3>
              <p className="text-xs sm:text-sm">
                Al Toque Delivery es una plataforma tecnológica que facilita el contacto entre consumidores finales, restaurantes locales aliados y repartidores independientes en las ciudades de Bagua Grande, Jaén y Chachapoyas. Los restaurantes son los únicos responsables de la elaboración, calidad, empaque e inocuidad de sus alimentos.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1">2. Registro de Usuarios y Cuentas</h3>
              <p className="text-xs sm:text-sm">
                Para realizar pedidos, los usuarios deben registrar un número de teléfono celular válido y verificable mediante SMS. El usuario es responsable de salvaguardar su acceso y no compartir códigos de verificación.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1">3. Precios, Envíos y Métodos de Pago</h3>
              <p className="text-xs sm:text-sm">
                Los precios de los platos son definidos directamente por cada restaurante. Las tarifas de envío se calculan en base a la distancia entre el local y la dirección de entrega del cliente. Los métodos de pago aceptados son Efectivo al recibir, Yape, Plin y Tarjetas de débito o crédito según la disponibilidad del establecimiento.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1">4. Cancelaciones y Reclamos</h3>
              <p className="text-xs sm:text-sm">
                Un pedido puede ser cancelado antes de que el restaurante inicie su preparación. Ante cualquier inconveniente con productos dañados, faltantes o retrasos injustificados, el usuario puede comunicarse inmediatamente con nuestro canal de soporte para gestionar el reembolso o reemplazo correspondiente.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1">5. Contacto y Atención de Quejas</h3>
              <p className="text-xs sm:text-sm">
                Cualquier duda, sugerencia o reclamo puede ser canalizado a través de nuestro correo oficial <a href="mailto:contacto@altoquedelivery.com" className="text-[#0404fc] underline font-semibold">contacto@altoquedelivery.com</a> o por WhatsApp al +51 987 654 321.
              </p>
            </div>
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
            <Link href="/eliminar-cuenta" className="hover:text-red-400 transition-colors">Eliminar Cuenta</Link>
            <span>•</span>
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
