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
      console.log('emailSignupDto recebido:', emailSignupDto);
      console.log('Tipo do emailSignupDto:', typeof emailSignupDto);
      console.log('Tentando criar usuário:', emailSignupDto?.email);
      const userRecord = await admin.auth().createUser({
        email: emailSignupDto.email,
        password: emailSignupDto.password,
        displayName: emailSignupDto.name,
        emailVerified: false, // Usuário precisará verificar email
      });

      // Não cria o perfil completo ainda - apenas a conta de autenticação
      // O perfil será criado depois pelo formulário usando o endpoint POST /users

      // Gerar custom token para login imediato
      const customToken = await admin.auth().createCustomToken(userRecord.uid);

      return {
        message: 'User created successfully',
        user: {
          uid: userRecord.uid,
          email: userRecord.email || emailSignupDto.email,
          displayName: emailSignupDto.name,
        },
        customToken, // Front deve trocar por idToken
      };
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      if (error.code === 'auth/email-already-exists') {
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
