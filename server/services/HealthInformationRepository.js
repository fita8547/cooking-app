import HealthInformation from '../models/HealthInformation.js';
import NutritionCalculator from './NutritionCalculator.js';
import '../types/index.js';

class HealthInformationRepository {
  /**
   * Unit conversion helpers
   * @private
   */
  _convertHeight(height, fromUnit) {
    if (fromUnit === 'in') {
      return height * 2.54; // inches to cm
    }
    return height; // already in cm
  }

  _convertWeight(weight, fromUnit) {
    if (fromUnit === 'lb') {
      return weight * 0.453592; // pounds to kg
    }
    return weight; // already in kg
  }

  /**
   * Create or update health profile with calculated metrics
   * @param {string} userId 
   * @param {import('../types').HealthProfile} profile 
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async createProfile(userId, profile) {
    try {
      // Convert units if needed
      const height = profile.height; // Assume already in cm
      const weight = profile.weight; // Assume already in kg

      // Calculate metrics if we have the required data
      let calculatedMetrics = null;
      if (profile.age && profile.gender && height && weight) {
        calculatedMetrics = NutritionCalculator.calculateAllMetrics({
          age: profile.age,
          gender: profile.gender,
          height: height,
          weight: weight,
          dietaryGoal: profile.dietaryGoal || 'maintenance',
          activityLevel: profile.activityLevel || 'sedentary'
        });
      }

      // Create or update profile
      const healthProfile = await HealthInformation.findOneAndUpdate(
        { userId },
        {
          userId,
          age: profile.age,
          gender: profile.gender,
          height: height,
          weight: weight,
          dietaryRestrictions: profile.dietaryRestrictions || [],
          allergies: profile.allergies || [],
          healthGoals: profile.healthGoals || [],
          dietaryGoal: profile.dietaryGoal,
          medicalConditions: profile.medicalConditions || [],
          calculatedMetrics: calculatedMetrics
        },
        { new: true, upsert: true }
      );

      return { 
        success: true, 
        data: {
          profileId: healthProfile._id,
          calculatedMetrics: calculatedMetrics
        }
      };
    } catch (error) {
      console.error('Create profile error:', error);
      return { success: false, error: 'CreateProfileFailed' };
    }
  }

  /**
   * Get health profile
   * @param {string} userId 
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async getProfile(userId) {
    try {
      const profile = await HealthInformation.findOne({ userId });
      if (!profile) {
        return { success: false, error: 'ProfileNotFound' };
      }
      return { success: true, data: profile };
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, error: 'RetrieveFailed' };
    }
  }

  /**
   * Update health profile
   * @param {string} userId 
   * @param {import('../types').HealthProfile} profile 
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async updateProfile(userId, profile) {
    try {
      // Recalculate metrics if relevant data changed
      let calculatedMetrics = null;
      if (profile.age && profile.gender && profile.height && profile.weight) {
        calculatedMetrics = NutritionCalculator.calculateAllMetrics({
          age: profile.age,
          gender: profile.gender,
          height: profile.height,
          weight: profile.weight,
          dietaryGoal: profile.dietaryGoal || 'maintenance',
          activityLevel: profile.activityLevel || 'sedentary'
        });
      }

      const updateData = { ...profile };
      if (calculatedMetrics) {
        updateData.calculatedMetrics = calculatedMetrics;
      }

      const updatedProfile = await HealthInformation.findOneAndUpdate(
        { userId },
        updateData,
        { new: true }
      );

      if (!updatedProfile) {
        return { success: false, error: 'ProfileNotFound' };
      }

      return { success: true, data: updatedProfile };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'UpdateFailed' };
    }
  }
  /**
   * Save health information
   * @param {string} userId 
   * @param {object} healthInfo 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async save(userId, healthInfo) {
    try {
      await HealthInformation.create({
        userId,
        ...healthInfo
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: 'SaveFailed' };
    }
  }

  /**
   * Retrieve health information
   * @param {string} userId 
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async get(userId) {
    try {
      const healthInfo = await HealthInformation.findOne({ userId });
      return { success: true, data: healthInfo };
    } catch (error) {
      return { success: false, error: 'RetrieveFailed' };
    }
  }

  /**
   * Update health information
   * @param {string} userId 
   * @param {object} healthInfo 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async update(userId, healthInfo) {
    try {
      await HealthInformation.findOneAndUpdate(
        { userId },
        healthInfo,
        { new: true, upsert: true }
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: 'UpdateFailed' };
    }
  }

  /**
   * Check if health information exists
   * @param {string} userId 
   * @returns {Promise<{success: boolean, data?: boolean, error?: string}>}
   */
  async exists(userId) {
    try {
      const count = await HealthInformation.countDocuments({ userId });
      return { success: true, data: count > 0 };
    } catch (error) {
      return { success: false, error: 'CheckFailed' };
    }
  }

  /**
   * Delete health information
   * @param {string} userId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async delete(userId) {
    try {
      await HealthInformation.deleteOne({ userId });
      return { success: true };
    } catch (error) {
      return { success: false, error: 'DeleteFailed' };
    }
  }

  /**
   * Get health goal summary for display
   * @param {string} userId 
   * @returns {Promise<{success: boolean, data?: string, error?: string}>}
   */
  async getHealthGoalSummary(userId) {
    try {
      const healthInfo = await HealthInformation.findOne({ userId });
      if (!healthInfo || healthInfo.healthGoals.length === 0) {
        return { success: true, data: null };
      }

      // Return first health goal's Korean name as summary
      return { success: true, data: healthInfo.healthGoals[0].nameKo };
    } catch (error) {
      return { success: false, error: 'RetrieveFailed' };
    }
  }

  /**
   * Get nutrition targets for a user
   * @param {string} userId 
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async getNutritionTargets(userId) {
    try {
      const profile = await HealthInformation.findOne({ userId });
      if (!profile || !profile.calculatedMetrics) {
        return { success: false, error: 'NoMetricsAvailable' };
      }
      return { 
        success: true, 
        data: profile.calculatedMetrics.macronutrientTargets 
      };
    } catch (error) {
      console.error('Get nutrition targets error:', error);
      return { success: false, error: 'RetrieveFailed' };
    }
  }

  /**
   * Check if user has complete health profile for recommendations
   * @param {string} userId 
   * @returns {Promise<{success: boolean, data?: boolean, error?: string}>}
   */
  async hasCompleteProfile(userId) {
    try {
      const profile = await HealthInformation.findOne({ userId });
      if (!profile) {
        return { success: true, data: false };
      }

      const isComplete = !!(
        profile.age &&
        profile.gender &&
        profile.height &&
        profile.weight &&
        profile.calculatedMetrics
      );

      return { success: true, data: isComplete };
    } catch (error) {
      console.error('Check complete profile error:', error);
      return { success: false, error: 'CheckFailed' };
    }
  }
}

export default new HealthInformationRepository();
