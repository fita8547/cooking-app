import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import bcrypt from 'bcryptjs';

// Mock the models
vi.mock('../models/User.js');
vi.mock('../models/OnboardingStatus.js');

import AuthenticationService from '../services/AuthenticationService.js';
import User from '../models/User.js';
import OnboardingStatus from '../models/OnboardingStatus.js';

describe('Authentication Service - Property-Based Tests', () => {
  // Feature: user-onboarding-navigation-flow, Property 1: Valid credentials grant access
  describe('Property 1: Valid credentials grant access', () => {
    it('should authenticate any user with valid credentials and grant access with session token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 20 }),
          fc.string({ minLength: 2, maxLength: 50 }),
          async (email, password, name) => {
            const userId = '507f1f77bcf86cd799439011';
            const hashedPassword = await bcrypt.hash(password, 10);

            // Mock User.findOne to return a user
            vi.mocked(User.findOne).mockResolvedValueOnce({
              _id: userId,
              email,
              password: hashedPassword,
              name
            });

            // Mock OnboardingStatus.findOne
            vi.mocked(OnboardingStatus.findOne).mockResolvedValueOnce({
              userId,
              isComplete: false,
              healthInfoProvided: false
            });

            // Act: Login with valid credentials
            const result = await AuthenticationService.login(email, password);

            // Assert: Authentication should succeed
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.userId).toBe(userId);
            expect(result.data.token).toBeDefined();
            expect(result.data.email).toBe(email);
            expect(result.data.name).toBe(name);
            expect(typeof result.data.token).toBe('string');
            expect(result.data.token.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: user-onboarding-navigation-flow, Property 2: Invalid credentials deny access
  describe('Property 2: Invalid credentials deny access', () => {
    it('should deny access for any invalid password', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 20 }),
          fc.string({ minLength: 8, maxLength: 20 }),
          fc.string({ minLength: 2, maxLength: 50 }),
          async (email, correctPassword, wrongPassword, name) => {
            // Skip if passwords happen to match
            fc.pre(correctPassword !== wrongPassword);

            const hashedPassword = await bcrypt.hash(correctPassword, 10);

            // Mock User.findOne to return a user with correct password
            vi.mocked(User.findOne).mockResolvedValueOnce({
              _id: '507f1f77bcf86cd799439011',
              email,
              password: hashedPassword,
              name
            });

            // Act: Login with wrong password
            const result = await AuthenticationService.login(email, wrongPassword);

            // Assert: Authentication should fail
            expect(result.success).toBe(false);
            expect(result.error).toBe('InvalidCredentials');
            expect(result.data).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access for any non-existent user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 20 }),
          async (email, password) => {
            // Mock User.findOne to return null (user not found)
            vi.mocked(User.findOne).mockResolvedValueOnce(null);

            // Act: Login with non-existent email
            const result = await AuthenticationService.login(email, password);

            // Assert: Authentication should fail
            expect(result.success).toBe(false);
            expect(result.error).toBe('InvalidCredentials');
            expect(result.data).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: user-onboarding-navigation-flow, Property 3: Registration creates account and initiates onboarding
  describe('Property 3: Registration creates account and initiates onboarding', () => {
    it('should create account and initiate onboarding for any valid registration data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 20 }),
          fc.string({ minLength: 2, maxLength: 50 }),
          async (email, password, name) => {
            const userId = '507f1f77bcf86cd799439011';

            // Mock User.findOne to return null (user doesn't exist)
            vi.mocked(User.findOne).mockResolvedValueOnce(null);

            // Mock User.create
            vi.mocked(User.create).mockResolvedValueOnce({
              _id: userId,
              email,
              name
            });

            // Mock OnboardingStatus.create
            vi.mocked(OnboardingStatus.create).mockResolvedValueOnce({
              userId,
              isComplete: false,
              healthInfoProvided: false
            });

            // Act: Register new user
            const result = await AuthenticationService.register(email, password, name);

            // Assert: Registration should succeed
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.userId).toBe(userId);
            expect(result.data.token).toBeDefined();
            expect(result.data.email).toBe(email);
            expect(result.data.name).toBe(name);
            expect(result.data.onboardingComplete).toBe(false);

            // Verify User.create was called
            expect(User.create).toHaveBeenCalled();
            // Verify OnboardingStatus.create was called
            expect(OnboardingStatus.create).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: user-onboarding-navigation-flow, Property 4: Session persistence across app restarts
  describe('Property 4: Session persistence across app restarts', () => {
    it('should restore session for any valid token without re-authentication', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 20 }),
          fc.string({ minLength: 2, maxLength: 50 }),
          async (email, password, name) => {
            const userId = '507f1f77bcf86cd799439011';
            const hashedPassword = await bcrypt.hash(password, 10);

            // Mock for registration
            vi.mocked(User.findOne).mockResolvedValueOnce(null);
            vi.mocked(User.create).mockResolvedValueOnce({
              _id: userId,
              email,
              name
            });
            vi.mocked(OnboardingStatus.create).mockResolvedValueOnce({
              userId,
              isComplete: false,
              healthInfoProvided: false
            });

            // Register and login to get token
            await AuthenticationService.register(email, password, name);

            // Mock for login
            vi.mocked(User.findOne).mockResolvedValueOnce({
              _id: userId,
              email,
              password: hashedPassword,
              name
            });
            vi.mocked(OnboardingStatus.findOne).mockResolvedValueOnce({
              userId,
              isComplete: false,
              healthInfoProvided: false
            });

            const loginResult = await AuthenticationService.login(email, password);
            const token = loginResult.data.token;

            // Mock for session restore
            vi.mocked(User.findById).mockResolvedValueOnce({
              _id: userId,
              email,
              name
            });
            vi.mocked(OnboardingStatus.findOne).mockResolvedValueOnce({
              userId,
              isComplete: false,
              healthInfoProvided: false
            });

            // Simulate app restart by calling restoreSession
            const restoreResult = await AuthenticationService.restoreSession(token);

            // Assert: Session should be restored
            expect(restoreResult.success).toBe(true);
            expect(restoreResult.data).toBeDefined();
            expect(restoreResult.data.email).toBe(email);
            expect(restoreResult.data.name).toBe(name);
            expect(restoreResult.data.token).toBe(token);
            expect(restoreResult.data.userId).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject any invalid or malformed token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 100 }),
          async (invalidToken) => {
            // Act: Try to restore session with invalid token
            const result = await AuthenticationService.restoreSession(invalidToken);

            // Assert: Session restoration should fail
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/InvalidToken|ExpiredSession/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
