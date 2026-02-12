import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * 유효성 검사 함수들
 */
export const validateHeight = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 50 && num <= 250;
};

export const validateWeight = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 10 && num <= 300;
};

export const validateAge = (value) => {
  const num = parseInt(value);
  return !isNaN(num) && num >= 1 && num <= 120;
};

describe('Quick Health Validation', () => {
  describe('Height Validation', () => {
    it('should accept valid heights', () => {
      expect(validateHeight(170)).toBe(true);
      expect(validateHeight(50)).toBe(true);
      expect(validateHeight(250)).toBe(true);
      expect(validateHeight(175.5)).toBe(true);
    });

    it('should reject invalid heights', () => {
      expect(validateHeight(49)).toBe(false);
      expect(validateHeight(251)).toBe(false);
      expect(validateHeight(0)).toBe(false);
      expect(validateHeight(-10)).toBe(false);
      expect(validateHeight('abc')).toBe(false);
    });

    it('property: heights in range [50, 250] should be valid', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 50, max: 250, noNaN: true }),
          (height) => {
            return validateHeight(height) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: heights outside range should be invalid', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.double({ min: -100, max: 49.99, noNaN: true }),
            fc.double({ min: 250.01, max: 400, noNaN: true })
          ),
          (height) => {
            return validateHeight(height) === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Weight Validation', () => {
    it('should accept valid weights', () => {
      expect(validateWeight(70)).toBe(true);
      expect(validateWeight(10)).toBe(true);
      expect(validateWeight(300)).toBe(true);
      expect(validateWeight(65.5)).toBe(true);
    });

    it('should reject invalid weights', () => {
      expect(validateWeight(9)).toBe(false);
      expect(validateWeight(301)).toBe(false);
      expect(validateWeight(0)).toBe(false);
      expect(validateWeight(-5)).toBe(false);
      expect(validateWeight('xyz')).toBe(false);
    });

    it('property: weights in range [10, 300] should be valid', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 10, max: 300, noNaN: true }),
          (weight) => {
            return validateWeight(weight) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: weights outside range should be invalid', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.double({ min: -100, max: 9.99, noNaN: true }),
            fc.double({ min: 300.01, max: 400, noNaN: true })
          ),
          (weight) => {
            return validateWeight(weight) === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Age Validation', () => {
    it('should accept valid ages', () => {
      expect(validateAge(30)).toBe(true);
      expect(validateAge(1)).toBe(true);
      expect(validateAge(120)).toBe(true);
      expect(validateAge(25)).toBe(true);
    });

    it('should reject invalid ages', () => {
      expect(validateAge(0)).toBe(false);
      expect(validateAge(121)).toBe(false);
      expect(validateAge(-5)).toBe(false);
      expect(validateAge('abc')).toBe(false);
    });

    it('property: ages in range [1, 120] should be valid', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 120 }),
          (age) => {
            return validateAge(age) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: ages outside range should be invalid', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ min: -1000, max: 0 }),
            fc.integer({ min: 121, max: 1000 })
          ),
          (age) => {
            return validateAge(age) === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Combined Validation', () => {
    it('should validate all fields correctly', () => {
      const validData = {
        heightCm: 170,
        weightKg: 70,
        age: 30
      };

      expect(validateHeight(validData.heightCm)).toBe(true);
      expect(validateWeight(validData.weightKg)).toBe(true);
      expect(validateAge(validData.age)).toBe(true);
    });

    it('should reject if any field is invalid', () => {
      const invalidData = {
        heightCm: 300, // invalid
        weightKg: 70,
        age: 30
      };

      expect(validateHeight(invalidData.heightCm)).toBe(false);
    });

    it('property: valid combinations should all pass', () => {
      fc.assert(
        fc.property(
          fc.record({
            height: fc.float({ min: 50, max: 250, noNaN: true }),
            weight: fc.float({ min: 10, max: 300, noNaN: true }),
            age: fc.integer({ min: 1, max: 120 })
          }),
          (data) => {
            return (
              validateHeight(data.height) &&
              validateWeight(data.weight) &&
              validateAge(data.age)
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
