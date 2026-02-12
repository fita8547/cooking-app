import OnboardingStatus from '../models/OnboardingStatus.js';
import HealthInformationRepository from './HealthInformationRepository.js';

class OnboardingService {
  /**
   * Get current onboarding status for user
   * @param {string} userId 
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async getOnboardingStatus(userId) {
    try {
      const status = await OnboardingStatus.findOne({ userId });
      if (!status) {
        return { success: false, error: 'StatusNotFound' };
      }
      return { success: true, data: status };
    } catch (error) {
      return { success: false, error: 'RetrieveFailed' };
    }
  }

  /**
   * Mark onboarding as complete
   * @param {string} userId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async completeOnboarding(userId) {
    try {
      await OnboardingStatus.findOneAndUpdate(
        { userId },
        { 
          isComplete: true,
          completedAt: new Date()
        },
        { upsert: true }
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: 'UpdateFailed' };
    }
  }

  /**
   * Save health information (optional step)
   * @param {string} userId 
   * @param {object} healthInfo 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async saveHealthInformation(userId, healthInfo) {
    try {
      // Transform allergies from object array to ensure consistency
      // The allergies are already in object format from QuickHealthInfo
      // but we need to ensure they match the schema
      if (healthInfo.allergies && Array.isArray(healthInfo.allergies)) {
        healthInfo.allergies = healthInfo.allergies.map(allergy => {
          // If already an object with required fields, keep it
          if (typeof allergy === 'object' && allergy !== null && allergy.id) {
            return allergy;
          }
          // If string, convert to object (shouldn't happen from QuickHealthInfo)
          if (typeof allergy === 'string') {
            return {
              id: allergy.toLowerCase().replace(/\s+/g, '_'),
              name: allergy,
              nameKo: allergy,
              severity: 'Moderate'
            };
          }
          return allergy;
        });
      }

      // Save health information
      const saveResult = await HealthInformationRepository.save(userId, healthInfo);
      if (!saveResult.success) {
        return saveResult;
      }

      // Update onboarding status
      await OnboardingStatus.findOneAndUpdate(
        { userId },
        { healthInfoProvided: true },
        { upsert: true }
      );

      return { success: true };
    } catch (error) {
      console.error('Save health information error:', error);
      return { success: false, error: 'SaveFailed' };
    }
  }

  /**
   * Skip health information step
   * @param {string} userId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async skipHealthInformation(userId) {
    try {
      await OnboardingStatus.findOneAndUpdate(
        { userId },
        { healthInfoProvided: false },
        { upsert: true }
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: 'UpdateFailed' };
    }
  }

  /**
   * Check if health information was provided
   * @param {string} userId 
   * @returns {Promise<{success: boolean, data?: boolean, error?: string}>}
   */
  async hasHealthInformation(userId) {
    try {
      const result = await HealthInformationRepository.exists(userId);
      return result;
    } catch (error) {
      return { success: false, error: 'CheckFailed' };
    }
  }
}

export default new OnboardingService();
