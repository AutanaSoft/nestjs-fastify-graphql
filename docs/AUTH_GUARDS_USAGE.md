# Auth Guards y Decoradores - Guía de Uso

## 🔐 Sistema de Autenticación Implementado

Este documento explica cómo usar los guards y decoradores de autenticación que se han implementado siguiendo las mejores prácticas de NestJS y Passport.

## 📦 Componentes Disponibles

### Strategies

- **`JwtStrategy`** - Estrategia Passport para validación automática de tokens JWT

### Guards

- **`JwtAuthGuard`** - Para proteger rutas HTTP/REST
- **`GqlJwtAuthGuard`** - Para proteger resolvers GraphQL

### Decoradores

- **`@CurrentUser()`** - Para obtener el usuario autenticado del request

## 🏗️ Arquitectura

El sistema implementado sigue este flujo:

1. **JwtStrategy**: Valida tokens JWT usando el `JwtTokenService` compartido
2. **Guards**: Protegen rutas automáticamente aplicando la estrategia
3. **Decoradores**: Extraen información del usuario autenticado del request
4. **Integración**: Se conecta con el sistema JWT existente y el módulo de usuarios

## 🚀 Ejemplos de Uso

### GraphQL Resolvers

```typescript
import { Query, Resolver, UseGuards } from '@nestjs/graphql';
import { GqlJwtAuthGuard, CurrentUser } from '@/modules/auth';
import { UserEntity } from '@/modules/users/domain/entities';
import { UserDto } from '@/modules/users/application/dto';

@Resolver(() => UserDto)
export class ProfileResolver {
  @UseGuards(GqlJwtAuthGuard)
  @Query(() => UserDto)
  currentUser(@CurrentUser() user: UserEntity): UserDto {
    return {
      id: user.id,
      email: user.email,
      userName: user.userName,
      status: user.status,
      role: user.role,
    };
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => UserDto)
  async profile(@CurrentUser() user: UserEntity): Promise<UserDto> {
    // El usuario ya está autenticado y validado
    // Puedes usarlo directamente en tu lógica de negocio
    return {
      id: user.id,
      email: user.email,
      userName: user.userName,
      status: user.status,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
```

### HTTP Controllers (REST API)

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '@/modules/auth';
import { UserEntity } from '@/modules/users/domain/entities';

@Controller('profile')
export class ProfileController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getProfile(@CurrentUser() user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      userName: user.userName,
      status: user.status,
      role: user.role,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('settings')
  getSettings(@CurrentUser() user: UserEntity) {
    // Acceder a configuraciones del usuario autenticado
    return {
      userId: user.id,
      preferences: {
        // ... preferencias del usuario
      },
    };
  }
}
```

### Uso en Services/Use Cases

```typescript
import { Injectable } from '@nestjs/common';
import { UserEntity } from '@/modules/users/domain/entities';

@Injectable()
export class UserProfileService {
  async updateProfile(user: UserEntity, updateData: UpdateProfileDto) {
    // El usuario ya está autenticado y validado
    // Puedes usar directamente su información
    console.log(`Updating profile for user: ${user.id}`);

    // Lógica de actualización...
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        userName: user.userName,
      },
    };
  }
}
```

## 🔧 Configuración de Headers

Para usar los guards, las requests deben incluir el JWT token en el header Authorization:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Ejemplo con cURL

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/profile
```

### Ejemplo con GraphQL Playground

```json
{
  "headers": {
    "Authorization": "Bearer YOUR_JWT_TOKEN"
  }
}
```

### Ejemplo con Apollo Client

```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://localhost:3000/graphql',
});

const authLink = setContext((_, { headers }) => {
  // Obtener el token del localStorage
  const token = localStorage.getItem('token');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

## 🛡️ Protección de Rutas

### Proteger un Resolver Completo

```typescript
@Resolver(() => UserDto)
@UseGuards(GqlJwtAuthGuard) // Protege todos los métodos
export class UserResolver {
  @Query(() => UserDto)
  currentUser(@CurrentUser() user: UserEntity): UserDto {
    return user;
  }

  @Query(() => [UserDto])
  users(@CurrentUser() user: UserEntity): UserDto[] {
    // Solo usuarios autenticados pueden ver la lista
    return [];
  }
}
```

### Proteger Métodos Específicos

```typescript
@Resolver(() => UserDto)
export class UserResolver {
  @Query(() => UserDto)
  publicInfo(): UserDto {
    // Esta ruta es pública
    return {
      /* ... */
    };
  }

  @UseGuards(GqlJwtAuthGuard) // Solo este método está protegido
  @Query(() => UserDto)
  privateInfo(@CurrentUser() user: UserEntity): UserDto {
    // Solo usuarios autenticados pueden acceder
    return user;
  }
}
```

## 🎯 Ventajas de esta Implementación

1. ✅ **Compatible** con tu arquitectura hexagonal existente
2. ✅ **Reutiliza** tu `JwtTokenService` actual
3. ✅ **Funciona** con HTTP y GraphQL transparentemente
4. ✅ **Sigue** las mejores prácticas de NestJS y Passport
5. ✅ **Type-safe** con TypeScript completo
6. ✅ **Fácil de usar** con decoradores simples
7. ✅ **Flexible** para proteger rutas individuales o completas
8. ✅ **Manejo de errores** automático con excepciones de dominio

## 🔍 Cómo Funciona

### Flujo de Autenticación

1. **Request con Token**: Cliente envía request con header `Authorization: Bearer <token>`
2. **Guard Intercepta**: `JwtAuthGuard` o `GqlJwtAuthGuard` intercepta el request
3. **Strategy Valida**: `JwtStrategy` valida el token usando la configuración JWT
4. **Usuario Extraído**: El payload del token es validado y el usuario es extraído
5. **Usuario en Request**: El usuario se adjunta al objeto request
6. **Decorador Accede**: `@CurrentUser()` extrae el usuario del request
7. **Lógica de Negocio**: Tu código recibe el usuario autenticado

### Manejo de Errores

Si el token es inválido o ha expirado:

- Se lanza `InvalidTokenDomainException` (401)
- Se lanza `TokenExpiredDomainException` (401)
- El request es rechazado automáticamente
- GraphQL retorna un error estructurado

## 📝 Configuración en AuthModule

Los componentes ya están registrados en el `AuthModule`:

```typescript
@Module({
  imports: [SharedModule, UsersModule],
  providers: [
    // ... otros providers
    JwtStrategy, // Estrategia de Passport
    JwtAuthGuard, // Guard para HTTP
    GqlJwtAuthGuard, // Guard para GraphQL
  ],
  exports: [JwtStrategy, JwtAuthGuard, GqlJwtAuthGuard],
})
export class AuthModule {}
```

## 🚀 Próximos Pasos

Para completar la funcionalidad de autenticación:

1. ✅ Implementar JwtStrategy ← **COMPLETADO**
2. ✅ Implementar Guards (JwtAuthGuard, GqlJwtAuthGuard) ← **COMPLETADO**
3. ✅ Implementar decorador @CurrentUser() ← **COMPLETADO**
4. ⏳ Implementar login/logout endpoints
5. ⏳ Implementar refresh token endpoints
6. ⏳ Agregar guards opcionales para rutas públicas
7. ⏳ Implementar autorización por roles (RolesGuard)

## 🤝 Uso con Otros Módulos

Para usar la autenticación en otros módulos, simplemente importa el `AuthModule`:

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth';
import { MyResolver } from './my.resolver';

@Module({
  imports: [AuthModule],
  providers: [MyResolver],
})
export class MyModule {}
```

Luego puedes usar los guards y decoradores:

```typescript
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard, CurrentUser } from '@/modules/auth';
import { UserEntity } from '@/modules/users/domain/entities';

@Resolver()
export class MyResolver {
  @UseGuards(GqlJwtAuthGuard)
  @Query(() => String)
  protectedQuery(@CurrentUser() user: UserEntity): string {
    return `Hello ${user.userName}!`;
  }
}
```

## 🐛 Troubleshooting

### Error: "Cannot read property 'user' of undefined"

**Causa**: El guard no está aplicado o el token no está presente.

**Solución**: Asegúrate de:

1. Aplicar el guard con `@UseGuards()`
2. Incluir el token en el header `Authorization`
3. Importar `AuthModule` en tu módulo

### Error: "Invalid token provided"

**Causa**: El token es inválido o malformado.

**Solución**:

1. Verifica que el token esté bien formado
2. Asegúrate de que el secret JWT coincida
3. Verifica que issuer y audience sean correctos

### Error: "Token has expired"

**Causa**: El token ha expirado.

**Solución**:

1. Implementa renovación de tokens con refresh tokens
2. Ajusta el tiempo de expiración en la configuración JWT
3. Solicita un nuevo token al backend
