import mongoose from 'mongoose';
import dotenv from 'dotenv';
import HealthInformation from '../models/HealthInformation.js';

dotenv.config();

async function clearHealthProfiles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB 연결 성공\n');

    // 모든 건강 프로필 삭제
    const result = await HealthInformation.deleteMany({});
    console.log(`🗑️  ${result.deletedCount}개의 건강 프로필 삭제 완료\n`);

    await mongoose.connection.close();
    console.log('👋 데이터베이스 연결 종료');
  } catch (error) {
    console.error('❌ 에러 발생:', error);
    process.exit(1);
  }
}

clearHealthProfiles();
