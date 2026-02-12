import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Recipe from './server/models/Recipe.js';
import IngredientMatcherService from './server/services/IngredientMatcherService.js';

dotenv.config();

async function testRecommendation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB 연결 성공\n');

    // 1. 레시피 가져오기
    const recipes = await Recipe.find().limit(10).lean();
    console.log(`📚 레시피 개수: ${recipes.length}\n`);

    // 2. 사용자 재료
    const userIngredients = ['김치', '돼지고기', '두부', '파'];
    console.log(`🥬 사용자 재료: ${userIngredients.join(', ')}\n`);

    // 3. 각 레시피 확인
    for (const recipe of recipes) {
      console.log(`\n📖 레시피: ${recipe.name}`);
      console.log(`   재료: ${recipe.ingredients.map(i => i.name).join(', ')}`);
      
      const missing = IngredientMatcherService.identifyMissingIngredients(recipe, userIngredients);
      console.log(`   부족한 재료: ${missing.length > 0 ? missing.join(', ') : '없음'}`);
      console.log(`   매칭 타입: ${missing.length === 0 ? '정확한 매칭' : '확장 매칭'}`);
    }

    // 4. 카테고리화
    console.log('\n\n=== 카테고리화 결과 ===');
    const categorized = IngredientMatcherService.categorizeRecipes(recipes, userIngredients);
    console.log(`정확한 매칭: ${categorized.exactMatches.length}개`);
    console.log(`확장 매칭: ${categorized.extendedMatches.length}개`);

    if (categorized.exactMatches.length > 0) {
      console.log('\n정확한 매칭 레시피:');
      categorized.exactMatches.forEach(r => console.log(`  - ${r.name}`));
    }

    if (categorized.extendedMatches.length > 0) {
      console.log('\n확장 매칭 레시피:');
      categorized.extendedMatches.slice(0, 3).forEach(r => {
        console.log(`  - ${r.name} (부족: ${r.missingIngredients.join(', ')})`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ 에러:', error);
    process.exit(1);
  }
}

testRecommendation();
