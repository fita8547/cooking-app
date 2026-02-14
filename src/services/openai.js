// OpenAI API는 이제 백엔드에서 호출합니다
// 프론트엔드에서는 백엔드 API를 호출하기만 하면 됩니다

const API_BASE_URL = '/api'; // Vite 프록시 사용

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
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // 토큰이 있을 때만 Authorization 헤더 추가
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/ai/generate-recipes`, {
      method: 'POST',
      headers,
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
 * 이미지 압축 및 리사이즈 (모든 이미지 형식을 JPEG로 변환)
 * @param {File} file - 원본 이미지 파일 (JPG, PNG, WebP, HEIC, GIF 등)
 * @param {number} maxWidth - 최대 너비 (기본: 2048)
 * @param {number} maxHeight - 최대 높이 (기본: 2048)
 * @param {number} quality - 압축 품질 0-1 (기본: 0.8)
 * @returns {Promise<string>} 압축된 JPEG 이미지의 base64 문자열
 */
async function compressImage(file, maxWidth = 2048, maxHeight = 2048, quality = 0.8) {
  return new Promise((resolve, reject) => {
    // 파일 형식 확인
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();
    
    console.log(`📁 파일 정보: ${file.name} (${fileType || 'unknown'}, ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    // 지원하는 이미지 형식 확인
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/heic', 'image/heif'];
    const supportedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'heic', 'heif'];
    
    const isSupported = supportedTypes.includes(fileType) || supportedExtensions.includes(fileExtension);
    
    if (!isSupported && fileType && !fileType.startsWith('image/')) {
      reject(new Error('이미지 파일만 업로드할 수 있습니다.'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // 원본 크기
        let width = img.width;
        let height = img.height;
        
        console.log(`📸 원본 이미지: ${width} × ${height}`);
        
        // 비율 유지하면서 리사이즈
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
          console.log(`🔄 리사이즈: ${width} × ${height}`);
        }
        
        // Canvas에 그리기
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        
        // 흰색 배경 추가 (PNG 투명 배경 처리)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);
        
        // JPEG로 변환 (모든 형식 → JPEG)
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // 압축 후 크기 계산
        const compressedSize = (compressedBase64.length * 3 / 4) / 1024 / 1024;
        console.log(`✅ JPEG 변환 완료: ${compressedSize.toFixed(2)}MB (품질: ${quality * 100}%)`);
        
        resolve(compressedBase64);
      };
      
      img.onerror = () => {
        console.error('❌ 이미지 로드 실패');
        reject(new Error('이미지를 로드할 수 없습니다. 파일이 손상되었거나 지원하지 않는 형식일 수 있습니다.'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      console.error('❌ 파일 읽기 실패');
      reject(new Error('파일을 읽을 수 없습니다.'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * 이미지에서 재료 인식 (백엔드 API 호출)
 * @param {File} imageFile - 업로드된 이미지 파일
 * @returns {Promise<Array>} 인식된 재료 목록
 */
export async function recognizeIngredients(imageFile) {
  try {
    const token = localStorage.getItem('authToken');
    
    // 이미지 압축 및 리사이즈 (최대 2048x2048, 품질 80%)
    console.log('🔄 이미지 압축 중...');
    const base64Image = await compressImage(imageFile, 2048, 2048, 0.8);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // 토큰이 있을 때만 Authorization 헤더 추가
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('📤 API 요청 전송 중...');
    const response = await fetch(`${API_BASE_URL}/ai/recognize-ingredients`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        imageBase64: base64Image
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '재료 인식에 실패했습니다');
    }

    const data = await response.json();
    console.log('✅ 재료 인식 완료:', data.ingredients);
    return data.ingredients || [];
  } catch (error) {
    console.error('❌ 재료 인식 오류:', error);
    throw new Error(error.message || '재료를 인식하는 중 오류가 발생했습니다');
  }
}

/**
 * API 키 유효성 검사 (항상 true 반환 - 백엔드에서 처리)
 */
export function isApiKeyConfigured() {
  return true; // 백엔드에서 처리하므로 항상 true
}
