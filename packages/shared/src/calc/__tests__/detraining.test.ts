import { describe, expect, it } from 'vitest';
import type { AgeBracket } from '../../models/types';
import { DETRAINING_THRESHOLDS, getDetrainingPhase } from '../detraining';

const AGE_BRACKETS: AgeBracket[] = ['young', 'middle', 'older'];

describe('detraining', () => {
  describe('DETRAINING_THRESHOLDS', () => {
    it('exposes expected thresholds for each age bracket', () => {
      expect(DETRAINING_THRESHOLDS).toEqual({
        young: { fresh: 14, maintain: 21, declining: 35 },
        middle: { fresh: 12, maintain: 17, declining: 28 },
        older: { fresh: 10, maintain: 14, declining: 21 },
      });
    });
  });

  describe('getDetrainingPhase', () => {
    it('classifies every phase boundary correctly across all age brackets', () => {
      for (const ageBracket of AGE_BRACKETS) {
        const thresholds = DETRAINING_THRESHOLDS[ageBracket];

        expect(getDetrainingPhase(-1, ageBracket).phase).toBe('fresh');
        expect(getDetrainingPhase(0, ageBracket).phase).toBe('fresh');
        expect(getDetrainingPhase(thresholds.fresh, ageBracket).phase).toBe('fresh');
        expect(getDetrainingPhase(thresholds.fresh + 1, ageBracket).phase).toBe('maintain');
        expect(getDetrainingPhase(thresholds.maintain, ageBracket).phase).toBe('maintain');
        expect(getDetrainingPhase(thresholds.maintain + 1, ageBracket).phase).toBe('declining');
        expect(getDetrainingPhase(thresholds.declining, ageBracket).phase).toBe('declining');
        expect(getDetrainingPhase(thresholds.declining + 1, ageBracket).phase).toBe('decaying');
      }
    });

    it('computes percent with rounding and clamps to the 0-100 range', () => {
      for (const ageBracket of AGE_BRACKETS) {
        const { declining } = DETRAINING_THRESHOLDS[ageBracket];

        expect(getDetrainingPhase(-10, ageBracket).percent).toBe(0);
        expect(getDetrainingPhase(declining, ageBracket).percent).toBe(100);
        expect(getDetrainingPhase(declining + 100, ageBracket).percent).toBe(100);
      }

      expect(getDetrainingPhase(17, 'young').percent).toBe(49);
    });

    it('returns the expected phase colors', () => {
      expect(getDetrainingPhase(0, 'young').color).toBe('#22c55e');
      expect(getDetrainingPhase(15, 'young').color).toBe('#eab308');
      expect(getDetrainingPhase(22, 'young').color).toBe('#f97316');
      expect(getDetrainingPhase(36, 'young').color).toBe('#ef4444');
    });

    it('returns expected messages for zero, negative, and each phase style', () => {
      expect(getDetrainingPhase(0, 'young').message).toBe('Trained today');
      expect(getDetrainingPhase(-3, 'young').message).toBe('Trained -3 days ago');
      expect(getDetrainingPhase(1, 'young').message).toBe('Trained 1 day ago');
      expect(getDetrainingPhase(2, 'young').message).toBe('Trained 2 days ago');
      expect(getDetrainingPhase(15, 'young').message).toBe('Maintaining — 15 days');
      expect(getDetrainingPhase(22, 'young').message).toBe('Strength declining — 22 days');
      expect(getDetrainingPhase(40, 'young').message).toBe('Retrain soon — 40 days');
    });
  });
});
