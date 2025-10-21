# JWT Token Service

Servicio JWT reutilizable para manejar operaciones genéricas de tokens JWT en toda la aplicación.

## 📋 Descripción

El `JwtTokenService` proporciona funcionalidades JWT genéricas que pueden ser utilizadas por diferentes módulos que necesiten generar o validar tokens JWT. Este servicio se encuentra en la capa compartida (`shared/applications/services`) para facilitar su reutilización.

## ✨ Características

- ✅ Generación de access tokens
- ✅ Generación de tokens temporales para acciones específicas (forgot password, reset password, refresh token)
- ✅ Validación de tokens JWT con manejo de errores específico
- ✅ Manejo de excepciones de dominio apropiadas
- ✅ Logging comprehensivo de todas las operaciones
- ✅ Soporte para múltiples tipos de tokens temporales
- ✅ Configuración tipada y centralizada

## 🏗️ Arquitectura

### Separación de Responsabilidades

1. **`JwtTokenService`** (Shared Layer):
   - Operaciones JWT genéricas
   - Generación y validación de tokens
   - Reutilizable en toda la aplicación
   - No contiene lógica de negocio específica

2. **Módulos de negocio** (Auth, User, etc.):
   - Utilizan el servicio compartido
   - Implementan lógica de negocio específica
   - Gestionan persistencia de tokens cuando sea necesario

## 📦 Componentes Implementados

### 1. Configuración JWT (`src/config/jwt.config.ts`)

Configuración centralizada con todas las opciones de JWT:

```typescript
export type JwtConfig = {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
  issuer: string;
  audience: string;
  tempTokens: {
    forgotPassword: string;
    resetPassword: string;
    refreshToken: string;
  };
};
```

### 2. Tipos de Dominio

#### JwtPayload (`src/shared/domain/types/jwt.types.ts`)

```typescript
interface JwtPayload {
  sub: string; // User ID
  user: UserEntity; // Complete user entity
  iat?: number; // Issued at
  exp?: number; // Expiration time
}
```

#### TempTokenPayload

```typescript
interface TempTokenPayload extends JwtPayload {
  sub: string; // UUID for database validation
  type: JwtTempTokenType; // Type of temporary token
}
```

#### JwtTempTokenType Enum (`src/shared/domain/enums/jwt.enum.ts`)

```typescript
enum JwtTempTokenType {
  FORGOT_PASSWORD = 'forgot_password',
  RESET_PASSWORD = 'reset_password',
  REFRESH_TOKEN = 'refresh_token',
}
```

### 3. Excepciones de Dominio (`src/shared/domain/errors/jwt.error.ts`)

- `TokenExpiredDomainException`: Token expirado (401)
- `InvalidTokenDomainException`: Token inválido o malformado (401)

### 4. Servicio JWT (`src/shared/applications/services/jwt-token.service.ts`)

#### Métodos Públicos

##### `generateAccessToken(user: UserEntity): Promise<string>`

Genera un access token JWT para autenticación de API.

```typescript
const accessToken = await jwtTokenService.generateAccessToken(user);
```

##### `generateTempToken(sub: string, user: UserEntity, type: JwtTempTokenType): Promise<string>`

Genera un token temporal para acciones específicas.

```typescript
const resetToken = await jwtTokenService.generateTempToken(
  tokenId,
  user,
  JwtTempTokenType.RESET_PASSWORD,
);
```

##### `validateToken<T>(token: string): Promise<T>`

Valida y verifica un token JWT.

```typescript
try {
  const payload = await jwtTokenService.validateToken<JwtPayload>(token);
  console.log('User ID:', payload.sub);
} catch (error) {
  if (error instanceof TokenExpiredDomainException) {
    // Handle expired token
  } else if (error instanceof InvalidTokenDomainException) {
    // Handle invalid token
  }
}
```

## 🚀 Uso en Módulos

### Módulo de Autenticación (Auth)

El módulo de autenticación utiliza el servicio compartido para generar y validar tokens:

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    // otros servicios...
  ) {}

  async signIn(credentials: SignInDto): Promise<AuthResponse> {
    // Validar credenciales...
    const user = await this.validateCredentials(credentials);

    // Generar tokens usando el servicio compartido
    const accessToken = await this.jwtTokenService.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    return {
      token: accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
    };
  }
}
```

### Módulo de Usuario (User)

Uso del servicio para tokens de verificación:

```typescript
@Injectable()
export class UserVerificationService {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    // otros servicios...
  ) {}

  async generateEmailVerificationToken(user: UserEntity): Promise<string> {
    const tokenId = uuidv4(); // Generar UUID para validación en DB

    return this.jwtTokenService.generateTempToken(tokenId, user, JwtTempTokenType.RESET_PASSWORD);
  }

  async verifyEmailToken(token: string): Promise<UserEntity> {
    const payload = await this.jwtTokenService.validateToken<TempTokenPayload>(token);

    // Validar tipo de token
    if (payload.type !== JwtTempTokenType.RESET_PASSWORD) {
      throw new InvalidTokenDomainException();
    }

    return payload.user;
  }
}
```

## ⚙️ Configuración

### Variables de Entorno

Configura las siguientes variables en tu archivo `.env`:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=nestjs-auth-api
JWT_AUDIENCE=nestjs-auth-client

# Temporary Tokens
JWT_TEMP_TOKEN_FORGOT_PASSWORD=15m
JWT_TEMP_TOKEN_RESET_PASSWORD=15m
JWT_TEMP_TOKEN_REFRESH_TOKEN=7d
```

### Registro en SharedModule

El servicio ya está registrado y exportado en `SharedModule`:

```typescript
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      useFactory: createJwtModuleOptions,
      inject: [jwtConfig.KEY],
    }),
  ],
  providers: [JwtTokenService, ...],
  exports: [JwtTokenService, ...],
})
export class SharedModule {}
```

## 🔒 Seguridad

### Mejores Prácticas

1. **Secret Key**:
   - Usa un secret key fuerte y aleatorio en producción
   - Genera con: `openssl rand -base64 64`
   - Nunca commits el secret en el repositorio

2. **Expiración de Tokens**:
   - Access tokens: corta duración (15m - 2h)
   - Refresh tokens: larga duración (7d - 30d)
   - Tokens temporales: muy corta duración (15m - 30m)

3. **Validación**:
   - Siempre valida el tipo de token temporal
   - Verifica issuer y audience
   - Maneja errores de expiración apropiadamente

4. **Almacenamiento**:
   - No almacenes tokens en localStorage (XSS vulnerability)
   - Usa httpOnly cookies cuando sea posible
   - Implementa rotación de refresh tokens

## 📝 Ejemplo Completo

```typescript
import { Injectable } from '@nestjs/common';
import { JwtTokenService } from '@/shared/applications/services';
import { UserEntity } from '@/modules/users/domain/entities';
import { JwtTempTokenType } from '@/shared/domain/enums';
import { TokenExpiredDomainException, InvalidTokenDomainException } from '@/shared/domain/errors';

@Injectable()
export class AuthService {
  constructor(private readonly jwtTokenService: JwtTokenService) {}

  async login(user: UserEntity) {
    // Generar access token
    const accessToken = await this.jwtTokenService.generateAccessToken(user);

    // Generar refresh token
    const refreshTokenId = uuidv4();
    const refreshToken = await this.jwtTokenService.generateTempToken(
      refreshTokenId,
      user,
      JwtTempTokenType.REFRESH_TOKEN,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour
    };
  }

  async validateAccessToken(token: string): Promise<UserEntity> {
    try {
      const payload = await this.jwtTokenService.validateToken(token);
      return payload.user;
    } catch (error) {
      if (error instanceof TokenExpiredDomainException) {
        throw new UnauthorizedException('Token has expired');
      }
      if (error instanceof InvalidTokenDomainException) {
        throw new UnauthorizedException('Invalid token');
      }
      throw error;
    }
  }

  async resetPassword(email: string): Promise<string> {
    const user = await this.findUserByEmail(email);
    const resetTokenId = uuidv4();

    const resetToken = await this.jwtTokenService.generateTempToken(
      resetTokenId,
      user,
      JwtTempTokenType.RESET_PASSWORD,
    );

    // Guardar resetTokenId en DB para validación
    await this.saveResetToken(resetTokenId, user.id);

    return resetToken;
  }
}
```

## 🎯 Ventajas de esta Implementación

1. ✅ **Reutilizable**: Un solo servicio para toda la aplicación
2. ✅ **Type-Safe**: Tipos TypeScript completos
3. ✅ **Testeable**: Servicio enfocado y fácil de probar
4. ✅ **Mantenible**: Configuración centralizada
5. ✅ **Escalable**: Fácil de extender para nuevos tipos de tokens
6. ✅ **SOLID**: Cumple con principios de diseño
7. ✅ **Arquitectura Limpia**: Separación clara de responsabilidades

## 📚 Próximos Pasos

Para completar la implementación de autenticación JWT:

1. Implementar `JwtStrategy` para Passport
2. Crear guards de autenticación (`JwtAuthGuard`, `GqlJwtAuthGuard`)
3. Crear decorador `@CurrentUser()` para extraer usuario del request
4. Implementar repositorio de refresh tokens
5. Implementar lógica de renovación de tokens
6. Agregar autorización basada en roles

## 🤝 Contribución

Este servicio sigue las convenciones y estándares del proyecto. Para modificaciones:

1. Mantén la separación de responsabilidades
2. Agrega pruebas unitarias
3. Actualiza esta documentación
4. Sigue las guías de código del proyecto
