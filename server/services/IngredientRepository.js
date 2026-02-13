import Ingredient from '../models/Ingredient.js';

// 냉동실에 보관하는 재료 목록
const FREEZER_INGREDIENTS = [
  // 육류
  '소고기', '돼지고기', '닭고기', '닭가슴살', '삼겹살', '목살', '등심', '안심',
  '갈비', '사태', '양지', '우둔', '채끝', '스테이크', '다짐육', '다진고기',
  // 해산물
  '생선', '연어', '고등어', '참치', '삼치', '갈치', '명태', '동태', '대구',
  '새우', '오징어', '낙지', '문어', '조개', '홍합', '굴', '게', '랍스터',
  // 가공육
  '베이컨', '소시지', '햄', '핫도그', '치킨너겟', '돈까스', '함박스테이크',
  // 냉동식품
  '만두', '피자', '냉동밥', '냉동볶음밥', '냉동국', '냉동찌개', '냉동면',
  '냉동야채', '냉동과일', '냉동딸기', '냉동블루베리', '냉동망고',
  // 기타
  '아이스크림', '얼음', '냉동떡', '냉동빵', '냉동도우'
];

// 재료 이름으로 카테고리 자동 판단
function autoCategorizeIngredient(name) {
  const lowerName = name.toLowerCase().trim();
  
  // 냉동 관련 키워드가 있으면 냉동실
  if (lowerName.includes('냉동') || lowerName.includes('얼린')) {
    return 'freezer';
  }
  
  // 냉동실 재료 목록에 포함되어 있는지 확인
  for (const freezerItem of FREEZER_INGREDIENTS) {
    if (lowerName.includes(freezerItem.toLowerCase()) || freezerItem.toLowerCase().includes(lowerName)) {
      return 'freezer';
    }
  }
  
  // 기본값은 냉장실
  return 'fridge';
}

class IngredientRepository {
  /**
   * Get count of ingredients in user's fridge
   * @param {string} userId 
   * @returns {Promise<{success: boolean, data?: number, error?: string}>}
   */
  async getIngredientCount(userId) {
    try {
      const count = await Ingredient.countDocuments({ userId });
      return { success: true, data: count };
    } catch (error) {
      return { success: false, error: 'CountFailed' };
    }
  }

  /**
   * Get all ingredients for user
   * @param {string} userId 
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getIngredients(userId) {
    try {
      const ingredients = await Ingredient.find({ userId });
      return { success: true, data: ingredients };
    } catch (error) {
      return { success: false, error: 'RetrieveFailed' };
    }
  }

  /**
   * Add ingredient to user's fridge
   * @param {string} userId 
   * @param {object} ingredient 
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async addIngredient(userId, ingredient) {
    try {
      // 카테고리가 지정되지 않았으면 자동 분류
      if (!ingredient.category) {
        ingredient.category = autoCategorizeIngredient(ingredient.name);
      }
      
      const newIngredient = await Ingredient.create({
        userId,
        ...ingredient
      });
      return { success: true, data: newIngredient };
    } catch (error) {
      return { success: false, error: 'AddFailed' };
    }
  }

  /**
   * Remove ingredient from user's fridge
   * @param {string} userId 
   * @param {string} ingredientId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async removeIngredient(userId, ingredientId) {
    try {
      await Ingredient.deleteOne({ _id: ingredientId, userId });
      return { success: true };
    } catch (error) {
      return { success: false, error: 'RemoveFailed' };
    }
  }

  /**
   * Update ingredient quantity
   * @param {string} userId 
   * @param {string} ingredientId 
   * @param {number} quantity 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateIngredient(userId, ingredientId, quantity) {
    try {
      await Ingredient.findOneAndUpdate(
        { _id: ingredientId, userId },
        { quantity },
        { new: true }
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: 'UpdateFailed' };
    }
  }
}

export default new IngredientRepository();
