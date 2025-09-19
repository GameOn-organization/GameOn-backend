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

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const idToken = authHeader.substring(7);

    try {
      // Para teste no emulador, aceitar token especial
      if (idToken === 'test-token') {
        request.user = {
          uid: 'test-uid-123',
          email: 'teste@gmail.com',
          emailVerified: true,
          name: 'Usuário Teste Google',
          picture: undefined,
        };
        return true;
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Adiciona informações do usuário ao request
      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        name: decodedToken.name,
        picture: decodedToken.picture,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
