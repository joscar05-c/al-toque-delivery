import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ONBOARDING_SLIDES, type OnboardingSlide } from '@/constants/onboarding';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';

const VIEWABILITY_CONFIG = {
  viewAreaCoveragePercentThreshold: 50,
};

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  const completeOnboarding = useOnboardingStore(
    (state) => state.completeOnboarding,
  );
  const session = useAuthStore((state) => state.session);
  const role = useAuthStore((state) => state.role);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<OnboardingSlide>[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width <= 0) return;
      const offsetX = event.nativeEvent.contentOffset.x;
      const nextIndex = Math.round(offsetX / width);
      if (nextIndex >= 0 && nextIndex < ONBOARDING_SLIDES.length) {
        setActiveIndex(nextIndex);
      }
    },
    [width],
  );

  const handleDotPress = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
  }, []);

  const handleGetStarted = useCallback(async () => {
    await completeOnboarding();

    if (session && role === 'client') {
      router.replace('/(client)/(tabs)');
      return;
    }
    if (session && role === 'driver') {
      router.replace('/(driver)/(tabs)');
      return;
    }

    router.replace('/(auth)/login');
  }, [completeOnboarding, role, session]);

  const renderSlide = useCallback(
    ({ item }: { item: OnboardingSlide }) => (
      <View style={[styles.slide, { width }]}>
        {/* 1. Área de Ilustración (Top: ~58% de la pantalla) */}
        <View
          style={[
            styles.illustrationContainer,
            {
              height: height * 0.58,
              paddingTop: insets.top,
            },
          ]}
        >
          <Image
            source={item.image}
            style={{
              width: width * 0.82,
              height: height * 0.36,
            }}
            resizeMode="contain"
          />
        </View>

        {/* 2. Área de Texto (Middle) */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    ),
    [height, insets.top, width],
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Carrusel Horizontal */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        style={styles.carousel}
      />

      {/* 3. Área de Controles (Bottom) */}
      <View
        style={[
          styles.controlsContainer,
          {
            paddingBottom: Math.max(insets.bottom + 16, 32),
          },
        ]}
      >
        {/* Paginador (Dots) */}
        <View style={styles.dotsContainer}>
          {ONBOARDING_SLIDES.map((slide, index) => {
            const isActive = index === activeIndex;
            return (
              <TouchableOpacity
                key={slide.id}
                activeOpacity={0.7}
                onPress={() => handleDotPress(index)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel={`Slide ${index + 1}`}
                accessibilityState={{ selected: isActive }}
              >
                <View
                  style={[
                    styles.dot,
                    isActive ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Botón de Acción Fijo (Call to Action) */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleGetStarted}
          style={styles.primaryButton}
          accessibilityRole="button"
          accessibilityLabel="Get started"
        >
          <Text style={styles.primaryButtonText}>Get started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  carousel: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
  },
  illustrationContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1C2433',
    textAlign: 'center',
    marginBottom: 14,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E98A8',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '80%',
  },
  controlsContainer: {
    width: '100%',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    marginBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 9999,
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#F29F30',
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 9999,
    backgroundColor: '#F29F30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
