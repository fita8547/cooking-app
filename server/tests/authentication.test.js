import { describe, it, expect } from 'vitest';
import AuthenticationService from '../services/AuthenticationService.js';
import User from '../models/User.js';
import OnboardingStatus from '../models/OnboardingStatus.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Authentication Service - Unit Tests', () => {
  describe('Edge Cases', () => {
    it('should handle malformed email addresses', async () => {
      const result = await AuthenticationService.login('not-an-email', 'password123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('InvalidCredentials');
    });

    it('should handle empty credentials', async () => {
      const result1 = await AuthenticationService.login('', 'password123');
      const result2 = await AuthenticationService.login('test-empty@example.com', '');
      
      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });

    it('should handle very long passwords', async () => {
      const email = 'longpass@example.com';
      const longPassword = 'a'.repeat(1000);
      const hashedPassword = await bcrypt.hash(longPassword, 10);
      
      const user = await User.create({
        email,
        password: hashedPassword,
        name: 'Test User'
      });

      await OnboardingStatus.create({
        userId: user._id,
        isComplete: false,
        healthInfoProvided: false
      });

      const result = await AuthenticationService.login(email, longPassword);
      
      expect(result.success).toBe(true);
    });

    it('should handle duplicate registration attempts', async () => {
      const email = 'duplicate@example.com';
      const password = 'password123';
      const name = 'Test User';

      // First registration
      const result1 = await AuthenticationService.register(email, password, name);
      expect(result1.success).toBe(true);

      // Second registration with same email
      const result2 = await AuthenticationService.register(email, password, name);
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('UserAlreadyExists');
    });

    it('should handle session expiration', async () => {
      const email = 'expired@example.com';
      
      // Create expired token
      const expiredToken = jwt.sign(
        { userId: '507f1f77bcf86cd799439011', email },
        process.env.JWT_SECRET || 'default-secret-key',
        { expiresIn: '0s' } // Expired immediately
      );

      // Wait a bit to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await AuthenticationService.restoreSession(expiredToken);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('ExpiredSession');
    });

    it('should handle malformed JWT tokens', async () => {
      const malformedTokens = [
        'not.a.token',
        'invalid-token',
        '',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
        'Bearer token123'
      ];

      for (const token of malformedTokens) {
        const result = await AuthenticationService.restoreSession(token);
        expect(result.success).toBe(false);
        expect(result.error).toBe('InvalidToken');
      }
    });

    it('should handle token with non-existent user', async () => {
      const nonExistentUserId = '507f1f77bcf86cd799439011';
      const token = jwt.sign(
        { userId: nonExistentUserId, email: 'ghost@example.com' },
        process.env.JWT_SECRET || 'default-secret-key',
        { expiresIn: '7d' }
      );

      const result = await AuthenticationService.restoreSession(token);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('InvalidToken');
    });

    it('should handle case-insensitive email login', async () => {
      const email = 'CaseTest@Example.COM';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        name: 'Test User'
      });

      await OnboardingStatus.create({
        userId: user._id,
        isComplete: false,
        healthInfoProvided: false
      });

      // Try login with different case
      const result = await AuthenticationService.login('casetest@example.com', password);
      
      expect(result.success).toBe(true);
    });

    it('should handle special characters in name', async () => {
      const testCases = [
        { name: '김철수', email: 'kim@example.com' },
        { name: 'José García', email: 'jose@example.com' },
        { name: "O'Brien", email: 'obrien@example.com' },
        { name: 'Anne-Marie', email: 'annemarie@example.com' },
        { name: '李明', email: 'li@example.com' },
        { name: 'Müller', email: 'muller@example.com' }
      ];

      for (const { name, email } of testCases) {
        const password = 'password123';

        const result = await AuthenticationService.register(email, password, name);
        
        expect(result.success).toBe(true);
        expect(result.data.name).toBe(name);
      }
    });

    it('should create onboarding status when registering', async () => {
      const email = 'onboarding@example.com';
      const password = 'password123';
      const name = 'Test User';

      const result = await AuthenticationService.register(email, password, name);
      
      expect(result.success).toBe(true);

      // Verify onboarding status was created
      const user = await User.findOne({ email });
      const onboardingStatus = await OnboardingStatus.findOne({ userId: user._id });
      
      expect(onboardingStatus).toBeDefined();
      expect(onboardingStatus.isComplete).toBe(false);
    });

    it('should handle logout successfully', async () => {
      const result = await AuthenticationService.logout();
      
      expect(result.success).toBe(true);
    });

    it('should include onboarding status in login response', async () => {
      const email = 'status@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await User.create({
        email,
        password: hashedPassword,
        name: 'Test User'
      });

      // Create completed onboarding status
      await OnboardingStatus.create({
        userId: user._id,
        isComplete: true,
        healthInfoProvided: true,
        completedAt: new Date()
      });

      const result = await AuthenticationService.login(email, password);
      
      expect(result.success).toBe(true);
      expect(result.data.onboardingComplete).toBe(true);
    });

    it('should handle missing onboarding status gracefully', async () => {
      const email = 'nostatus@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await User.create({
        email,
        password: hashedPassword,
        name: 'Test User'
      });

      // Don't create onboarding status

      const result = await AuthenticationService.login(email, password);
      
      expect(result.success).toBe(true);
      expect(result.data.onboardingComplete).toBe(false);
    });
  });
});
