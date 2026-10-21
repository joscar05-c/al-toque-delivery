"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  submitPublicRestaurantApplication,
  submitPublicDriverApplication,
} from "./actions/applications";

/* ——— Dedicated SVG Icons with high fidelity & accessibility ——— */
function IconZap({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function IconBike({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="18.5" cy="17.5" r="3.5" />
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="15" cy="5" r="1" />
      <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
    </svg>
  );
}

function IconShoppingBag({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function IconClock({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconShieldCheck({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconCheckCircle({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconMapPin({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconStore({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3 3h18v4l-2 3v10a1 1 0 01-1 1H6a1 1 0 01-1-1V10L3 7V3z" />
      <path d="M9 21v-7a2 2 0 014 0v7" />
    </svg>
  );
}

function IconArrowRight({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconStar({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconFlame({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2c-.5 2-2 3.5-3.5 5.5C7 9.5 6 12 6 14.5 6 18.1 8.9 21 12.5 21s6.5-2.9 6.5-6.5c0-3-1.5-5.5-3.5-7.5C14.5 5.5 13.5 3.5 12 2z" />
    </svg>
  );
}

function IconSmartphone({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function IconCreditCard({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function IconBanknote({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

function IconChefHat({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M6 13.87A4 4 0 017.41 6a5.11 5.11 0 011.05-1.54 5 5 0 017.08 0A5.11 5.11 0 0116.59 6 4 4 0 0118 13.87V21H6v-7.13z" />
      <line x1="6" y1="17" x2="18" y2="17" />
    </svg>
  );
}

function IconBell({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function IconMenu({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconX({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconAlertCircle({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconLoader({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function IconUsers({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [selectedCity, setSelectedCity] = useState<"jaen" | "bagua" | "chachapoyas">("jaen");
  const [cashAmount, setCashAmount] = useState<number>(50);

  // Application Tabs State (Owner vs Driver)
  const [applicationTab, setApplicationTab] = useState<"restaurant" | "driver">("restaurant");

  // Restaurant application form state
  const [restBusinessName, setRestBusinessName] = useState("");
  const [restCategoryId, setRestCategoryId] = useState("b4e81a15-c533-46d8-a7af-3ed94f05af2e"); // default Pollería
  const [restCity, setRestCity] = useState<"jaen" | "bagua" | "chachapoyas" | "other">("jaen");
  const [restAddress, setRestAddress] = useState("");
  const [restPhone, setRestPhone] = useState("");
  const [restEmail, setRestEmail] = useState("");
  const [restOwnerName, setRestOwnerName] = useState("");
  const [restOwnerDni, setRestOwnerDni] = useState("");
  const [restComments, setRestComments] = useState("");
  const [restSubmitting, setRestSubmitting] = useState(false);
  const [restSuccess, setRestSuccess] = useState<string | null>(null);
  const [restError, setRestError] = useState<string | null>(null);

  // Driver application form state
  const [driverFullName, setDriverFullName] = useState("");
  const [driverDni, setDriverDni] = useState("");
  const [driverBirthDate, setDriverBirthDate] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  const [driverVehicleType, setDriverVehicleType] = useState<"motorcycle" | "bicycle" | "car">("motorcycle");
  const [driverVehiclePlate, setDriverVehiclePlate] = useState("");
  const [driverVehicleBrand, setDriverVehicleBrand] = useState("");
  const [driverVehicleModel, setDriverVehicleModel] = useState("");
  const [driverLicenseNumber, setDriverLicenseNumber] = useState("");
  const [driverEmergencyName, setDriverEmergencyName] = useState("");
  const [driverEmergencyPhone, setDriverEmergencyPhone] = useState("");
  const [driverSubmitting, setDriverSubmitting] = useState(false);
  const [driverSuccess, setDriverSuccess] = useState<string | null>(null);
  const [driverError, setDriverError] = useState<string | null>(null);

  const orderTotal = 28.5;
  const changeCalculated = Math.max(0, cashAmount - orderTotal).toFixed(2);

  const cityHighlights = {
    jaen: {
      name: "Jaén",
      subtitle: "Capital del Café y el Buen Sabor",
      spots: ["Pollería El Pardo", "Chifa Central", "Café Montegrande", "Broaster Real"],
      deliveryTime: "18–28 min",
    },
    bagua: {
      name: "Bagua Grande",
      subtitle: "Corazón Comercial de Utcubamba",
      spots: ["El Tablón Dorado", "Cevichería El Puerto", "Asador San Luis", "Pizzería Nápoles"],
      deliveryTime: "15–25 min",
    },
    chachapoyas: {
      name: "Chachapoyas",
      subtitle: "Tradición y Encanto en la Plaza",
      spots: ["Tradición Chachapoyana", "Café de los Andes", "Brasas de la Colina", "La Rustika"],
      deliveryTime: "20–30 min",
    },
  };

  const currentCityData = cityHighlights[selectedCity];

  const scrollToApplication = (tab: "restaurant" | "driver") => {
    setApplicationTab(tab);
    setMobileMenuOpen(false);
    const target = document.getElementById("unete");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleRestaurantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRestSubmitting(true);
    setRestError(null);
    setRestSuccess(null);

    const res = await submitPublicRestaurantApplication({
      businessName: restBusinessName,
      businessPhone: restPhone,
      businessEmail: restEmail || undefined,
      address: restAddress,
      city: restCity,
      categoryId: restCategoryId,
      ownerName: restOwnerName,
      ownerDni: restOwnerDni,
      additionalComments: restComments || undefined,
    });

    setRestSubmitting(false);
    if (res.error) {
      setRestError(res.error);
    } else {
      setRestSuccess(res.message || "¡Solicitud enviada con éxito!");
      setRestBusinessName("");
      setRestPhone("");
      setRestEmail("");
      setRestAddress("");
      setRestOwnerName("");
      setRestOwnerDni("");
      setRestComments("");
    }
  };

  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriverSubmitting(true);
    setDriverError(null);
    setDriverSuccess(null);

    const res = await submitPublicDriverApplication({
      fullName: driverFullName,
      dni: driverDni,
      birthDate: driverBirthDate,
      phone: driverPhone,
      email: driverEmail || undefined,
      vehicleType: driverVehicleType,
      vehiclePlate: driverVehiclePlate || undefined,
      vehicleBrand: driverVehicleBrand || undefined,
      vehicleModel: driverVehicleModel || undefined,
      licenseNumber: driverLicenseNumber || undefined,
      emergencyContactName: driverEmergencyName || undefined,
      emergencyContactPhone: driverEmergencyPhone || undefined,
    });

    setDriverSubmitting(false);
    if (res.error) {
      setDriverError(res.error);
    } else {
      setDriverSuccess(res.message || "¡Postulación enviada con éxito!");
      setDriverFullName("");
      setDriverDni("");
      setDriverBirthDate("");
      setDriverPhone("");
      setDriverEmail("");
      setDriverVehiclePlate("");
      setDriverVehicleBrand("");
      setDriverVehicleModel("");
      setDriverLicenseNumber("");
      setDriverEmergencyName("");
      setDriverEmergencyPhone("");
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] text-[#1c1917] selection:bg-[#f4e687] selection:text-[#3f0791] font-sans">
      {/* Top Announcement Bar */}
      <aside aria-label="Aviso de cobertura" className="bg-[#3f0aa9] text-[#f4e687] px-4 py-2 text-center text-xs sm:text-sm font-medium tracking-wide flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1 bg-[#f4e687] text-[#3f0791] px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
          <IconZap className="w-3 h-3 fill-current" /> Al Toque
        </span>
        <span>
          ¡Ya estamos activos en Jaén, Bagua Grande y Chachapoyas! Pide caliente o recoge sin colas.
        </span>
      </aside>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-[#faf9f5]/90 backdrop-blur-md border-b border-[#3f0aa9]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f0aa9] rounded-xl px-1"
            aria-label="Al Toque Delivery - Inicio"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#3f0aa9] text-[#f4e687] flex items-center justify-center shadow-md shadow-[#3f0aa9]/25 group-hover:scale-105 transition-transform duration-200">
              <IconZap className="w-6 h-6 fill-[#f4e687]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl tracking-tight leading-none text-[#3f0791]">
                Al Toque
              </span>
              <span className="text-[11px] font-semibold tracking-wider text-[#0404fc] uppercase">
                Delivery Local
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#1c1917]" aria-label="Navegación principal">
            <a
              href="#bento"
              className="text-[#1c1917] hover:text-[#3f0aa9] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f0aa9] rounded-md px-1 py-0.5"
            >
              Cómo funciona
            </a>
            <a
              href="#ciudades"
              className="text-[#1c1917] hover:text-[#3f0aa9] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f0aa9] rounded-md px-1 py-0.5"
            >
              Ciudades
            </a>
            <button
              type="button"
              onClick={() => scrollToApplication("restaurant")}
              className="text-[#1c1917] hover:text-[#3f0aa9] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f0aa9] rounded-md px-1 py-0.5"
            >
              Afiliar Restaurante
            </button>
            <button
              type="button"
              onClick={() => scrollToApplication("driver")}
              className="text-[#1c1917] hover:text-[#3f0aa9] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f0aa9] rounded-md px-1 py-0.5"
            >
              Ser Repartidor
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2.5 text-sm font-semibold text-[#3f0791] hover:text-[#0404fc] bg-white border border-[#3f0aa9]/20 hover:border-[#3f0aa9] rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f0aa9]"
            >
              Portal Socios & Admin
            </Link>
            <button
              type="button"
              onClick={() => scrollToApplication("restaurant")}
              className="px-5 py-2.5 text-sm font-bold text-white bg-[#3f0aa9] hover:bg-[#320786] rounded-full shadow-sm hover:shadow-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f0aa9] focus-visible:ring-offset-2 flex items-center gap-1.5"
            >
              <span>¡Únete a la Red!</span>
              <IconArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-xl text-[#3f0791] hover:bg-[#3f0aa9]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f0aa9]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú de navegación"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <IconX className="w-6 h-6" /> : <IconMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#3f0aa9]/15 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg animate-fadeIn">
            <div className="flex flex-col space-y-3 font-medium text-base">
              <a
                href="#bento"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#faf9f5] text-[#1c1917]"
              >
                Cómo funciona
              </a>
              <a
                href="#ciudades"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#faf9f5] text-[#1c1917]"
              >
                Ciudades
              </a>
              <button
                type="button"
                onClick={() => scrollToApplication("restaurant")}
                className="text-left px-3 py-2 rounded-lg hover:bg-[#faf9f5] text-[#3f0791] font-semibold"
              >
                🏪 Afiliar mi Restaurante (Owner)
              </button>
              <button
                type="button"
                onClick={() => scrollToApplication("driver")}
                className="text-left px-3 py-2 rounded-lg hover:bg-[#faf9f5] text-[#0404fc] font-semibold"
              >
                🛵 Quiero ser Repartidor (Driver)
              </button>
            </div>
            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2.5">
              <Link
                href="/login"
                className="w-full text-center px-4 py-2.5 text-sm font-semibold text-[#3f0791] bg-[#faf9f5] border border-[#3f0aa9]/20 rounded-full"
              >
                Portal Socios & Admin
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Headline and Value Proposition */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4e687] text-[#3f0791] font-bold text-xs sm:text-sm tracking-wide shadow-sm">
                  <IconFlame className="w-4 h-4 fill-current text-[#ea580c]" />
                  <span>Tu delivery norteño en minutos, sin vueltas</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold text-[#3f0791] leading-[1.08] tracking-tight text-balance">
                  Comida local calientita, entregada en tiempo récord.
                </h1>

                <p className="text-lg sm:text-xl text-[#3f0aa9]/85 max-w-2xl font-normal leading-relaxed text-pretty">
                  Conectamos los mejores pollos a la brasa, huariques de chifa, ceviches y cafés de{" "}
                  <strong className="font-bold text-[#3f0791]">Bagua Grande</strong>,{" "}
                  <strong className="font-bold text-[#3f0791]">Jaén</strong> y{" "}
                  <strong className="font-bold text-[#3f0791]">Chachapoyas</strong> directo a tu puerta o listos para recoger.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                  <a
                    href="#ciudades"
                    className="px-7 py-4 rounded-full bg-[#3f0aa9] hover:bg-[#320786] text-white font-bold text-base text-center shadow-lg shadow-[#3f0aa9]/25 hover:shadow-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f0aa9] focus-visible:ring-offset-2 flex items-center justify-center gap-2"
                  >
                    <span>Explorar Restaurantes</span>
                    <IconArrowRight className="w-5 h-5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => scrollToApplication("restaurant")}
                    className="px-6 py-4 rounded-full bg-white hover:bg-[#f4e687]/40 text-[#3f0791] border-2 border-[#3f0aa9]/20 font-bold text-base text-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f0aa9]"
                  >
                    Afiliar mi Restaurante
                  </button>
                </div>

                {/* Popular Food Category Pills */}
                <div className="pt-4 border-t border-[#3f0aa9]/15">
                  <p className="text-xs uppercase tracking-wider font-bold text-[#3f0aa9]/70 mb-2.5">
                    ¿Qué se te antoja hoy?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { emoji: "🍗", label: "Pollo a la Brasa" },
                      { emoji: "🥢", label: "Chaufa & Aeropuerto" },
                      { emoji: "🍔", label: "Hamburguesas & Broasters" },
                      { emoji: "🐟", label: "Ceviches & Chifles" },
                      { emoji: "☕", label: "Café Especial de Jaén" },
                      { emoji: "🍕", label: "Pizzas Artesanales" },
                    ].map((cat) => (
                      <span
                        key={cat.label}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#3f0aa9]/15 text-xs font-semibold text-[#1c1917] shadow-2xs hover:border-[#3f0aa9] transition-colors"
                      >
                        <span aria-hidden="true">{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Order Visual Mockup */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Decorative backdrop pill */}
                  <div className="absolute -inset-2 bg-gradient-to-tr from-[#f4e687] to-[#ceadd1]/50 rounded-[36px] blur-sm -z-10 transform -rotate-1" />

                  {/* Simulated App Card */}
                  <div className="bg-white border-2 border-[#3f0aa9]/20 rounded-[30px] p-6 shadow-xl space-y-5">
                    {/* Live Order Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#44BE70] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#44BE70]"></span>
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#44BE70]">
                          Pedido en Vivo #AT-9281
                        </span>
                      </div>
                      <span className="text-xs font-bold bg-[#f4e687] text-[#3f0791] px-2.5 py-1 rounded-full">
                        Moto en camino
                      </span>
                    </div>

                    {/* Restaurant Info */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#3f0aa9]/10 text-[#3f0791] flex items-center justify-center shrink-0">
                        <IconStore className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg font-bold text-[#1c1917] truncate">
                          Pollería El Tablón Dorado
                        </h2>
                        <div className="flex items-center gap-1.5 text-xs text-[#3f0aa9] font-medium">
                          <IconMapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>Jaén · Av. Mesones Muro</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items summary */}
                    <div className="bg-[#faf9f5] rounded-2xl p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between font-semibold text-[#1c1917]">
                        <span>1x 1/4 Pollo a la Brasa + papas nativas</span>
                        <span className="font-bold">S/ 22.00</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>1x Jarra Chicha Morada (1L)</span>
                        <span>S/ 6.50</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200/70 flex justify-between font-bold text-sm text-[#3f0791]">
                        <span>Total Pagado (Yape)</span>
                        <span className="text-[#0404fc]">S/ 28.50</span>
                      </div>
                    </div>

                    {/* Stepper Progress */}
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between text-xs font-semibold text-gray-500">
                        <span className="text-[#44BE70] font-bold">1. Aceptado</span>
                        <span className="text-[#44BE70] font-bold">2. En Cocina</span>
                        <span className="text-[#3f0791] font-bold">3. En Moto</span>
                        <span>4. Entregado</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#44BE70] via-[#0404fc] to-[#3f0aa9] h-full rounded-full w-3/4"
                          role="progressbar"
                          aria-valuenow={75}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <IconBike className="w-4 h-4 text-[#0404fc]" />
                          <span>Repartidor: Carlos M. (Honda Wave)</span>
                        </div>
                        <span className="font-extrabold text-[#3f0791] bg-[#f4e687] px-2 py-0.5 rounded-md">
                          ETA ~14 min
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENTO GRID SECTION */}
        <section id="bento" className="py-16 bg-white border-y border-[#3f0aa9]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#0404fc] bg-[#0404fc]/10 px-3.5 py-1 rounded-full">
                Diseñado para la velocidad local
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3f0791] tracking-tight">
                El sistema que hace que tu comida llegue Al Toque
              </h2>
              <p className="text-gray-600 text-base sm:text-lg">
                Combinamos tecnología ágil con la calidez y el conocimiento de cada calle y huarique de nuestras ciudades.
              </p>
            </div>

            {/* Bento Grid Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* BENTO CARD 1: Large Sunshine Yellow Card (Fulfillment Switcher: Delivery vs Recojo) */}
              <div className="lg:col-span-7 bg-[#f4e687] text-[#3f0791] rounded-[28px] p-7 sm:p-9 flex flex-col justify-between shadow-sm relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider bg-[#3f0791] text-[#f4e687] px-3 py-1 rounded-full">
                      Tú Eliges
                    </span>
                    <IconFlame className="w-5 h-5 text-[#3f0791]" />
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
                    Delivery express a tu puerta o Recojo en tienda sin hacer cola.
                  </h3>

                  <p className="text-[#3f0791]/90 text-sm sm:text-base leading-relaxed">
                    ¿Quieres que llegue directo a tu casa con motorizado, o estás cerca del local y prefieres ahorrarte el envío? Cambia de modalidad con un solo toque al ordenar.
                  </p>
                </div>

                {/* Interactive Fulfillment Preview */}
                <div className="mt-6 pt-5 border-t border-[#3f0791]/20">
                  <div className="inline-flex p-1 bg-[#3f0791]/15 rounded-full mb-4">
                    <button
                      type="button"
                      onClick={() => setFulfillmentType("delivery")}
                      className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f0791] ${
                        fulfillmentType === "delivery"
                          ? "bg-[#3f0791] text-white shadow"
                          : "text-[#3f0791] hover:bg-[#3f0791]/10"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <IconBike className="w-4 h-4" />
                        Delivery a Domicilio
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFulfillmentType("pickup")}
                      className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f0791] ${
                        fulfillmentType === "pickup"
                          ? "bg-[#3f0791] text-white shadow"
                          : "text-[#3f0791] hover:bg-[#3f0791]/10"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <IconShoppingBag className="w-4 h-4" />
                        Recojo en Tienda
                      </span>
                    </button>
                  </div>

                  <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 text-[#1c1917] space-y-2 border border-[#3f0791]/15">
                    {fulfillmentType === "delivery" ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <IconBike className="w-5 h-5 text-[#0404fc]" />
                          <span>Envío a domicilio con rastreo en vivo de la moto</span>
                        </div>
                        <span className="font-extrabold text-[#3f0791] bg-[#f4e687] px-2.5 py-1 rounded-lg">
                          Costo de envío: S/ 3.50 · 20 min
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <IconShoppingBag className="w-5 h-5 text-[#44BE70]" />
                          <span>Pasa a retirar por el mostrador, tu orden estará lista</span>
                        </div>
                        <span className="font-extrabold text-[#44BE70] bg-[#44BE70]/10 px-2.5 py-1 rounded-lg">
                          Costo de envío: S/ 0.00 (Gratis) · 12 min
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BENTO CARD 2: Fresh Mint Support Card (Payments & Change Calculator) */}
              <div className="lg:col-span-5 bg-[#44BE70] text-[#052e16] rounded-[28px] p-7 sm:p-9 flex flex-col justify-between shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider bg-[#052e16] text-[#44BE70] px-3 py-1 rounded-full">
                      Cero Complicaciones
                    </span>
                    <IconShieldCheck className="w-5 h-5 text-[#052e16]" />
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#052e16] leading-tight tracking-tight">
                    Paga con Yape, Plin, Tarjeta o Efectivo con vuelto exacto.
                  </h3>

                  <p className="text-[#052e16]/85 text-sm sm:text-base leading-relaxed">
                    Sabemos que en Jaén y Bagua el efectivo y las billeteras digitales mandan. El repartidor siempre sabe con cuánto pagarás para llevarte el sencillo justo.
                  </p>
                </div>

                {/* Micro payment simulator */}
                <div className="mt-6 pt-5 border-t border-[#052e16]/15 bg-white/90 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                    <span className="flex items-center gap-1.5">
                      <IconBanknote className="w-4 h-4 text-[#44BE70]" />
                      Calculadora de Vuelto en Efectivo:
                    </span>
                    <span className="text-gray-500 font-normal">Cuenta: S/ 28.50</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label htmlFor="cash-input" className="text-xs font-semibold text-gray-600">
                      Pagas con: S/
                    </label>
                    <input
                      id="cash-input"
                      type="number"
                      min={orderTotal}
                      step={5}
                      value={cashAmount}
                      onChange={(e) => setCashAmount(Number(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3f0aa9]"
                    />
                    <div className="text-xs font-bold text-[#052e16] ml-auto bg-[#44BE70]/20 px-2.5 py-1 rounded-md">
                      Vuelto: S/ {changeCalculated}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-bold text-gray-700">
                    <span className="px-2 py-0.5 rounded-md bg-[#742774] text-white">Yape</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#009ca6] text-white">Plin</span>
                    <span className="px-2 py-0.5 rounded-md bg-gray-800 text-white flex items-center gap-1">
                      <IconCreditCard className="w-3 h-3" /> Tarjeta POS
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#16a34a] text-white flex items-center gap-1">
                      <IconBanknote className="w-3 h-3" /> Efectivo
                    </span>
                  </div>
                </div>
              </div>

              {/* BENTO CARD 3: Electric Purple Ink Card (Realtime Tracking) */}
              <div className="lg:col-span-4 bg-[#3f0aa9] text-white rounded-[28px] p-7 sm:p-9 flex flex-col justify-between shadow-sm">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#f4e687]">
                    <IconClock className="w-6 h-6" />
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                    Seguimiento en vivo, segundo a segundo.
                  </h3>

                  <p className="text-white/80 text-sm leading-relaxed">
                    Sin incertidumbres. Sabes con exactitud cuándo el restaurante aprueba tu pedido, cuándo sale de la cocina y el punto GPS de la moto que va a tu encuentro.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/15 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#f4e687] text-[#3f0791] flex items-center justify-center font-bold text-sm">
                    ⚡
                  </div>
                  <div className="text-xs text-white/90">
                    <p className="font-bold">Notificaciones instantáneas</p>
                    <p className="text-white/65">Alertas por sonido y cambio de estado</p>
                  </div>
                </div>
              </div>

              {/* BENTO CARD 4: Lilac / Clean Surface Card (For Restaurants & Portals) */}
              <div
                id="restaurantes"
                className="lg:col-span-8 bg-[#faf9f5] border-2 border-[#3f0aa9]/15 rounded-[28px] p-7 sm:p-9 flex flex-col justify-between shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-wider bg-[#3f0aa9] text-white px-3 py-1 rounded-full">
                      Para Socios y Restaurantes
                    </span>
                    <span className="text-xs font-semibold text-[#0404fc]">
                      Flota Propia o Flota Al Toque
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#3f0791] tracking-tight">
                    ¿Tienes un local gastronómico? Digitaliza tus pedidos hoy mismo.
                  </h3>

                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                    Dile adiós a las libretas y a los mensajes perdidos de WhatsApp. Con la plataforma Al Toque recibes comandas con alerta sonora en tu pantalla de cocina, administras tu carta en vivo y gestionas tus finanzas con liquidaciones transparentes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-6 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-1">
                    <IconChefHat className="w-5 h-5 text-[#3f0aa9]" />
                    <p className="font-bold text-gray-900">Comandera en Vivo</p>
                    <p className="text-gray-500">Acepta pedidos y avisa a cocina con un clic.</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-1">
                    <IconBike className="w-5 h-5 text-[#0404fc]" />
                    <p className="font-bold text-gray-900">Libertad de Flota</p>
                    <p className="text-gray-500">Usa tus propios repartidores o la red Al Toque.</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-1">
                    <IconBell className="w-5 h-5 text-[#44BE70]" />
                    <p className="font-bold text-gray-900">Alertas de Cocina</p>
                    <p className="text-gray-500">Sonido audible cuando entra una nueva orden.</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => scrollToApplication("restaurant")}
                    className="px-6 py-3 rounded-full bg-[#3f0aa9] hover:bg-[#320786] text-white font-bold text-sm text-center shadow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f0aa9]"
                  >
                    Afiliar mi Restaurante Aquí
                  </button>
                  <Link
                    href="/login"
                    className="px-5 py-3 rounded-full bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-semibold text-sm text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f0aa9]"
                  >
                    Ya soy Socio: Iniciar Sesión
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CITY HIGHLIGHTS & LOCAL PRESENCE SECTION */}
        <section id="ciudades" className="py-16 bg-[#faf9f5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#3f0aa9] bg-[#f4e687] px-3 py-1 rounded-full">
                  Cobertura Regional
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3f0791] mt-2 tracking-tight">
                  Activos en las ciudades clave del norte
                </h2>
                <p className="text-gray-600 text-sm sm:text-base mt-1">
                  Repartidores que conocen cada barrio, jirón y avenida.
                </p>
              </div>

              {/* City selector tabs */}
              <div className="flex items-center gap-2 bg-white p-1 rounded-full border border-gray-200 shadow-2xs">
                {(["jaen", "bagua", "chachapoyas"] as const).map((cityKey) => (
                  <button
                    key={cityKey}
                    type="button"
                    onClick={() => setSelectedCity(cityKey)}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f0aa9] ${
                      selectedCity === cityKey
                        ? "bg-[#3f0aa9] text-white shadow-sm"
                        : "text-gray-700 hover:text-[#3f0aa9]"
                    }`}
                  >
                    {cityHighlights[cityKey].name}
                  </button>
                ))}
              </div>
            </div>

            {/* City Showcase Card */}
            <div className="bg-white border-2 border-[#3f0aa9]/15 rounded-[30px] p-6 sm:p-10 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-5 space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0404fc] bg-[#0404fc]/10 px-3 py-1 rounded-full">
                    <IconMapPin className="w-3.5 h-3.5" />
                    <span>Ciudad activa</span>
                  </div>
                  <h3 className="text-3xl font-black text-[#3f0791]">
                    {currentCityData.name}
                  </h3>
                  <p className="text-gray-600 text-base font-medium">
                    {currentCityData.subtitle}
                  </p>
                  <div className="flex items-center gap-3 pt-2 text-sm">
                    <span className="flex items-center gap-1 text-gray-700 font-semibold">
                      <IconClock className="w-4 h-4 text-[#3f0aa9]" />
                      Tiempo estimado:
                    </span>
                    <span className="font-extrabold text-[#3f0791] bg-[#f4e687] px-2.5 py-0.5 rounded-md">
                      {currentCityData.deliveryTime}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-7">
                  <p className="text-xs uppercase font-extrabold tracking-wider text-gray-400 mb-3">
                    Restaurantes destacados en {currentCityData.name}:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentCityData.spots.map((spot, i) => (
                      <div
                        key={spot}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-[#faf9f5] border border-gray-200/80 hover:border-[#3f0aa9] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#3f0aa9] text-[#f4e687] flex items-center justify-center font-bold text-xs">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#1c1917]">{spot}</p>
                            <div className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold">
                              <IconStar className="w-3 h-3 fill-current" />
                              <span>4.9 · Muy recomendado</span>
                            </div>
                          </div>
                        </div>
                        <IconArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THREE AUDIENCE PILLARS SECTION */}
        <section className="py-16 bg-white border-t border-[#3f0aa9]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
              <h2 className="text-3xl font-extrabold text-[#3f0791] tracking-tight">
                Una comunidad gastronómica para todos
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Conectamos a quien cocina con amor, a quien lleva la orden con cuidado y a quien disfruta en su mesa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pillar 1: Diners */}
              <div className="bg-[#faf9f5] border border-[#3f0aa9]/15 rounded-[24px] p-7 space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#f4e687] text-[#3f0791] flex items-center justify-center font-black text-xl">
                    😋
                  </div>
                  <h3 className="text-xl font-bold text-[#3f0791]">Para Clientes</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Menús actualizados, fotos reales de platos, pedidos en menos de 1 minuto y seguimiento en vivo hasta tu puerta.
                  </p>
                  <ul className="text-xs text-gray-700 space-y-2 pt-2">
                    <li className="flex items-center gap-2">
                      <IconCheckCircle className="w-4 h-4 text-[#44BE70]" />
                      <span>Sin cobros ocultos ni sorpresas en el total</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <IconCheckCircle className="w-4 h-4 text-[#44BE70]" />
                      <span>Opción de recojo en tienda sin esperar cola</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-gray-200/60">
                  <a
                    href="#ciudades"
                    className="text-xs font-bold text-[#3f0aa9] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Ver restaurantes en mi ciudad</span>
                    <IconArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Pillar 2: Restaurants */}
              <div className="bg-[#faf9f5] border border-[#3f0aa9]/15 rounded-[24px] p-7 space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#ceadd1] text-[#3f0791] flex items-center justify-center font-black text-xl">
                    👨‍🍳
                  </div>
                  <h3 className="text-xl font-bold text-[#3f0791]">Para Restaurantes (Owners)</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    El panel web de comandas más fácil de usar. Alerta audible al recibir pedidos, control de stock y reportes de caja diarios.
                  </p>
                  <ul className="text-xs text-gray-700 space-y-2 pt-2">
                    <li className="flex items-center gap-2">
                      <IconCheckCircle className="w-4 h-4 text-[#44BE70]" />
                      <span>Usa tu propia flota de motos o los repartidores Al Toque</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <IconCheckCircle className="w-4 h-4 text-[#44BE70]" />
                      <span>Modifica precios o desactiva platos al instante</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-gray-200/60">
                  <button
                    type="button"
                    onClick={() => scrollToApplication("restaurant")}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#3f0aa9] text-white font-bold text-xs hover:bg-[#320786] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Solicitar Afiliación Comercial</span>
                    <IconArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Pillar 3: Drivers */}
              <div className="bg-[#faf9f5] border border-[#3f0aa9]/15 rounded-[24px] p-7 space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0404fc]/15 text-[#0404fc] flex items-center justify-center font-black text-xl">
                    🛵
                  </div>
                  <h3 className="text-xl font-bold text-[#3f0791]">Para Repartidores (Drivers)</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Sé dueño de tu tiempo. Conéctate cuando quieras, con carreras locales claras y pagos directos por cada pedido entregado.
                  </p>
                  <ul className="text-xs text-gray-700 space-y-2 pt-2">
                    <li className="flex items-center gap-2">
                      <IconCheckCircle className="w-4 h-4 text-[#44BE70]" />
                      <span>Tarifas transparentes por distancia</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <IconCheckCircle className="w-4 h-4 text-[#44BE70]" />
                      <span>Soporte activo y seguimiento en ruta</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-gray-200/60">
                  <button
                    type="button"
                    onClick={() => scrollToApplication("driver")}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0404fc] text-white font-bold text-xs hover:bg-[#0303cb] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Postular como Repartidor</span>
                    <IconArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ——— APPLICATION SECTION (SOLICITUDES DE DRIVER U OWNER) ——— */}
        <section id="unete" className="py-20 bg-[#f4e687]/20 border-t border-[#3f0aa9]/15">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#3f0791] bg-[#f4e687] px-3.5 py-1.5 rounded-full shadow-2xs">
                <IconZap className="w-3.5 h-3.5 fill-current" /> Oportunidades y Crecimiento
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#3f0791] tracking-tight">
                Únete a la Red Al Toque
              </h2>
              <p className="text-gray-700 text-base sm:text-lg">
                Elige tu camino: afilia tu restaurante para multiplicar tus ventas o postula como repartidor para generar ingresos con total libertad de horarios.
              </p>
            </div>

            {/* Application Mode Switcher Tabs */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex p-1.5 bg-white border border-[#3f0aa9]/20 rounded-full shadow-sm">
                <button
                  type="button"
                  onClick={() => setApplicationTab("restaurant")}
                  className={`px-5 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f0aa9] flex items-center gap-2 ${
                    applicationTab === "restaurant"
                      ? "bg-[#3f0aa9] text-white shadow-md"
                      : "text-gray-700 hover:text-[#3f0aa9] hover:bg-gray-50"
                  }`}
                >
                  <IconStore className="w-4 h-4" />
                  <span>Quiero Afiliar mi Restaurante (Owner)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setApplicationTab("driver")}
                  className={`px-5 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0404fc] flex items-center gap-2 ${
                    applicationTab === "driver"
                      ? "bg-[#0404fc] text-white shadow-md"
                      : "text-gray-700 hover:text-[#0404fc] hover:bg-gray-50"
                  }`}
                >
                  <IconBike className="w-4 h-4" />
                  <span>Quiero ser Repartidor (Driver)</span>
                </button>
              </div>
            </div>

            {/* Form Container Card */}
            <div className="bg-white border-2 border-[#3f0aa9]/15 rounded-[32px] p-6 sm:p-10 shadow-xl relative overflow-hidden">
              {/* Form 1: Afiliación de Restaurante (Owner) */}
              {applicationTab === "restaurant" && (
                <div>
                  <div className="flex items-start justify-between pb-6 border-b border-gray-100 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-[#3f0aa9]/10 text-[#3f0791] flex items-center justify-center font-bold text-base">
                          🏪
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-[#3f0791]">
                          Formulario de Afiliación Comercial
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Llena los datos de tu establecimiento y nuestro equipo activará tu menú digital y tu acceso al panel web.
                      </p>
                    </div>
                    <span className="hidden sm:inline-flex text-xs font-bold text-[#3f0aa9] bg-[#f4e687] px-3 py-1 rounded-full">
                      Respuesta en 24h
                    </span>
                  </div>

                  {restSuccess && (
                    <div className="mb-6 p-4 rounded-2xl bg-[#44BE70]/15 border border-[#44BE70] text-[#052e16] flex items-start gap-3">
                      <IconCheckCircle className="w-5 h-5 text-[#44BE70] shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm">
                        <p className="font-bold text-[#052e16]">¡Solicitud enviada con éxito!</p>
                        <p className="mt-0.5 text-[#052e16]/90">{restSuccess}</p>
                      </div>
                    </div>
                  )}

                  {restError && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
                      <IconAlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm">
                        <p className="font-bold">No se pudo procesar la solicitud</p>
                        <p className="mt-0.5 text-red-700">{restError}</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleRestaurantSubmit} className="space-y-5">
                    {/* Row 1: Nombre de negocio y categoría */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="rest-business-name" className="block text-xs font-bold text-gray-700 mb-1.5">
                          Nombre Comercial del Restaurante *
                        </label>
                        <input
                          id="rest-business-name"
                          type="text"
                          required
                          value={restBusinessName}
                          onChange={(e) => setRestBusinessName(e.target.value)}
                          placeholder="Ej. Pollería El Buen Sabor"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3f0aa9] text-sm text-gray-900"
                        />
                      </div>

                      <div>
                        <label htmlFor="rest-category" className="block text-xs font-bold text-gray-700 mb-1.5">
                          Categoría Principal *
                        </label>
                        <select
                          id="rest-category"
                          required
                          value={restCategoryId}
                          onChange={(e) => setRestCategoryId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3f0aa9] text-sm text-gray-900 bg-white"
                        >
                          <option value="b4e81a15-c533-46d8-a7af-3ed94f05af2e">🍗 Pollería</option>
                          <option value="c1000000-0000-0000-0000-000000000003">🍜 Chifa / Fusión</option>
                          <option value="c1000000-0000-0000-0000-000000000001">🍔 Hamburguesas & Broasters</option>
                          <option value="c1000000-0000-0000-0000-000000000002">🍕 Pizzería</option>
                          <option value="0705f768-45d0-4e78-995c-fd18e45d064d">🍦 Heladería</option>
                          <option value="c1000000-0000-0000-0000-000000000004">☕ Cafetería / Postres</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 2: Ciudad y Dirección */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="rest-city" className="block text-xs font-bold text-gray-700 mb-1.5">
                          Ciudad de Operación *
                        </label>
                        <select
                          id="rest-city"
                          required
                          value={restCity}
                          onChange={(e) => setRestCity(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3f0aa9] text-sm text-gray-900 bg-white"
                        >
                          <option value="jaen">Jaén (Cajamarca)</option>
                          <option value="bagua">Bagua Grande (Amazonas)</option>
                          <option value="chachapoyas">Chachapoyas (Amazonas)</option>
                          <option value="other">Otra ciudad / expansión</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="rest-address" className="block text-xs font-bold text-gray-700 mb-1.5">
                          Dirección del Local *
                        </label>
                        <input
                          id="rest-address"
                          type="text"
                          required
                          value={restAddress}
                          onChange={(e) => setRestAddress(e.target.value)}
                          placeholder="Ej. Jr. Huamantanga 620, cerca al parque"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3f0aa9] text-sm text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Row 3: Datos de contacto comercial */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="rest-phone" className="block text-xs font-bold text-gray-700 mb-1.5">
                          Teléfono / Celular de Pedidos *
                        </label>
                        <input
                          id="rest-phone"
                          type="tel"
                          required
                          value={restPhone}
                          onChange={(e) => setRestPhone(e.target.value)}
                          placeholder="Ej. 976123456"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3f0aa9] text-sm text-gray-900"
                        />
                      </div>

                      <div>
                        <label htmlFor="rest-email" className="block text-xs font-bold text-gray-700 mb-1.5">
                          Correo Electrónico (Opcional)
                        </label>
                        <input
                          id="rest-email"
                          type="email"
                          value={restEmail}
                          onChange={(e) => setRestEmail(e.target.value)}
                          placeholder="contacto@mirestaurante.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3f0aa9] text-sm text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Row 4: Datos del titular / Propietario */}
                    <div className="p-4 rounded-2xl bg-[#faf9f5] border border-gray-200/80 space-y-3">
                      <p className="text-xs uppercase font-extrabold tracking-wider text-[#3f0791]">
                        Datos del Propietario o Representante Legal
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="rest-owner-name" className="block text-xs font-bold text-gray-700 mb-1.5">
                            Nombre Completo del Titular *
                          </label>
                          <input
                            id="rest-owner-name"
                            type="text"
                            required
                            value={restOwnerName}
                            onChange={(e) => setRestOwnerName(e.target.value)}
                            placeholder="Ej. Miguel Ángel Díaz Torres"
                            className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3f0aa9] text-sm text-gray-900 bg-white"
                          />
                        </div>

                        <div>
                          <label htmlFor="rest-owner-dni" className="block text-xs font-bold text-gray-700 mb-1.5">
                            DNI del Titular (8 dígitos) *
                          </label>
                          <input
                            id="rest-owner-dni"
                            type="text"
                            maxLength={8}
                            required
                            value={restOwnerDni}
                            onChange={(e) => setRestOwnerDni(e.target.value.replace(/\D/g, ""))}
                            placeholder="Ej. 45892134"
                            className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3f0aa9] text-sm text-gray-900 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 5: Comentarios opcionales */}
                    <div>
                      <label htmlFor="rest-comments" className="block text-xs font-bold text-gray-700 mb-1.5">
                        Comentarios adicionales o platos destacados (Opcional)
                      </label>
                      <textarea
                        id="rest-comments"
                        rows={2}
                        value={restComments}
                        onChange={(e) => setRestComments(e.target.value)}
                        placeholder="Contamos con flota propia de 2 motorizados y especialidad en parrillas..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3f0aa9] text-sm text-gray-900"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <p className="text-xs text-gray-500">
                        Al enviar la solicitud aceptas las políticas comerciales y contacto vía WhatsApp de Al Toque.
                      </p>

                      <button
                        type="submit"
                        disabled={restSubmitting}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#3f0aa9] hover:bg-[#320786] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {restSubmitting ? (
                          <>
                            <IconLoader className="w-4 h-4" />
                            <span>Enviando solicitud…</span>
                          </>
                        ) : (
                          <>
                            <span>Enviar Solicitud de Afiliación</span>
                            <IconArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Form 2: Postulación de Repartidor (Driver) */}
              {applicationTab === "driver" && (
                <div>
                  <div className="flex items-start justify-between pb-6 border-b border-gray-100 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-[#0404fc]/10 text-[#0404fc] flex items-center justify-center font-bold text-base">
                          🛵
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-[#0404fc]">
                          Postulación para Repartidores (Drivers)
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Genera ingresos en tus tiempos libres repartiendo en Jaén, Bagua Grande o Chachapoyas con tarifas transparentes por carrera.
                      </p>
                    </div>
                    <span className="hidden sm:inline-flex text-xs font-bold text-white bg-[#0404fc] px-3 py-1 rounded-full">
                      Pagos Semanales
                    </span>
                  </div>

                  {driverSuccess && (
                    <div className="mb-6 p-4 rounded-2xl bg-[#44BE70]/15 border border-[#44BE70] text-[#052e16] flex items-start gap-3">
                      <IconCheckCircle className="w-5 h-5 text-[#44BE70] shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm">
                        <p className="font-bold text-[#052e16]">¡Postulación enviada con éxito!</p>
                        <p className="mt-0.5 text-[#052e16]/90">{driverSuccess}</p>
                      </div>
                    </div>
                  )}

                  {driverError && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
                      <IconAlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm">
                        <p className="font-bold">Error en la postulación</p>
                        <p className="mt-0.5 text-red-700">{driverError}</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleDriverSubmit} className="space-y-5">
                    {/* Row 1: Nombre completo y DNI */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="driver-fullname" className="block text-xs font-bold text-gray-700 mb-1.5">
                          Nombre Completo *
                        </label>
                        <input
                          id="driver-fullname"
                          type="text"
                          required
                          value={driverFullName}
                          onChange={(e) => setDriverFullName(e.target.value)}
                          placeholder="Ej. Juan Carlos Morales Pérez"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0404fc] text-sm text-gray-900"
                        />
                      </div>

                      <div>
                        <label htmlFor="driver-dni" className="block text-xs font-bold text-gray-700 mb-1.5">
                          DNI (8 dígitos) *
                        </label>
                        <input
                          id="driver-dni"
                          type="text"
                          maxLength={8}
                          required
                          value={driverDni}
                          onChange={(e) => setDriverDni(e.target.value.replace(/\D/g, ""))}
                          placeholder="Ej. 73849102"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0404fc] text-sm text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Row 2: Fecha de nacimiento y Celular */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="driver-birthdate" className="block text-xs font-bold text-gray-700 mb-1.5">
                          Fecha de Nacimiento *
                        </label>
                        <input
                          id="driver-birthdate"
                          type="date"
                          required
                          value={driverBirthDate}
                          onChange={(e) => setDriverBirthDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0404fc] text-sm text-gray-900 bg-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="driver-phone" className="block text-xs font-bold text-gray-700 mb-1.5">
                          Celular / WhatsApp (9 dígitos) *
                        </label>
                        <input
                          id="driver-phone"
                          type="tel"
                          maxLength={9}
                          required
                          value={driverPhone}
                          onChange={(e) => setDriverPhone(e.target.value.replace(/\D/g, ""))}
                          placeholder="Ej. 987654321"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0404fc] text-sm text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Row 3: Vehículo */}
                    <div className="p-4 rounded-2xl bg-[#faf9f5] border border-gray-200/80 space-y-3">
                      <p className="text-xs uppercase font-extrabold tracking-wider text-[#0404fc]">
                        Datos del Vehículo de Reparto
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(
                          [
                            { type: "motorcycle", label: "Moto Lineal", emoji: "🛵" },
                            { type: "bicycle", label: "Bicicleta", emoji: "🚲" },
                            { type: "car", label: "Automóvil", emoji: "🚗" },
                          ] as const
                        ).map((v) => (
                          <button
                            key={v.type}
                            type="button"
                            onClick={() => setDriverVehicleType(v.type)}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              driverVehicleType === v.type
                                ? "bg-white border-[#0404fc] shadow-sm text-[#0404fc] font-bold"
                                : "bg-white/50 border-gray-200 text-gray-600 hover:bg-white"
                            }`}
                          >
                            <span className="text-xl block mb-1">{v.emoji}</span>
                            <span className="text-xs">{v.label}</span>
                          </button>
                        ))}
                      </div>

                      {driverVehicleType !== "bicycle" && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                          <div>
                            <label htmlFor="driver-plate" className="block text-[11px] font-bold text-gray-700 mb-1">
                              Placa del Vehículo
                            </label>
                            <input
                              id="driver-plate"
                              type="text"
                              value={driverVehiclePlate}
                              onChange={(e) => setDriverVehiclePlate(e.target.value.toUpperCase())}
                              placeholder="Ej. 4512-4B"
                              className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0404fc] text-xs text-gray-900 bg-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="driver-brand" className="block text-[11px] font-bold text-gray-700 mb-1">
                              Marca y Modelo
                            </label>
                            <input
                              id="driver-brand"
                              type="text"
                              value={driverVehicleBrand}
                              onChange={(e) => setDriverVehicleBrand(e.target.value)}
                              placeholder="Ej. Honda Wave 110"
                              className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0404fc] text-xs text-gray-900 bg-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="driver-license" className="block text-[11px] font-bold text-gray-700 mb-1">
                              Licencia de Conducir
                            </label>
                            <input
                              id="driver-license"
                              type="text"
                              value={driverLicenseNumber}
                              onChange={(e) => setDriverLicenseNumber(e.target.value)}
                              placeholder="Ej. Q-73849102"
                              className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0404fc] text-xs text-gray-900 bg-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Row 4: Contacto de emergencia */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="driver-emerg-name" className="block text-xs font-bold text-gray-700 mb-1.5">
                          Contacto de Emergencia (Nombre)
                        </label>
                        <input
                          id="driver-emerg-name"
                          type="text"
                          value={driverEmergencyName}
                          onChange={(e) => setDriverEmergencyName(e.target.value)}
                          placeholder="Ej. Rosa Morales (Mamá)"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0404fc] text-sm text-gray-900"
                        />
                      </div>

                      <div>
                        <label htmlFor="driver-emerg-phone" className="block text-xs font-bold text-gray-700 mb-1.5">
                          Teléfono de Emergencia
                        </label>
                        <input
                          id="driver-emerg-phone"
                          type="tel"
                          value={driverEmergencyPhone}
                          onChange={(e) => setDriverEmergencyPhone(e.target.value.replace(/\D/g, ""))}
                          placeholder="Ej. 945678123"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0404fc] text-sm text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <p className="text-xs text-gray-500">
                        Te solicitaremos foto de DNI y brevete vía WhatsApp para la validación final.
                      </p>

                      <button
                        type="submit"
                        disabled={driverSubmitting}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#0404fc] hover:bg-[#0303cb] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {driverSubmitting ? (
                          <>
                            <IconLoader className="w-4 h-4" />
                            <span>Enviando postulación…</span>
                          </>
                        ) : (
                          <>
                            <span>Enviar Postulación de Driver</span>
                            <IconArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CALL TO ACTION APP DOWNLOAD SECTION */}
        <section id="app" className="py-16 bg-[#3f0aa9] text-white relative overflow-hidden">
          {/* Subtle background decorative circle */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#0404fc]/40 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#f4e687]/20 blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f4e687] text-[#3f0791] text-xs font-black uppercase tracking-wider">
                <IconSmartphone className="w-4 h-4" /> ¡Disponible para tu móvil!
              </span>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-balance">
                ¿Listo para matar el antojo? Pide Al Toque.
              </h2>

              <p className="text-white/85 text-base sm:text-lg max-w-xl mx-auto leading-relaxed text-pretty">
                Disfruta de la mejor comida de Bagua Grande, Jaén y Chachapoyas en la comodidad de tu hogar o trabajo.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#f4e687] hover:bg-[#ebd966] text-[#3f0791] font-black text-base shadow-lg transition-all transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Ingresar a la Plataforma Web
                </Link>
                <button
                  type="button"
                  onClick={() => scrollToApplication("restaurant")}
                  className="w-full sm:w-auto px-7 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-base border border-white/30 backdrop-blur-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Afiliar mi Restaurante
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#1c1917] text-white pt-14 pb-10 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-gray-800 text-sm">
            {/* Col 1: Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#3f0aa9] text-[#f4e687] flex items-center justify-center font-bold">
                  <IconZap className="w-5 h-5 fill-current" />
                </div>
                <span className="font-black text-2xl tracking-tight text-white">
                  Al Toque
                </span>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                Plataforma de delivery ultra rápido y recojo en tienda para Bagua Grande, Jaén y Chachapoyas. Apoyando el comercio local de la selva y sierra norte del Perú.
              </p>
            </div>

            {/* Col 2: Ciudades */}
            <div className="space-y-3">
              <p className="font-bold text-white uppercase text-xs tracking-wider">
                Ciudades Activas
              </p>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="hover:text-white transition-colors">Jaén (Cajamarca)</li>
                <li className="hover:text-white transition-colors">Bagua Grande (Amazonas)</li>
                <li className="hover:text-white transition-colors">Chachapoyas (Amazonas)</li>
              </ul>
            </div>

            {/* Col 3: Accesos y Socios */}
            <div className="space-y-3">
              <p className="font-bold text-white uppercase text-xs tracking-wider">
                Socios y Postulaciones
              </p>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToApplication("restaurant")}
                    className="hover:text-[#f4e687] transition-colors text-left"
                  >
                    Afiliar mi Restaurante (Owner)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToApplication("driver")}
                    className="hover:text-[#f4e687] transition-colors text-left"
                  >
                    Postular como Repartidor (Driver)
                  </button>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#f4e687] transition-colors">
                    Portal de Restaurantes
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#f4e687] transition-colors">
                    Panel Administrador General
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Métodos de Pago */}
            <div className="space-y-3">
              <p className="font-bold text-white uppercase text-xs tracking-wider">
                Métodos de Pago
              </p>
              <p className="text-gray-400 text-xs">
                Aceptamos Yape, Plin, Efectivo con vuelto exacto y Tarjetas de débito o crédito.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-bold">
                <span className="px-2 py-0.5 rounded bg-[#742774] text-white">Yape</span>
                <span className="px-2 py-0.5 rounded bg-[#009ca6] text-white">Plin</span>
                <span className="px-2 py-0.5 rounded bg-gray-700 text-white">Efectivo</span>
                <span className="px-2 py-0.5 rounded bg-blue-700 text-white">Tarjetas</span>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3">
            <p>© {new Date().getFullYear()} Al Toque Delivery. Todos los derechos reservados.</p>
            <p>Hecho con ❤️ para la gastronomía de Jaén, Bagua y Chachapoyas.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
