const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * API 클라이언트 유틸리티
 */
class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  async request(endpoint, options = {}) {
    const token = this.getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new ApiClient();

/**
 * 레시피 추천 요청
 * @param {string[]} ingredients - 사용 가능한 재료 목록
 * @param {Object} healthProfile - 건강 프로필 (선택)
 * @param {string} userId - 사용자 ID (선택)
 * @returns {Promise<Object>} 추천 레시피 결과
 */
export async function fetchRecipeRecommendations(ingredients, healthProfile = null, userId = null) {
  if (!ingredients || ingredients.length === 0) {
    throw new Error('재료를 최소 1개 이상 입력해주세요');
  }

  const body = {
    ingredients,
  };

  if (userId) {
    body.userId = userId;
  }

  if (healthProfile) {
    body.healthProfile = healthProfile;
  }

  return apiClient.post('/recipes/recommend', body);
}

/**
 * 건강 프로필 생성/업데이트
 * @param {Object} profile - 건강 프로필 데이터
 * @returns {Promise<Object>} 생성된 프로필 정보
 */
export async function createHealthProfile(profile) {
  if (!profile.age || !profile.gender || !profile.height || !profile.weight || !profile.dietaryGoal) {
    throw new Error('필수 항목을 모두 입력해주세요');
  }

  if (profile.age <= 0 || profile.height <= 0 || profile.weight <= 0) {
    throw new Error('나이, 키, 몸무게는 0보다 커야 합니다');
  }

  return apiClient.post('/health-info/profile', profile);
}

/**
 * 건강 프로필 조회
 * @returns {Promise<Object>} 건강 프로필 데이터
 */
export async function getHealthProfile() {
  return apiClient.get('/health-info/profile');
}

/**
 * 영양 목표 조회
 * @returns {Promise<Object>} 영양 목표 데이터
 */
export async function getNutritionTargets() {
  return apiClient.get('/health-info/nutrition-targets');
}

/**
 * 건강 정보 존재 여부 확인
 * @returns {Promise<boolean>} 존재 여부
 */
export async function checkHealthProfileExists() {
  try {
    const result = await apiClient.get('/health-info/exists');
    return result.exists || false;
  } catch (error) {
    return false;
  }
}

/**
 * 재료 개수 조회
 * @returns {Promise<number>} 재료 개수
 */
export async function getIngredientCount() {
  try {
    const result = await apiClient.get('/ingredients/count');
    return result.count || 0;
  } catch (error) {
    return 0;
  }
}

export default apiClient;
