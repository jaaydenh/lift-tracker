import { describe, expect, it } from 'vitest';
import { formatWeight, kgToLbs, lbsToKg, roundToPlate } from '../units';

describe('units', () => {
  describe('kgToLbs', () => {
    it('converts kilograms to pounds using the fixed multiplier', () => {
      expect(kgToLbs(0)).toBe(0);
      expect(kgToLbs(100)).toBeCloseTo(220.462, 6);
    });
  });

  describe('lbsToKg', () => {
    it('converts pounds to kilograms using the fixed divisor', () => {
      expect(lbsToKg(0)).toBe(0);
      expect(lbsToKg(220.462)).toBeCloseTo(100, 6);
    });
  });

  describe('formatWeight', () => {
    it('formats kilograms with one decimal precision and strips trailing .0', () => {
      expect(formatWeight(10, 'kg')).toBe('10');
      expect(formatWeight(10.44, 'kg')).toBe('10.4');
      expect(formatWeight(10.45, 'kg')).toBe('10.5');
    });

    it('converts to pounds before formatting, rounds to one decimal, and strips trailing .0', () => {
      expect(formatWeight(10, 'lbs')).toBe('22');
      expect(formatWeight(10.2, 'lbs')).toBe('22.5');
    });
  });

  describe('roundToPlate', () => {
    it('rounds to the nearest 2.5kg plate increment', () => {
      expect(roundToPlate(100)).toBe(100);
      expect(roundToPlate(101)).toBe(100);
      expect(roundToPlate(101.25)).toBe(102.5);
      expect(roundToPlate(98.74)).toBe(97.5);
    });
  });
});
