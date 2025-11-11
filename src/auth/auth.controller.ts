import { Controller, Post, UsePipes, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  GoogleAuthDto,
  GoogleAuthSchema,
  EmailSignupDto,
  EmailSignupSchema,
  EmailLoginDto,
  EmailLoginSchema,
} from './dto/auth.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @UsePipes(new ZodValidationPipe(GoogleAuthSchema))
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto) {
    return this.authService.googleAuth(googleAuthDto);
  }

  @Post('signup')
  @UsePipes(new ZodValidationPipe(EmailSignupSchema))
  async emailSignup(@Body() emailSignupDto: EmailSignupDto) {
    console.log('🟢 [AUTH CONTROLLER] POST /auth/signup recebido');
    console.log('🟢 [AUTH CONTROLLER] Dados recebidos:', {
      email: emailSignupDto.email,
      name: emailSignupDto.name,
      age: emailSignupDto.age,
      phone: emailSignupDto.phone ? '***' : undefined,
      password: '***'
    });
    console.log('🟢 [AUTH CONTROLLER] Chamando authService.emailSignup...');
    
    try {
      const result = await this.authService.emailSignup(emailSignupDto);
      console.log('✅ [AUTH CONTROLLER] Signup concluído com sucesso');
      console.log('✅ [AUTH CONTROLLER] User ID:', result.user?.uid);
      return result;
    } catch (error: any) {
      console.error('❌ [AUTH CONTROLLER] Erro no signup:', error);
      console.error('❌ [AUTH CONTROLLER] Tipo do erro:', error.constructor.name);
      console.error('❌ [AUTH CONTROLLER] Mensagem:', error.message);
      console.error('❌ [AUTH CONTROLLER] Stack:', error.stack);
      throw error;
    }
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(EmailLoginSchema))
  async emailLogin(@Body() emailLoginDto: EmailLoginDto) {
    console.log('🟢 [AUTH CONTROLLER] POST /auth/login recebido');
    console.log('🟢 [AUTH CONTROLLER] Email:', emailLoginDto.email);
    
    try {
      const result = await this.authService.emailLogin(emailLoginDto);
      console.log('✅ [AUTH CONTROLLER] Login concluído com sucesso');
      console.log('✅ [AUTH CONTROLLER] User ID:', result.user?.uid);
      return result;
    } catch (error: any) {
      console.error('❌ [AUTH CONTROLLER] Erro no login:', error);
      console.error('❌ [AUTH CONTROLLER] Mensagem:', error.message);
      throw error;
    }
  }
}
