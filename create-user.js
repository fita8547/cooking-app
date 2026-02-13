import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  isEmailVerified: Boolean
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB 연결 성공');

    const username = 'jjhhkk';
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 기존 사용자 삭제
    await User.deleteMany({ email: `${username}@user.local` });

    // 새 사용자 생성
    const user = new User({
      email: `${username}@user.local`,
      password: hashedPassword,
      name: username,
      isEmailVerified: true
    });

    await user.save();
    console.log(`✅ 사용자 생성 완료!`);
    console.log(`   아이디: ${username}`);
    console.log(`   비밀번호: ${password}`);

    process.exit(0);
  } catch (error) {
    console.error('에러:', error);
    process.exit(1);
  }
}

createUser();
