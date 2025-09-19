import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthDto, GoogleAuthSchema, EmailSignupDto, EmailSignupSchema, EmailLoginDto, EmailLoginSchema } from './dto/auth.dto';
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
    return this.authService.emailSignup(emailSignupDto);
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(EmailLoginSchema))
  async emailLogin(@Body() emailLoginDto: EmailLoginDto) {
    return this.authService.emailLogin(emailLoginDto);
  }
}
