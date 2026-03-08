import type { WeightUnit } from '../models/types';

const LBS_PER_KG = 2.20462;

export function kgToLbs(kg: number): number {
  return kg * LBS_PER_KG;
}

export function lbsToKg(lbs: number): number {
  return lbs / LBS_PER_KG;
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  const value = unit === 'lbs' ? kgToLbs(kg) : kg;
  const rounded = Math.round(value * 10) / 10;
  const str = rounded.toFixed(1);
  return str.endsWith('.0') ? str.slice(0, -2) : str;
}

export function roundToPlate(kg: number): number {
  return Math.round(kg / 2.5) * 2.5;
}
