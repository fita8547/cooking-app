import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
  isPro: { type: Boolean, default: false },
  proExpiresAt: { type: Date, default: null },
  polarCustomerId: { type: String, default: null },
  polarSubscriptionId: { type: String, default: null },
  isAdmin: { type: Boolean, default: false },
  healthProfile: {
    age: Number,
    gender: String,
    height: Number,
    weight: Number,
    allergies: [String],
    diseases: [String],
    goal: String
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createTestProUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');

    // 기존 테스트 계정 삭제
    await User.deleteOne({ email: 'jocoding@gmail.com' });
    console.log('🗑️  기존 테스트 계정 삭제');

    // 임시 비밀번호 생성 (사용 안 함)
    const tempPassword = 'test1234';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Pro 테스트 계정 생성
    const testUser = new User({
      email: 'jocoding@gmail.com',
      password: hashedPassword,
      name: '조코딩',
      isEmailVerified: true,
      isPremium: true,
      isPro: true,
      proExpiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100년 후 (사실상 무한)
      isAdmin: false
    });

    await testUser.save();

    console.log('\n✅ Pro 테스트 계정 생성 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 이메일: jocoding@gmail.com');
    console.log('👤 이름: 조코딩');
    console.log('⭐ Pro 구독: 활성화');
    console.log('📅 만료일:', testUser.proExpiresAt.toLocaleDateString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
    console.log('✅ MongoDB 연결 종료');
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

createTestProUser();
