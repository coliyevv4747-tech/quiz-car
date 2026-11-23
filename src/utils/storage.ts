import { SaveData } from '../types/game';

const STORAGE_KEY = 'uzb_parking_3d_save_v1';

export const DEFAULT_SAVE_DATA: SaveData = {
  selectedVehicle: 'sedan',
  selectedColor: 'registon',
  graphics: 'medium',
  controlScheme: 'wheel',
  sound: {
    master: true,
    engine: true,
    sfx: true,
    ambient: true,
  },
  parkingProgress: {},
  cityBestScore: 0,
  totalStars: 0,
};

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE_DATA);
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      ...DEFAULT_SAVE_DATA,
      ...parsed,
      sound: {
        ...DEFAULT_SAVE_DATA.sound,
        ...(parsed.sound ?? {}),
      },
      parkingProgress: {
        ...(parsed.parkingProgress ?? {}),
      },
    };
  } catch {
    return structuredClone(DEFAULT_SAVE_DATA);
  }
}

export function persistSaveData(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors gracefully
  }
}
