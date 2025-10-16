import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { FIRESTORE } from '../firebase/firebase.providers';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(FIRESTORE) private readonly db: any) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    console.log('🔍 AuthGuard - URL:', request.url);
    console.log('🔍 AuthGuard - Authorization header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('AuthGuard - Missing or invalid authorization header');
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const idToken = authHeader.substring(7);
    console.log('🔍 AuthGuard - Token extraído:', idToken.substring(0, 50) + '...');

    try {
      // Para teste no emulador, aceitar token especial
      if (idToken === 'test-token') {
        console.log('✅ AuthGuard - Usando token de teste');
        request.user = {
          uid: 'test-uid-123',
          email: 'teste@gmail.com',
          emailVerified: true,
          name: 'Usuário Teste Google',
          picture: undefined,
        };
        return true;
      }

      // Verificar se é um token do emulador Firebase ou custom token
      try {
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        
        // Token do emulador
        if (payload.iss && payload.iss.includes('firebase-auth-emulator')) {
          console.log('✅ AuthGuard - Token do emulador detectado');
          console.log('🔍 AuthGuard - Payload do token:', payload);
          request.user = {
            uid: String(payload.uid || payload.sub),
            email: String(payload.email || 'emulator@example.com'),
            emailVerified: true,
            name: String(payload.name || 'Emulator User'),
            picture: payload.picture,
          };
          console.log('✅ AuthGuard - Usuário configurado:', request.user);
          return true;
        }
        
        // Custom token (para testes/desenvolvimento)
        if (payload.aud && payload.aud.includes('identitytoolkit')) {
          console.log('✅ AuthGuard - Custom token detectado');
          console.log('🔍 AuthGuard - Payload do custom token:', payload);
          
          // Buscar dados do usuário no Firestore
          const userDoc = await this.db.collection('profiles').doc(payload.uid).get();
          const userData = userDoc.exists ? userDoc.data() : null;
          
          request.user = {
            uid: String(payload.uid),
            email: String(userData?.email || 'unknown@example.com'),
            emailVerified: true,
            name: String(userData?.name || 'User'),
            picture: userData?.image,
          };
          console.log('✅ AuthGuard - Usuário configurado do custom token:', request.user);
          return true;
        }
      } catch (error) {
        console.log('⚠️  AuthGuard - Não foi possível decodificar como token especial:', error.message);
        // Se não conseguir decodificar, continuar com validação normal
      }

      // Validação normal de ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Adiciona informações do usuário ao request
      request.user = {
        uid: String(decodedToken.uid),
        email: String(decodedToken.email),
        emailVerified: decodedToken.email_verified,
        name: decodedToken.name,
        picture: decodedToken.picture,
      };

      return true;
    } catch (error) {
      console.log('❌ AuthGuard - Erro na validação do token:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
