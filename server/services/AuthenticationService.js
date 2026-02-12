import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OnboardingStatus from '../models/OnboardingStatus.js';

class AuthenticationService {
  /**
   * Authenticate user with credentials
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async login(email, password) {
    try {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return { success: false, error: 'InvalidCredentials' };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, error: 'InvalidCredentials' };
      }

      // Check onboarding status
      const onboardingStatus = await OnboardingStatus.findOne({ userId: user._id });

      // Generate session token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET || 'default-secret-key',
        { expiresIn: '7d' }
      );

      return {
        success: true,
        data: {
          userId: user._id.toString(),
          token,
          email: user.email,
          name: user.name,
          onboardingComplete: onboardingStatus?.isComplete || false
        }
      };
    } catch (error) {
      return { success: false, error: 'ServerError' };
    }
  }

  /**
   * Register new user
   * @param {string} email 
   * @param {string} password 
   * @param {string} name 
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async register(email, password, name) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return { success: false, error: 'UserAlreadyExists' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        name
      });

      // Create onboarding status
      await OnboardingStatus.create({
        userId: user._id,
        isComplete: false,
        healthInfoProvided: false
      });

      // Generate session token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET || 'default-secret-key',
        { expiresIn: '7d' }
      );

      return {
        success: true,
        data: {
          userId: user._id.toString(),
          token,
          email: user.email,
          name: user.name,
          onboardingComplete: false
        }
      };
    } catch (error) {
      return { success: false, error: 'ServerError' };
    }
  }

  /**
   * Check if user has active session
   * @param {string} token 
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async checkSession(token) {
    return this.restoreSession(token);
  }

  /**
   * Restore session from stored token
   * @param {string} token 
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async restoreSession(token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return { success: false, error: 'InvalidToken' };
      }

      // Check onboarding status
      const onboardingStatus = await OnboardingStatus.findOne({ userId: user._id });

      return {
        success: true,
        data: {
          userId: user._id.toString(),
          token,
          email: user.email,
          name: user.name,
          onboardingComplete: onboardingStatus?.isComplete || false
        }
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { success: false, error: 'ExpiredSession' };
      }
      return { success: false, error: 'InvalidToken' };
    }
  }

  /**
   * End user session (client-side token removal)
   * @returns {Promise<{success: boolean}>}
   */
  async logout() {
    // Logout is primarily client-side (remove token)
    // Server-side can implement token blacklist if needed
    return { success: true };
  }
}

export default new AuthenticationService();
