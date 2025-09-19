import { Controller, Post, UsePipes } from '@nestjs/common';
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
  async googleAuth(googleAuthDto: GoogleAuthDto) {
    return this.authService.googleAuth(googleAuthDto);
  }

  @Post('signup')
  @UsePipes(new ZodValidationPipe(EmailSignupSchema))
  async emailSignup(emailSignupDto: EmailSignupDto) {
    return this.authService.emailSignup(emailSignupDto);
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(EmailLoginSchema))
  async emailLogin(emailLoginDto: EmailLoginDto) {
    return this.authService.emailLogin(emailLoginDto);
  }
}
