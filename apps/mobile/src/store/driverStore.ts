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
  coords: DriverCoords | null;
  lastUpdated: string | null;
  setIsOnline: (online: boolean) => void;
  setCoords: (coords: DriverCoords) => void;
}

export const useDriverStore = create<DriverState>((set) => ({
  isOnline: true,
  coords: null,
  lastUpdated: null,
  setIsOnline: (isOnline) => set({ isOnline }),
  setCoords: (coords) =>
    set({
      coords,
      lastUpdated: new Date().toISOString(),
    }),
}));
