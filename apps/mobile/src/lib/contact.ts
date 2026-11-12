import { Alert, Linking } from 'react-native';

const RAW_SUPPORT_WHATSAPP =
  process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP?.trim() || '51987654321';

export const SUPPORT_WHATSAPP_NUMBER =
  RAW_SUPPORT_WHATSAPP.replace(/[^\d]/g, '') || '51987654321';

export const SUPPORT_EMAIL =
  process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() ||
  'contacto@altoquedelivery.com';

function formatWhatsAppDisplay(digits: string): string {
  if (digits.startsWith('51') && digits.length === 11) {
    return `+51 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return `+${digits}`;
}

export async function callPhoneNumber(
  phone?: string | null,
  emptyMessage = 'No hay número de contacto registrado.',
): Promise<void> {
  const sanitized = phone?.trim().replace(/[^\d+*#]/g, '') ?? '';

  if (!sanitized) {
    Alert.alert('Teléfono no disponible', emptyMessage);
    return;
  }

  const telUrl = `tel:${sanitized}`;
  const supported = await Linking.canOpenURL(telUrl);
  if (supported) {
    await Linking.openURL(telUrl);
  } else {
    Alert.alert(
      'No se pudo abrir el marcador',
      `Puedes llamar manualmente al ${phone?.trim() ?? sanitized}.`,
    );
  }
}

export async function openSupportWhatsApp(options: {
  title: string;
  message: string;
}): Promise<void> {
  const whatsappUrl = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    options.message,
  )}`;

  const supported = await Linking.canOpenURL(whatsappUrl);
  if (supported) {
    await Linking.openURL(whatsappUrl);
  } else {
    Alert.alert(
      options.title,
      `Puedes escribirnos por WhatsApp al ${formatWhatsAppDisplay(
        SUPPORT_WHATSAPP_NUMBER,
      )} o enviarnos un correo a ${SUPPORT_EMAIL}.`,
    );
  }
}

