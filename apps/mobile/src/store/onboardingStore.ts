import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const ONBOARDING_STORAGE_KEY = '@al_toque:onboarding_completed';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  initializeOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

let initialized = false;

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasCompletedOnboarding: false,
  isLoading: true,

  initializeOnboarding: async () => {
    if (initialized) return;
    initialized = true;

    try {
      const storedValue = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      set({
        hasCompletedOnboarding: storedValue === 'true',
        isLoading: false,
      });
    } catch (error) {
      console.warn('[onboardingStore] Error leyendo estado de onboarding:', error);
      set({
        hasCompletedOnboarding: false,
        isLoading: false,
      });
    }
  },

  completeOnboarding: async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch (error) {
      console.warn('[onboardingStore] Error guardando estado de onboarding:', error);
    } finally {
      set({ hasCompletedOnboarding: true });
    }
  },

  resetOnboarding: async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch (error) {
      console.warn('[onboardingStore] Error reiniciando estado de onboarding:', error);
    } finally {
      set({ hasCompletedOnboarding: false });
    }
  },
}));
