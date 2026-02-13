import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
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
  preferences: {
    dietaryRestrictions: [String],
    favoriteIngredients: [String],
    dislikedIngredients: [String]
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB 연결 성공');

    // 기존 admin 계정 확인
    const existingAdmin = await User.findOne({ email: 'admin@adcookingclass.com' });
    
    if (existingAdmin) {
      console.log('관리자 계정이 이미 존재합니다.');
      
      // 비밀번호 업데이트
      const hashedPassword = await bcrypt.hash('admin1234', 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.isEmailVerified = true;
      existingAdmin.isPremium = true;
      existingAdmin.isAdmin = true;
      await existingAdmin.save();
      
      console.log('관리자 계정 비밀번호가 업데이트되었습니다.');
    } else {
      // 새 관리자 계정 생성
      const hashedPassword = await bcrypt.hash('admin1234', 10);
      
      const adminUser = new User({
        email: 'admin@adcookingclass.com',
        password: hashedPassword,
        name: '관리자',
        isEmailVerified: true,
        isPremium: true,
        isAdmin: true
      });

      await adminUser.save();
      console.log('관리자 계정이 생성되었습니다.');
    }

    console.log('\n=== 관리자 계정 정보 ===');
    console.log('아이디: admin');
    console.log('비밀번호: admin1234');
    console.log('이메일: admin@adcookingclass.com');
    console.log('=======================\n');

    await mongoose.disconnect();
    console.log('MongoDB 연결 종료');
  } catch (error) {
    console.error('에러 발생:', error);
    process.exit(1);
  }
}

createAdminUser();
