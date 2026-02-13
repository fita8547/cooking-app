import { Resend } from 'resend';

let resend = null;
if (process.env.RESEND_API_KEY) {
  console.log('✅ Resend API 키 감지됨:', process.env.RESEND_API_KEY.substring(0, 10) + '...');
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.log('⚠️  Resend API 키가 설정되지 않았습니다.');
}

export const sendVerificationEmail = async (email, name, token, code) => {
  if (!resend) {
    console.log('\n📧 [개발 모드] 이메일 인증 코드');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📨 수신자: ${email}`);
    console.log(`👤 이름: ${name}`);
    console.log(`🔑 인증 코드: ${code}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return { success: true, message: 'Development mode - code logged to console' };
  }

  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5175'}/verify-email?token=${token}`;

  try {
    const result = await resend.emails.send({
      from: 'AdCookingClass <noreply@cook.com>',
      to: email,
      subject: '애드쿠킹클래스 이메일 인증',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ff6b6b; font-size: 32px; margin: 0;">🍳 애드쿠킹클래스</h1>
            <p style="color: #636e72; font-size: 16px;">AI가 당신의 요리를 돕습니다</p>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
            <h2 style="color: #2d3436; font-size: 24px; margin-top: 0;">안녕하세요, ${name}님!</h2>
            <p style="color: #636e72; font-size: 16px; line-height: 1.6;">
              애드쿠킹클래스에 가입해주셔서 감사합니다.<br/>
              아래 인증 코드를 입력하여 이메일 인증을 완료해주세요.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: white;
                          border: 2px solid #ff6b6b;
                          border-radius: 12px;
                          padding: 20px;
                          display: inline-block;">
                <p style="color: #95a5a6; font-size: 14px; margin: 0 0 8px 0;">인증 코드</p>
                <p style="color: #ff6b6b; 
                          font-size: 36px; 
                          font-weight: 700; 
                          letter-spacing: 8px;
                          margin: 0;
                          font-family: 'Courier New', monospace;">
                  ${code}
                </p>
              </div>
            </div>
            
            <p style="color: #636e72; font-size: 14px; text-align: center; margin-bottom: 20px;">
              또는 아래 버튼을 클릭하여 자동으로 인증할 수 있습니다.
            </p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
                        color: white;
                        text-decoration: none;
                        padding: 16px 40px;
                        border-radius: 12px;
                        font-size: 16px;
                        font-weight: 600;
                        display: inline-block;">
                자동 인증하기
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #95a5a6; font-size: 14px;">
            <p>이 인증 코드는 24시간 동안 유효합니다.</p>
            <p>본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
          </div>
        </div>
      `
    });
    
    if (result.error) {
      console.error('이메일 전송 실패:', result.error.message);
      return { success: false, error: result.error.message };
    }
    
    console.log('이메일 전송 성공:', result.data?.id);
    return { success: true, emailId: result.data?.id };
  } catch (error) {
    console.error('이메일 전송 예외:', error.message);
    return { success: false, error: error.message };
  }
};;

export const sendPasswordResetEmail = async (email, name, token) => {
  if (!resend) {
    console.log('\n📧 [개발 모드] 비밀번호 재설정');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📨 수신자: ${email}`);
    console.log(`👤 이름: ${name}`);
    console.log(`🔗 토큰: ${token}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return { success: true, message: 'Development mode - token logged to console' };
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5175'}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: 'AdCookingClass <noreply@cook.com>',
      to: email,
      subject: '애드쿠킹클래스 비밀번호 재설정',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ff6b6b; font-size: 32px; margin: 0;">🍳 애드쿠킹클래스</h1>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 12px; padding: 30px;">
            <h2 style="color: #2d3436; font-size: 24px; margin-top: 0;">비밀번호 재설정</h2>
            <p style="color: #636e72; font-size: 16px; line-height: 1.6;">
              ${name}님, 비밀번호 재설정 요청을 받았습니다.<br/>
              아래 버튼을 클릭하여 새 비밀번호를 설정하세요.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
                        color: white;
                        text-decoration: none;
                        padding: 16px 40px;
                        border-radius: 12px;
                        font-size: 16px;
                        font-weight: 600;
                        display: inline-block;">
                비밀번호 재설정
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #95a5a6; font-size: 14px; margin-top: 20px;">
            <p>이 링크는 1시간 동안 유효합니다.</p>
            <p>본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
          </div>
        </div>
      `
    });
    
    return { success: true };
  } catch (error) {
    console.error('이메일 전송 실패:', error);
    return { success: false, error: error.message };
  }
};
