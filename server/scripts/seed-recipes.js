import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Recipe from '../models/Recipe.js';

dotenv.config();

const sampleRecipes = [
  {
    name: '김치찌개',
    description: '한국의 대표적인 찌개 요리',
    ingredients: [
      { name: '김치', amount: '200', unit: 'g' },
      { name: '돼지고기', amount: '150', unit: 'g' },
      { name: '두부', amount: '1/2', unit: '모' },
      { name: '파', amount: '1', unit: '대' },
      { name: '고춧가루', amount: '1', unit: '큰술' }
    ],
    steps: [
      { stepNumber: 1, instruction: '김치를 먹기 좋은 크기로 자른다', duration: 5 },
      { stepNumber: 2, instruction: '돼지고기를 볶다가 김치를 넣고 함께 볶는다', duration: 10 },
      { stepNumber: 3, instruction: '물을 넣고 끓인다', duration: 15 },
      { stepNumber: 4, instruction: '두부와 파를 넣고 한소끔 끓인다', duration: 5 }
    ],
    cookingTime: 35,
    difficulty: '쉬움',
    servings: 2,
    nutrition: {
      calories: 350,
      protein: 25,
      carbs: 15,
      fat: 20,
      sodium: 800
    },
    category: '한식',
    tags: ['찌개', '매운맛', '한식'],
    allergens: ['돼지고기'],
    createdBy: 'admin'
  },
  {
    name: '된장찌개',
    description: '구수한 된장 맛의 찌개',
    ingredients: [
      { name: '된장', amount: '2', unit: '큰술' },
      { name: '두부', amount: '1/2', unit: '모' },
      { name: '파', amount: '1', unit: '대' },
      { name: '감자', amount: '1', unit: '개' },
      { name: '애호박', amount: '1/2', unit: '개' }
    ],
    steps: [
      { stepNumber: 1, instruction: '채소를 먹기 좋은 크기로 자른다', duration: 5 },
      { stepNumber: 2, instruction: '물에 된장을 풀어 끓인다', duration: 10 },
      { stepNumber: 3, instruction: '채소와 두부를 넣고 끓인다', duration: 15 }
    ],
    cookingTime: 30,
    difficulty: '쉬움',
    servings: 2,
    nutrition: {
      calories: 180,
      protein: 12,
      carbs: 20,
      fat: 6,
      sodium: 900
    },
    category: '한식',
    tags: ['찌개', '구수한맛', '한식'],
    allergens: ['콩'],
    createdBy: 'admin'
  },
  {
    name: '제육볶음',
    description: '매콤달콤한 돼지고기 볶음',
    ingredients: [
      { name: '돼지고기', amount: '300', unit: 'g' },
      { name: '양파', amount: '1', unit: '개' },
      { name: '파', amount: '1', unit: '대' },
      { name: '고추장', amount: '2', unit: '큰술' },
      { name: '고춧가루', amount: '1', unit: '큰술' },
      { name: '간장', amount: '1', unit: '큰술' }
    ],
    steps: [
      { stepNumber: 1, instruction: '돼지고기와 양념을 섞어 재운다', duration: 10 },
      { stepNumber: 2, instruction: '양파와 파를 썬다', duration: 5 },
      { stepNumber: 3, instruction: '팬에 고기를 볶다가 채소를 넣는다', duration: 15 }
    ],
    cookingTime: 30,
    difficulty: '보통',
    servings: 2,
    nutrition: {
      calories: 420,
      protein: 35,
      carbs: 18,
      fat: 25,
      sodium: 950
    },
    category: '한식',
    tags: ['볶음', '매운맛', '한식'],
    allergens: ['돼지고기', '콩'],
    createdBy: 'admin'
  },
  {
    name: '계란볶음밥',
    description: '간단하고 맛있는 볶음밥',
    ingredients: [
      { name: '밥', amount: '2', unit: '공기' },
      { name: '계란', amount: '2', unit: '개' },
      { name: '파', amount: '1', unit: '대' },
      { name: '간장', amount: '1', unit: '큰술' },
      { name: '참기름', amount: '1', unit: '작은술' }
    ],
    steps: [
      { stepNumber: 1, instruction: '계란을 풀어 스크램블을 만든다', duration: 3 },
      { stepNumber: 2, instruction: '밥과 파를 넣고 볶는다', duration: 5 },
      { stepNumber: 3, instruction: '간장과 참기름으로 간한다', duration: 2 }
    ],
    cookingTime: 10,
    difficulty: '쉬움',
    servings: 2,
    nutrition: {
      calories: 380,
      protein: 15,
      carbs: 55,
      fat: 12,
      sodium: 600
    },
    category: '한식',
    tags: ['볶음밥', '간단요리'],
    allergens: ['계란', '콩'],
    createdBy: 'admin'
  },
  {
    name: '두부김치',
    description: '고소한 두부와 매콤한 김치의 조화',
    ingredients: [
      { name: '두부', amount: '1', unit: '모' },
      { name: '김치', amount: '150', unit: 'g' },
      { name: '돼지고기', amount: '100', unit: 'g' },
      { name: '파', amount: '1', unit: '대' },
      { name: '참기름', amount: '1', unit: '작은술' }
    ],
    steps: [
      { stepNumber: 1, instruction: '두부를 먹기 좋은 크기로 자른다', duration: 3 },
      { stepNumber: 2, instruction: '돼지고기와 김치를 볶는다', duration: 10 },
      { stepNumber: 3, instruction: '두부를 데쳐서 함께 낸다', duration: 5 }
    ],
    cookingTime: 18,
    difficulty: '쉬움',
    servings: 2,
    nutrition: {
      calories: 280,
      protein: 22,
      carbs: 12,
      fat: 16,
      sodium: 700
    },
    category: '한식',
    tags: ['안주', '매운맛', '한식'],
    allergens: ['돼지고기', '콩'],
    createdBy: 'admin'
  }
];

async function seedRecipes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');

    // 기존 레시피 삭제 (선택사항)
    await Recipe.deleteMany({ createdBy: 'admin' });
    console.log('🗑️  기존 샘플 레시피 삭제');

    // 새 레시피 추가
    await Recipe.insertMany(sampleRecipes);
    console.log(`✅ ${sampleRecipes.length}개의 샘플 레시피 추가 완료`);

    await mongoose.connection.close();
    console.log('👋 데이터베이스 연결 종료');
  } catch (error) {
    console.error('❌ 에러 발생:', error);
    process.exit(1);
  }
}

seedRecipes();
