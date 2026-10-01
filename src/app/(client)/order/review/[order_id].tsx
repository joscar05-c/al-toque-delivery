import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

const QUESTIONS = [
  { key: 'q1_app_loading_speed', label: '¿Qué tan rápida fue la aplicación?' },
  { key: 'q2_product_selection_ease', label: '¿Qué tan fácil fue elegir los productos?' },
  { key: 'q3_menu_navigation_ease', label: '¿Qué tan fácil fue navegar el menú?' },
  { key: 'q4_order_accuracy', label: '¿Qué tan preciso fue tu pedido?' },
  { key: 'q5_payment_address_accuracy', label: '¿Qué tan precisos fueron el pago y la dirección?' },
  { key: 'q6_order_tracking_visibility', label: '¿Qué tan claro fue el seguimiento del pedido?' },
  { key: 'q7_communication_need', label: '¿Qué tan necesaria fue la comunicación durante la entrega?' },
  { key: 'q8_delivery_timeliness', label: '¿Qué tan puntual fue la entrega?' },
  { key: 'q9_app_vs_phone_speed', label: '¿Qué tan rápida fue la app frente a llamar por teléfono?' },
  { key: 'q10_overall_satisfaction', label: '¿Qué tan satisfecho estás en general?' },
  { key: 'q11_recommendation_likelihood', label: '¿Qué tan probable es que recomiendes Al Toque?' },
] as const;

type RatingKey = (typeof QUESTIONS)[number]['key'];
type Ratings = Record<RatingKey, number>;

const INITIAL_RATINGS: Ratings = {
  q1_app_loading_speed: 0,
  q2_product_selection_ease: 0,
  q3_menu_navigation_ease: 0,
  q4_order_accuracy: 0,
  q5_payment_address_accuracy: 0,
  q6_order_tracking_visibility: 0,
  q7_communication_need: 0,
  q8_delivery_timeliness: 0,
  q9_app_vs_phone_speed: 0,
  q10_overall_satisfaction: 0,
  q11_recommendation_likelihood: 0,
};

/** Encuesta post-entrega asociada al pedido. */
export default function OrderReviewScreen() {
  const { order_id: orderId } = useLocalSearchParams<{ order_id: string }>();
  const userId = useAuthStore((state) => state.session?.user.id);

  const [ratings, setRatings] = useState<Ratings>(INITIAL_RATINGS);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo permite calificar pedidos entregados que pertenecen al usuario.
  useEffect(() => {
    let cancelled = false;
    if (!orderId || !userId) return;

    supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .eq('client_id', userId)
      .single()
      .then(({ data, error: orderError }) => {
        if (cancelled) return;
        if (orderError) {
          setError(orderError.message);
        } else if (data.status !== 'delivered') {
          setError('El pedido aún no fue entregado.');
        }
      })
      .then(() => {
        if (!cancelled) setIsLoading(false);
      }, (requestError: unknown) => {
        if (cancelled) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudo validar el pedido.',
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, userId]);

  const submitReview = async () => {
    if (!orderId || isSubmitting) return;
    if (QUESTIONS.some(({ key }) => ratings[key] < 1 || ratings[key] > 5)) {
      Alert.alert('Calificación incompleta', 'Selecciona de 1 a 5 estrellas en cada pregunta.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Requiere policy INSERT en public.reviews (RLS está activo en el DDL).
      const { error: reviewError } = await supabase.from('reviews').insert({
        order_id: orderId,
        ...ratings,
        comment: comment.trim() || null,
      });

      if (reviewError) throw reviewError;
      router.replace('/(client)/(tabs)');
    } catch (e) {
      Alert.alert(
        'No se pudo enviar',
        e instanceof Error ? e.message : 'Inténtalo de nuevo.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!orderId) return <Redirect href="/(client)/(tabs)" />;

  if (isLoading || error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-slate-50 px-8">
        {isLoading ? (
          <ActivityIndicator size="large" color="#208AEF" />
        ) : (
          <>
            <Ionicons name="alert-circle-outline" size={40} color="#94A3B8" />
            <Text className="text-center text-sm text-slate-500">{error}</Text>
            <Pressable
              onPress={() => router.back()}
              className="rounded-xl bg-primary px-6 py-3 active:opacity-80"
            >
              <Text className="font-semibold text-white">Volver</Text>
            </Pressable>
          </>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      <View className="flex-row items-center gap-3 bg-white px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Califica tu pedido</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View className="items-center rounded-2xl bg-white px-5 py-6">
          <Ionicons name="star" size={32} color="#F59E0B" />
          <Text className="mt-2 text-center text-lg font-bold text-slate-900">
            ¿Cómo fue tu experiencia?
          </Text>
          <Text className="mt-1 text-center text-sm text-slate-500">
            Pedido #{orderId.slice(0, 8).toUpperCase()}
          </Text>
        </View>

        {QUESTIONS.map(({ key, label }) => (
          <View key={key} className="gap-3 rounded-2xl bg-white p-4">
            <Text className="text-sm font-semibold text-slate-800">{label}</Text>
            <View className="flex-row justify-between">
              {[1, 2, 3, 4, 5].map((value) => {
                const selected = ratings[key] >= value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setRatings((current) => ({ ...current, [key]: value }))}
                    accessibilityRole="button"
                    accessibilityLabel={`${value} de 5 estrellas`}
                    className="h-11 w-12 items-center justify-center rounded-xl active:bg-amber-50"
                  >
                    <Ionicons
                      name={selected ? 'star' : 'star-outline'}
                      size={27}
                      color={selected ? '#F59E0B' : '#CBD5E1'}
                    />
                  </Pressable>
                );
              })}
            </View>
            <View className="flex-row justify-between px-1">
              <Text className="text-xs text-slate-400">1 · Bajo</Text>
              <Text className="text-xs text-slate-400">5 · Alto</Text>
            </View>
          </View>
        ))}

        <View className="gap-2 rounded-2xl bg-white p-4">
          <Text className="text-sm font-semibold text-slate-800">
            Comentario (opcional)
          </Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Cuéntanos más sobre tu experiencia"
            multiline
            maxLength={1000}
            textAlignVertical="top"
            className="min-h-28 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-800"
          />
        </View>

        <Pressable
          onPress={submitReview}
          disabled={isSubmitting}
          className={`flex-row items-center justify-center gap-2 rounded-xl py-4 ${
            isSubmitting ? 'bg-primary/60' : 'bg-primary active:opacity-80'
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-bold text-white">
              Enviar Calificación
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
