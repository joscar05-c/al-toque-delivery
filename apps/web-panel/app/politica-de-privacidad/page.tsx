import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Política de Privacidad | Al Toque Delivery",
  description:
    "Conoce cómo Al Toque Delivery recopila, utiliza y protege tus datos personales y de ubicación conforme a las normativas vigentes y políticas de Google Play.",
};

export default function PoliticaPrivacidadPage() {
  const lastUpdated = "24 de Octubre de 2026";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header / Navbar */}
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
              Al Toque <span className="text-slate-900 font-bold text-sm">Legal</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold">
            <Link
              href="/eliminar-cuenta"
              className="px-3.5 py-1.5 rounded-full text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-all"
            >
              Eliminar Cuenta
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
        <div className="mb-10 text-center sm:text-left bg-gradient-to-r from-blue-900 via-indigo-900 to-[#3f0aa9] text-white rounded-3xl p-8 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4e687] text-[#3f0791] text-xs font-black uppercase tracking-wider">
              Documento Oficial
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Política de Privacidad
            </h1>
            <p className="text-blue-100 text-sm max-w-2xl">
              En <strong className="text-white">Al Toque Delivery</strong> nos tomamos muy en serio la seguridad, privacidad y transparencia en el tratamiento de tus datos personales.
            </p>
            <p className="text-xs text-blue-200 pt-2 border-t border-blue-400/30">
              Última actualización: {lastUpdated} • Vigente para App Android, iOS y Plataforma Web.
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-8 text-sm leading-relaxed text-slate-700">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-[#0404fc] text-xs font-black">1</span>
              Responsable del Tratamiento
            </h2>
            <p>
              La plataforma <strong>Al Toque Delivery</strong> (en adelante, &quot;la Aplicación&quot;, &quot;nosotros&quot; o &quot;la Plataforma&quot;) es un servicio tecnológico de intermediación para la compra, venta y entrega a domicilio de alimentos y productos en las ciudades de <strong>Bagua Grande, Jaén y Chachapoyas</strong> (Perú).
            </p>
            <p>
              Para cualquier consulta o solicitud sobre la protección de tus datos personales, puedes contactar a nuestro equipo de privacidad en:
            </p>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs sm:text-sm space-y-1">
              <p><strong>Correo electrónico de privacidad:</strong> <a href="mailto:contacto@altoquedelivery.com" className="text-[#0404fc] underline">contacto@altoquedelivery.com</a></p>
              <p><strong>Soporte WhatsApp:</strong> +51 987 654 321</p>
              <p><strong>Ámbito territorial:</strong> Amazonas y Cajamarca, República del Perú.</p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-[#0404fc] text-xs font-black">2</span>
              Datos Personales que Recopilamos
            </h2>
            <p>
              Recopilamos únicamente los datos necesarios y pertinentes para prestar de forma óptima el servicio de delivery:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Datos de Registro y Contacto:</strong> Nombre completo, número de teléfono celular (utilizado para autenticación mediante código SMS OTP) y dirección de correo electrónico (opcional o de perfil).
              </li>
              <li>
                <strong>Datos de Ubicación (GPS):</strong> Coordenadas geográficas exactas y direcciones de entrega ingresadas o seleccionadas en el mapa. Estos datos son imprescindibles para calcular la tarifa de envío, mostrar los restaurantes cercanos y permitir al repartidor llegar a tu domicilio.
              </li>
              <li>
                <strong>Datos de Ubicación de Repartidores (Drivers):</strong> En el caso de usuarios registrados como repartidores, la app recopila su ubicación en primer y segundo plano durante los turnos activos de entrega para informar en tiempo real al cliente la posición de su pedido.
              </li>
              <li>
                <strong>Historial de Pedidos y Transacciones:</strong> Detalle de productos solicitados, montos de compra, restaurante emisor, fecha y método de pago seleccionado (Efectivo, Yape, Plin o Tarjeta). <em>Nota: No almacenamos números completos de tarjetas de crédito o débito ni códigos CVV.</em>
              </li>
              <li>
                <strong>Datos Técnicos y de Diagnóstico:</strong> Modelo de dispositivo, versión del sistema operativo, registros de fallos (crash reports) y tokens de notificaciones push de Firebase (FCM).
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-[#0404fc] text-xs font-black">3</span>
              Finalidad del Uso de la Información
            </h2>
            <p>Tus datos son procesados exclusivamente con los siguientes propósitos:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">Operación del Delivery</h3>
                <p className="text-xs text-slate-600">Transmitir el pedido al restaurante asociado y coordinar la ruta de entrega directa con el conductor asignado.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">Autenticación Segura</h3>
                <p className="text-xs text-slate-600">Verificar tu identidad mediante código SMS a través de Firebase Authentication para evitar accesos no autorizados.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">Notificaciones en Tiempo Real</h3>
                <p className="text-xs text-slate-600">Avisarte cuando tu pedido sea aceptado, preparado, enviado o esté llegando a tu puerta.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">Atención al Cliente</h3>
                <p className="text-xs text-slate-600">Resolver dudas, reclamos o cancelaciones de forma rápida a través de nuestros canales de soporte.</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-[#0404fc] text-xs font-black">4</span>
              ID de Publicidad y Declaración de Publicidad
            </h2>
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80 text-amber-900">
              <p className="font-semibold mb-1">Declaración explícita sobre el Identificador de Publicidad (AD_ID):</p>
              <p className="text-xs leading-relaxed">
                <strong>Al Toque Delivery NO utiliza el Identificador de Publicidad de Google (AD_ID)</strong> ni rastrea a los usuarios con fines de publicidad segmentada de terceros o redes de anuncios externas (como AdMob o Facebook Ads). El identificador del dispositivo no es compartido con redes publicitarias.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-[#0404fc] text-xs font-black">5</span>
              Proveedores de Servicios y Terceros de Confianza
            </h2>
            <p>
              Para brindar el servicio, compartimos datos estrictamente necesarios con proveedores de infraestructura tecnológica de primer nivel que cumplen con rigurosos estándares de seguridad y protección de datos:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Google Maps Platform (Google LLC):</strong> Visualización interactiva de mapas, búsqueda de direcciones y cálculo de rutas de entrega.</li>
              <li><strong>Firebase (Google LLC):</strong> Verificación telefónica vía SMS y servicio de mensajería Cloud Messaging para notificaciones push.</li>
              <li><strong>Supabase Inc.:</strong> Base de datos segura alojada en la nube con encriptación en tránsito y en reposo.</li>
              <li><strong>Restaurantes y Repartidores Afiliados:</strong> Únicamente reciben tu nombre, teléfono y dirección de entrega mientras la orden está en curso para entregar tu pedido.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-[#0404fc] text-xs font-black">6</span>
              Eliminación de Cuenta y Retención de Datos
            </h2>
            <p>
              Reconocemos plenamente tu derecho a decidir sobre tu información personal. Puedes solicitar la <strong>eliminación total y definitiva</strong> de tu cuenta y datos asociados en cualquier momento:
            </p>
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-950 space-y-2">
              <p className="font-semibold text-xs sm:text-sm">¿Cómo solicitar la eliminación?</p>
              <p className="text-xs">
                1. <strong>Desde la aplicación móvil:</strong> Ingresa a la pestaña <em>Perfil</em> &rarr; <em>Editar Datos</em> o menú de cuenta &rarr; selecciona <em>&quot;Eliminar mi cuenta&quot;</em>.
              </p>
              <p className="text-xs">
                2. <strong>Sin necesidad de instalar la app:</strong> Puedes ingresar directamente a nuestra página web oficial de eliminación en:
              </p>
              <div className="pt-1">
                <Link
                  href="/eliminar-cuenta"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-colors"
                >
                  Ir a la Página de Eliminación de Cuenta &rarr;
                </Link>
              </div>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              * Al eliminarse tu cuenta, se borran inmediatamente tus credenciales, números de teléfono, direcciones guardadas y tokens de dispositivo. Ciertos registros de comprobantes o transacciones contables pasadas pueden conservarse de manera anonimizada por el periodo legalmente requerido por la legislación tributaria peruana (SUNAT).
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-[#0404fc] text-xs font-black">7</span>
              Seguridad de la Información
            </h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos contra el acceso no autorizado, alteración o pérdida:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cifrado de extremo a extremo en transferencias mediante protocolo HTTPS/TLS.</li>
              <li>Políticas de seguridad de nivel de fila (Row Level Security - RLS) en la base de datos para que ningún usuario pueda leer los datos de otro.</li>
              <li>Acceso restringido únicamente al personal autorizado para labores técnicas o de soporte.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-[#0404fc] text-xs font-black">8</span>
              Cambios a esta Política
            </h2>
            <p>
              Nos reservamos el derecho de actualizar esta Política de Privacidad para reflejar mejoras en la plataforma o cambios normativos. Cualquier modificación sustancial será informada a través de la aplicación o publicada en esta página web con la fecha de revisión actualizada.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 border-t border-slate-800 text-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Al Toque Delivery. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/politicas" className="hover:text-white transition-colors">Términos y Políticas</Link>
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
