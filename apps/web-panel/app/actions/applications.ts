'use server';

import { createServiceClient } from '@/utils/supabase/service';
import { revalidatePath } from 'next/cache';

export interface SubmitRestaurantInput {
  businessName: string;
  businessPhone: string;
  businessEmail?: string;
  address: string;
  city: 'bagua' | 'jaen' | 'chachapoyas' | 'other';
  categoryId: string;
  ownerName: string;
  ownerDni: string;
  additionalComments?: string;
}

export interface SubmitDriverInput {
  fullName: string;
  dni: string;
  birthDate: string;
  phone: string;
  email?: string;
  vehicleType: 'motorcycle' | 'bicycle' | 'car';
  vehiclePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  licenseNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export async function submitPublicRestaurantApplication(input: SubmitRestaurantInput) {
  try {
    const businessName = input.businessName?.trim();
    const businessPhone = input.businessPhone?.trim();
    const address = input.address?.trim();
    const categoryId = input.categoryId?.trim();
    const ownerName = input.ownerName?.trim();
    const ownerDni = input.ownerDni?.trim();

    if (!businessName || !businessPhone || !address || !categoryId || !ownerName || !ownerDni) {
      return { error: 'Por favor completa todos los campos requeridos marcados con *' };
    }

    if (ownerDni.length < 8) {
      return { error: 'El DNI debe tener 8 dígitos numéricos válidos' };
    }

    const supabase = createServiceClient();
    const { data: applicationId, error: rpcError } = await supabase.rpc(
      'submit_public_restaurant_application',
      {
        p_business_name: businessName,
        p_business_phone: businessPhone,
        p_business_email: input.businessEmail?.trim() || null,
        p_address: address,
        p_category_id: categoryId,
        p_city: input.city || 'jaen',
        p_owner_name: ownerName,
        p_owner_dni: ownerDni,
        p_additional_comments: input.additionalComments?.trim() || null,
      },
    );

    if (rpcError) {
      console.error('[submitPublicRestaurantApplication] RPC Error:', rpcError);
      return { error: rpcError.message || rpcError.details || 'Error al procesar la solicitud de restaurante.' };
    }

    revalidatePath('/admin/applications');
    return {
      success: true,
      applicationId,
      message: '¡Solicitud enviada con éxito! Nuestro equipo revisará los datos de tu restaurante y te contactará en menos de 24 horas.',
    };
  } catch (err: any) {
    console.error('[submitPublicRestaurantApplication] Excepción:', err);
    return { error: err.message || 'Ocurrió un error inesperado al procesar tu solicitud.' };
  }
}

export async function submitPublicDriverApplication(input: SubmitDriverInput) {
  try {
    const fullName = input.fullName?.trim();
    const dni = input.dni?.trim();
    const phone = input.phone?.trim();
    const birthDate = input.birthDate?.trim();
    const vehicleType = input.vehicleType || 'motorcycle';

    if (!fullName || !dni || !phone || !birthDate) {
      return { error: 'Por favor completa tus datos personales requeridos (Nombre, DNI, Celular y Fecha de Nacimiento)' };
    }

    if (dni.length < 8) {
      return { error: 'El DNI debe tener al menos 8 dígitos' };
    }

    if (phone.length < 9) {
      return { error: 'El celular debe tener 9 dígitos' };
    }

    const supabase = createServiceClient();
    const { data: applicationId, error: rpcError } = await supabase.rpc(
      'submit_public_driver_application',
      {
        p_full_name: fullName,
        p_dni: dni,
        p_birth_date: birthDate,
        p_phone: phone,
        p_email: input.email?.trim() || null,
        p_vehicle_type: vehicleType,
        p_vehicle_plate: input.vehiclePlate?.trim() || null,
        p_vehicle_brand: input.vehicleBrand?.trim() || null,
        p_vehicle_model: input.vehicleModel?.trim() || null,
        p_license_number: input.licenseNumber?.trim() || null,
        p_emergency_contact_name: input.emergencyContactName?.trim() || null,
        p_emergency_contact_phone: input.emergencyContactPhone?.trim() || null,
      },
    );

    if (rpcError) {
      console.error('[submitPublicDriverApplication] RPC Error:', rpcError);
      return { error: rpcError.message || rpcError.details || 'Error al procesar tu postulación de repartidor.' };
    }

    revalidatePath('/admin/drivers/applications');
    return {
      success: true,
      applicationId,
      message: '¡Postulación enviada exitosamente! Te contactaremos al WhatsApp para verificar tus documentos y activar tu cuenta.',
    };
  } catch (err: any) {
    console.error('[submitPublicDriverApplication] Excepción:', err);
    return { error: err.message || 'Ocurrió un error inesperado al registrar tu postulación.' };
  }
}
