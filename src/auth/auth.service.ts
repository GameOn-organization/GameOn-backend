import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { FIRESTORE } from '../firebase/firebase.providers';
import { GoogleAuthDto, EmailSignupDto, EmailLoginDto } from './dto/auth.dto';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  constructor(@Inject(FIRESTORE) private readonly db: any) { }

  async googleAuth(googleAuthDto: GoogleAuthDto) {
    try {
      // Para teste no emulador, aceitar token especial
      if (googleAuthDto.idToken === 'test-token') {
        const user = {
          uid: 'test-uid-123',
          email: 'teste@gmail.com',
          name: 'Usuário Teste Google',
          picture: undefined,
        };

        // Criar/atualizar perfil do usuário
        await this.upsertUserProfile(user);

        return {
          message: 'Google authentication successful (test mode)',
          user,
          token: 'test-token',
        };
      }

      const decodedToken = await admin
        .auth()
        .verifyIdToken(googleAuthDto.idToken);

      if (!decodedToken.email_verified) {
        throw new UnauthorizedException('Email not verified');
      }

      const user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        name: decodedToken.name || 'Usuário',
        picture: decodedToken.picture,
      };

      // Criar/atualizar perfil do usuário
      await this.upsertUserProfile(user);

      return {
        message: 'Google authentication successful',
        user,
        // O front pode continuar usando o mesmo idToken
        token: googleAuthDto.idToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  async emailSignup(emailSignupDto: EmailSignupDto) {
    try {
      console.log('🟡 [AUTH SERVICE] emailSignup iniciado');
      console.log('🟡 [AUTH SERVICE] Dados recebidos:', {
        email: emailSignupDto.email,
        name: emailSignupDto.name,
        age: emailSignupDto.age,
        phone: emailSignupDto.phone ? '***' : undefined
      });
      
      console.log('🟡 [AUTH SERVICE] Criando usuário no Firebase Auth...');
      const userRecord = await admin.auth().createUser({
        email: emailSignupDto.email,
        password: emailSignupDto.password,
        displayName: emailSignupDto.name,
        emailVerified: false, // Usuário precisará verificar email
      });
      
      console.log('✅ [AUTH SERVICE] Usuário criado no Firebase Auth:', userRecord.uid);

      const user = {
        uid: userRecord.uid,
        email: userRecord.email || emailSignupDto.email,
        name: emailSignupDto.name,
        picture: undefined,
        phone: emailSignupDto.phone,
        age: emailSignupDto.age,
      };

      // Criar perfil do usuário
      console.log('🟡 [AUTH SERVICE] Criando perfil no Firestore...');
      await this.upsertUserProfile(user);
      console.log('✅ [AUTH SERVICE] Perfil criado no Firestore');

      // Gerar custom token para login imediato
      console.log('🟡 [AUTH SERVICE] Gerando custom token...');
      const customToken = await admin.auth().createCustomToken(userRecord.uid);
      console.log('✅ [AUTH SERVICE] Custom token gerado');

      const result = {
        message: 'User created successfully',
        user: {
          uid: userRecord.uid,
          email: userRecord.email || emailSignupDto.email,
          displayName: emailSignupDto.name,
        },
        customToken, // Front deve trocar por idToken
      };
      
      console.log('✅ [AUTH SERVICE] Signup concluído com sucesso');
      return result;
    } catch (error: any) {
      console.error('❌ [AUTH SERVICE] Erro ao criar usuário:', error);
      console.error('❌ [AUTH SERVICE] Código do erro:', error.code);
      console.error('❌ [AUTH SERVICE] Mensagem:', error.message);
      console.error('❌ [AUTH SERVICE] Stack:', error.stack);
      
      if (error.code === 'auth/email-already-exists') {
        console.error('❌ [AUTH SERVICE] Email já existe');
        throw new ConflictException('Email already registered');
      }
      throw new UnauthorizedException('Failed to create user');
    }
  }

  async emailLogin(emailLoginDto: EmailLoginDto) {
    try {
      // Buscar usuário por email
      const userRecord = await admin.auth().getUserByEmail(emailLoginDto.email);

      // Gerar custom token (front deve trocar por idToken com signInWithCustomToken)
      const customToken = await admin.auth().createCustomToken(userRecord.uid);

      const user = {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        picture: userRecord.photoURL,
      };

      return {
        message: 'Login successful',
        user,
        customToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  private async upsertUserProfile(user: {
    uid: string;
    email: string;
    name: string;
    picture?: string;
    phone?: string;
    age?: number;
  }) {
    const profileRef = this.db.collection('profiles').doc(user.uid);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      const initialProfile: Record<string, any> = {
        id: user.uid,
        name: user.name || 'Usuário',
        age: user.age || 0,
        email: user.email,
        image: user.picture || null,
        tags: [],
      };
      
      // Só adicionar phone se tiver valor
      if (user.phone !== undefined) {
        initialProfile.phone = user.phone;
      }
      
      await profileRef.set(initialProfile);
    } else {
      const updates: any = {};
      if (user.name && user.name !== profileDoc.data()?.name) {
        updates.name = user.name;
      }
      if (
        user.picture !== undefined &&
        user.picture !== profileDoc.data()?.image
      ) {
        updates.image = user.picture;
      }
      if (user.phone !== undefined && user.phone !== profileDoc.data()?.phone) {
        updates.phone = user.phone;
      }
      if (Object.keys(updates).length > 0) {
        await profileRef.update(updates as Record<string, any>);
      }
    }
  }
}
