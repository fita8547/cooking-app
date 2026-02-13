// OpenAI API는 이제 백엔드에서 호출합니다
// 프론트엔드에서는 백엔드 API를 호출하기만 하면 됩니다

const API_BASE_URL = '/api'; // Vite 프록시를 통해 자동으로 localhost:3000으로 전달됨

/**
 * 재료 기반 레시피 생성 (백엔드 API 호출)
 * @param {string[]} ingredients - 사용 가능한 재료 목록
 * @param {Object} userProfile - 사용자 건강 프로필
 * @param {string} mode - 'exact' (보유 재료만) 또는 'flexible' (추가 재료 허용)
 * @returns {Promise<Array>} 생성된 레시피 목록
 */
export async function generateRecipes(ingredients, userProfile = {}, mode = 'flexible') {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/ai/generate-recipes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ingredients,
        profile: userProfile,
        mode
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '레시피 생성에 실패했습니다');
    }

    const data = await response.json();
    return data.recipes || [];
  } catch (error) {
    console.error('레시피 생성 오류:', error);
    throw new Error(error.message || '레시피를 생성하는 중 오류가 발생했습니다');
  }
}

/**
 * 이미지에서 재료 인식 (백엔드 API 호출)
 * @param {File} imageFile - 업로드된 이미지 파일
 * @returns {Promise<Array>} 인식된 재료 목록
 */
export async function recognizeIngredients(imageFile) {
  try {
    const token = localStorage.getItem('authToken');
    
    // 이미지를 base64로 변환
    const base64Image = await fileToBase64(imageFile);
    
    const response = await fetch(`${API_BASE_URL}/ai/recognize-ingredients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        imageBase64: base64Image
      })
    });

    if (!response.ok) {
      let errorMessage = '재료 인식에 실패했습니다';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (e) {
        // JSON 파싱 실패 시 상태 코드로 에러 메시지 생성
        errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('JSON 파싱 오류:', e);
      throw new Error('서버 응답을 처리할 수 없습니다. 이미지가 너무 크거나 형식이 올바르지 않을 수 있습니다.');
    }

    return data.ingredients || [];
  } catch (error) {
    console.error('재료 인식 오류:', error);
    throw new Error(error.message || '재료를 인식하는 중 오류가 발생했습니다');
  }
}

/**
 * 파일을 Base64로 변환
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/**
 * API 키 유효성 검사 (항상 true 반환 - 백엔드에서 처리)
 */
export function isApiKeyConfigured() {
  return true; // 백엔드에서 처리하므로 항상 true
}
