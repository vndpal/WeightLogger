import { WeightUnit } from '../types';

const KG_TO_LBS = 2.20462262; // More precise conversion factor

export function kgToLbs(kg: number): number {
  return Math.round(kg * KG_TO_LBS * 100) / 100;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / KG_TO_LBS) * 100) / 100;
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  const value = convertFromKg(kg, unit);
  return value.toFixed(2) + ' ' + unit;
}

export function convertToKg(value: number, unit: WeightUnit): number {
  return unit === 'lbs' ? lbsToKg(value) : value;
}

export function convertFromKg(kg: number, unit: WeightUnit): number {
  return unit === 'lbs' ? kgToLbs(kg) : kg;
}
