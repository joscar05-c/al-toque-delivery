import { create } from 'zustand';

export interface DriverCoords {
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
}

interface DriverState {
  isOnline: boolean;
  backgroundTrackingActive: boolean;
  coords: DriverCoords | null;
  lastUpdated: string | null;
  setIsOnline: (online: boolean) => void;
  setBackgroundTrackingActive: (active: boolean) => void;
  setCoords: (coords: DriverCoords) => void;
}

export const useDriverStore = create<DriverState>((set) => ({
  isOnline: true,
  backgroundTrackingActive: false,
  coords: null,
  lastUpdated: null,
  setIsOnline: (isOnline) => set({ isOnline }),
  setBackgroundTrackingActive: (backgroundTrackingActive) =>
    set({ backgroundTrackingActive }),
  setCoords: (coords) =>
    set({
      coords,
      lastUpdated: new Date().toISOString(),
    }),
}));
