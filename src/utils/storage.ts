import { createDefaultCustomization } from '../data/gameData';
import { SaveData, VehicleId } from '../types/game';

const STORAGE_KEY = 'uzb_street_racing_3d_save_v2';

export const DEFAULT_SAVE_DATA: SaveData = {
  selectedVehicle: 'supercar',
  customizations: {
    supercar: createDefaultCustomization('supercar'),
    jdm: createDefaultCustomization('jdm'),
    german: createDefaultCustomization('german'),
    muscle: createDefaultCustomization('muscle'),
    hypercar: createDefaultCustomization('hypercar'),
  },
  graphics: 'medium',
  controlScheme: 'buttons',
  timeOfDay: 'day',
  autoTransmission: true,
  sound: {
    master: true,
    engine: true,
    sfx: true,
    ambient: true,
  },
  parkingProgress: {},
  bestCircuitLapSec: null,
  bestStreetTimeSec: null,
  bestTimeAttackLapSec: null,
  raceWins: 0,
  totalStars: 0,
};

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE_DATA);
    const parsed = JSON.parse(raw) as Partial<SaveData>;

    const vehicleIds: VehicleId[] = ['supercar', 'jdm', 'german', 'muscle', 'hypercar'];
    const customizations = { ...DEFAULT_SAVE_DATA.customizations };
    for (const id of vehicleIds) {
      if (parsed.customizations?.[id]) {
        customizations[id] = {
          ...createDefaultCustomization(id),
          ...parsed.customizations[id],
          upgrades: {
            ...createDefaultCustomization(id).upgrades,
            ...(parsed.customizations[id]?.upgrades ?? {}),
          },
        };
      }
    }

    return {
      ...DEFAULT_SAVE_DATA,
      ...parsed,
      selectedVehicle: vehicleIds.includes(parsed.selectedVehicle as VehicleId)
        ? (parsed.selectedVehicle as VehicleId)
        : 'supercar',
      customizations,
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
    // Ignore storage quota errors
  }
}
