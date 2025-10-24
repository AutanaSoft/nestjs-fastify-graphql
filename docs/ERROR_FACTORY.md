# Error Factory

Factory simplificado para crear errores de dominio usando métodos genéricos basados en HTTP status.

## 🎯 Objetivo

Reducir el boilerplate al crear errores de dominio mediante métodos genéricos que aceptan código, mensaje y contexto. Los helpers por módulo se encargan de componer los mensajes específicos del dominio.

## 🧠 Filosofía de Diseño

### Enfoque Simplificado

**Antes** (métodos específicos por recurso):

```typescript
// Factory tenía métodos específicos que componían el mensaje internamente
ErrorFactory.createNotFoundError('user', id, 'id');
// → Mensaje compuesto dentro del factory
```

**Ahora** (métodos genéricos por HTTP status):

```typescript
// Factory tiene métodos genéricos, helpers componen el mensaje
ErrorFactory.createNotFoundError('USER_NOT_FOUND', `User not found with id: ${id}`, { userId: id });
// → Helpers componen mensaje, factory solo crea el error
```

### Ventajas del Nuevo Enfoque

1. **Menos código en el factory**: Solo 7 métodos genéricos vs múltiples métodos específicos
2. **Helpers mínimos**: 1-2 líneas por helper
3. **Sin duplicación**: Status codes centralizados
4. **Más flexible**: Crea cualquier error sin modificar el factory
5. **Type-safe**: Todo tipado con TypeScript
6. **Fácil de testear**: Lógica simple y predecible

## 📦 Instalación

```typescript
import { ErrorFactory, DomainBaseError } from '@/shared/domain/errors';
```

## 🚀 API del ErrorFactory

### Métodos Genéricos por HTTP Status

#### `createNotFoundError(code, message, context?)`

**Status**: 404 NOT_FOUND

```typescript
throw ErrorFactory.createNotFoundError('USER_NOT_FOUND', 'User not found with id: 123', {
  userId: '123',
});
```

#### `createConflictError(code, message, context?)`

**Status**: 409 CONFLICT

```typescript
throw ErrorFactory.createConflictError(
  'USER_ALREADY_EXISTS',
  "User with email 'john@example.com' already exists",
  { email: 'john@example.com' },
);
```

#### `createForbiddenError(code, message, context?)`

**Status**: 403 FORBIDDEN

```typescript
throw ErrorFactory.createForbiddenError(
  'INSUFFICIENT_PERMISSIONS',
  'You do not have permission to delete this user',
  { requiredPermission: 'user:delete:all', userId: '123' },
);
```

#### `createUnauthorizedError(code, message, context?)`

**Status**: 401 UNAUTHORIZED

```typescript
throw ErrorFactory.createUnauthorizedError('INVALID_CREDENTIALS', 'Invalid email or password', {
  email: 'john@example.com',
});
```

#### `createBadRequestError(code, message, context?)`

**Status**: 400 BAD_REQUEST

```typescript
throw ErrorFactory.createBadRequestError('INVALID_EMAIL_FORMAT', 'Email format is invalid', {
  email: 'invalid-email',
});
```

#### `createInternalServerError(code, message, context?)`

**Status**: 500 INTERNAL_SERVER_ERROR

```typescript
throw ErrorFactory.createInternalServerError(
  'DATABASE_ERROR',
  'Failed to execute database operation',
  { operation: 'update', table: 'users' },
);
```

#### `createBadGatewayError(code, message, context?)`

**Status**: 502 BAD_GATEWAY

```typescript
throw ErrorFactory.createBadGatewayError(
  'EMAIL_SERVICE_UNAVAILABLE',
  'Failed to send email: service unavailable',
  { service: 'SendGrid', recipient: 'john@example.com' },
);
```

### Método Base

#### `createDomainError(config)`

Método genérico para crear cualquier error con control total:

```typescript
throw ErrorFactory.createDomainError({
  code: 'CUSTOM_ERROR',
  status: HttpStatus.PAYMENT_REQUIRED,
  message: 'Payment required to access this resource',
  context: { resourceId: '123', planRequired: 'premium' },
});
```

## 🔄 Mapeo de Errores de Prisma

> **Nota**: El mapeo de errores de Prisma se realiza mediante `HandlerOrmErrorsService`, un servicio inyectable en la capa de aplicación que usa `ErrorFactory` internamente.

### `HandlerOrmErrorsService.handleError(error, customMessages?)`

Servicio robusto que convierte errores de Prisma a errores de dominio usando `ErrorFactory`. Incluye logging detallado y mensajes personalizables.

**Ubicación**: `src/shared/applications/services/handler-orm-errors.service.ts`

**Características**:

- ✅ Maneja todos los tipos de errores Prisma (Known, Validation, Initialization, Panic, Unknown)
- ✅ Logging completo con Pino
- ✅ Mensajes personalizables por módulo
- ✅ Preserva `originalError` para debugging
- ✅ Extrae metadata de Prisma (target, modelName, cause, constraint)
- ✅ Usa `ErrorFactory` para crear errores consistentes

```typescript
import { HandlerOrmErrorsService } from '@/shared/applications/services';

@Injectable()
export class UserPrismaAdapter implements UserRepository {
  constructor(private readonly handlerOrmErrors: HandlerOrmErrorsService) {}

  async create(data: CreateUserData): Promise<User> {
    try {
      const result = await this.prisma.user.create({ data });
      return this.toDomain(result);
    } catch (error) {
      // El servicio mapea automáticamente a errores de dominio
      this.handlerOrmErrors.handleError(error, {
        notFound: 'User not found',
        uniqueConstraint: 'User with this email already exists',
        // ... otros mensajes personalizados
      });
    }
  }
}
```

### Códigos de Prisma Soportados

| Código Prisma | Error Factory Method        | Status | Descripción                        |
| ------------- | --------------------------- | ------ | ---------------------------------- |
| `P2002`       | `createConflictError`       | 409    | Campo único duplicado              |
| `P2025`       | `createNotFoundError`       | 404    | Registro no encontrado             |
| `P2003`       | `createInternalServerError` | 500    | Violación de clave foránea         |
| `P2015`       | `createInternalServerError` | 500    | Registro relacionado no encontrado |
| `P2000`       | `createInternalServerError` | 500    | Valor excede longitud máxima       |
| `P2011-P2020` | `createInternalServerError` | 500    | Errores de validación              |
| `P1001-P1017` | `createInternalServerError` | 500    | Errores de conexión                |
| Otros         | `createInternalServerError` | 500    | Error genérico de BD               |

### Ventajas sobre PrismaErrorHelper Simple

| Característica                  | HandlerOrmErrorsService | PrismaErrorHelper Simple |
| ------------------------------- | ----------------------- | ------------------------ |
| Manejo completo de tipos Prisma | ✅                      | ❌                       |
| Logging con Pino                | ✅                      | ❌                       |
| Mensajes personalizables        | ✅                      | ❌                       |
| Preserva originalError          | ✅                      | ❌                       |
| Extracción de metadata          | ✅                      | ⚠️ Parcial               |
| Servicio inyectable             | ✅                      | ❌                       |
| Usa ErrorFactory                | ✅                      | ✅                       |
| Códigos de conexión (P1\*)      | ✅                      | ❌                       |

## 🛠️ Creando Helpers por Módulo

## �️ Creando Helpers por Módulo

### Patrón Recomendado

Crea un archivo `{module}-error.helpers.ts` en cada módulo:

```typescript
// src/modules/users/domain/errors/user-error.helpers.ts
import { DomainBaseError, ErrorFactory } from '@/shared/domain/errors';

export const createUserNotFoundError = (id: string): DomainBaseError =>
  ErrorFactory.createNotFoundError('USER_NOT_FOUND', `User not found with id: ${id}`, {
    userId: id,
  });

export const createUserNotFoundByEmailError = (email: string): DomainBaseError =>
  ErrorFactory.createNotFoundError('USER_NOT_FOUND', `User not found with email: ${email}`, {
    email,
  });

export const createUserAlreadyExistsError = (field: string, value: string): DomainBaseError =>
  ErrorFactory.createConflictError(
    'USER_ALREADY_EXISTS',
    `User with ${field} '${value}' already exists`,
    { field, value },
  );

export const createEmailAlreadyVerifiedError = (userId: string): DomainBaseError =>
  ErrorFactory.createConflictError('EMAIL_ALREADY_VERIFIED', 'Email is already verified', {
    userId,
    emailVerified: true,
  });

export const createInvalidCredentialsError = (email: string): DomainBaseError =>
  ErrorFactory.createUnauthorizedError('INVALID_CREDENTIALS', 'Invalid email or password', {
    email,
  });

export const createUserValidationError = (
  fields: Array<{ field: string; message: string; value?: any }>,
): DomainBaseError => {
  const fieldNames = fields.map((f) => f.field).join(', ');
  return ErrorFactory.createBadRequestError(
    'USER_VALIDATION_ERROR',
    `User validation failed for fields: ${fieldNames}`,
    { fields, failedCount: fields.length },
  );
};
```

### Uso de Helpers en Use Cases

```typescript
import {
  createUserNotFoundError,
  createUserAlreadyExistsError,
  createEmailAlreadyVerifiedError,
  createUserValidationError,
} from '../domain/errors/user-error.helpers';

export class CreateUserUseCase {
  async execute(data: CreateUserInputDto) {
    // Validación simple
    const errors = [];
    if (!data.email.includes('@')) {
      errors.push({ field: 'email', message: 'Invalid email format', value: data.email });
    }
    if (data.password.length < 8) {
      errors.push({ field: 'password', message: 'Password too short', value: data.password });
    }

    if (errors.length > 0) {
      throw createUserValidationError(errors);
    }

    // Verificar duplicados
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw createUserAlreadyExistsError('email', data.email);
    }

    return await this.userRepository.create(data);
  }
}

export class VerifyEmailUseCase {
  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw createUserNotFoundError(userId);
    }

    if (user.emailVerified) {
      throw createEmailAlreadyVerifiedError(userId);
    }

    // Verificar email...
  }
}
```

## 📚 Ejemplos de Uso Real

### En Repositorios (Adapters)

```typescript
import { HandlerOrmErrorsService } from '@/shared/applications/services';
import { createUserNotFoundError } from '@/modules/users/domain/errors';

@Injectable()
export class UserPrismaAdapter implements UserRepository {
  constructor(private readonly handlerOrmErrors: HandlerOrmErrorsService) {}

  async create(data: CreateUserData): Promise<User> {
    try {
      const result = await this.prisma.user.create({ data });
      return this.toDomain(result);
    } catch (error) {
      // Usar HandlerOrmErrorsService con mensajes personalizados
      this.handlerOrmErrors.handleError(error, {
        uniqueConstraint: `User with email ${data.email} already exists`,
        notFound: 'User not found',
      });
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Uso de helper de módulo (preferido para casos específicos)
      throw createUserNotFoundError(email);
    }
    return this.toDomain(user);
  }
}
```

### En Use Cases con Helpers

```typescript
import {
  createUserNotFoundError,
  createUserValidationError,
} from '../domain/errors/user-error.helpers';

export class UpdateUserUseCase {
  async execute(userId: string, data: UpdateUserInputDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw createUserNotFoundError(userId); // Helper: 1 línea
    }

    // Validación compleja
    const errors = this.validateUpdateData(data);
    if (errors.length > 0) {
      throw createUserValidationError(errors); // Helper: 1 línea
    }

    return await this.userRepository.update(userId, data);
  }
}
```

### Errores de Servicios Externos

```typescript
export class SendEmailService {
  async send(to: string, subject: string, body: string) {
    try {
      await this.externalEmailService.send({ to, subject, body });
    } catch (error) {
      // Uso directo para casos específicos no repetitivos
      throw ErrorFactory.createBadGatewayError(
        'EMAIL_SERVICE_ERROR',
        `Failed to send email to ${to}`,
        {
          to,
          subject,
          serviceName: 'SendGrid',
          originalError: error instanceof Error ? error.message : 'Unknown error',
        },
      );
    }
  }
}
```

## 🧪 Testing

El factory facilita la creación de errores en tests:

```typescript
describe('CreateUserUseCase', () => {
  it('should throw user not found error', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId: '123', ... }))
      .rejects.toMatchObject({
        extensions: {
          code: 'USER_NOT_FOUND',
          status: 404,
          userId: '123'
        }
      });
  });

  it('should throw user already exists error', async () => {
    mockRepository.findByEmail.mockResolvedValue(existingUser);

    await expect(useCase.execute({ email: 'john@example.com', ... }))
      .rejects.toMatchObject({
        extensions: {
          code: 'USER_ALREADY_EXISTS',
          status: 409,
          field: 'email',
          value: 'john@example.com'
        }
      });
  });

  it('should throw validation error for multiple fields', async () => {
    const errors = [
      { field: 'email', message: 'Invalid format', value: 'invalid' },
      { field: 'password', message: 'Too short', value: '123' }
    ];

    await expect(useCase.execute(invalidData))
      .rejects.toMatchObject({
        extensions: {
          code: 'USER_VALIDATION_ERROR',
          status: 400,
          fields: errors,
          failedCount: 2
        }
      });
  });
});
```

## 📊 Comparación: Antes vs Después

### ❌ Antes (Crear clase específica)

```typescript
// Archivo: user-already-exists.error.ts (15 líneas de boilerplate)
export class UserAlreadyExistsError extends DomainBaseError {
  constructor(field: string, value: string, options?: GraphQLErrorOptions) {
    super(`User with ${field} '${value}' already exists`, {
      ...options,
      extensions: {
        code: 'USER_ALREADY_EXISTS',
        status: HttpStatus.CONFLICT,
        field,
        value,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Uso en use case
throw new UserAlreadyExistsError('email', 'john@example.com');
```

### ✅ Después (Helper + Factory - Enfoque Nuevo)

```typescript
// Archivo: user-error.helpers.ts (1 línea por helper)
export const createUserAlreadyExistsError = (field: string, value: string): DomainBaseError =>
  ErrorFactory.createConflictError(
    'USER_ALREADY_EXISTS',
    `User with ${field} '${value}' already exists`,
    { field, value },
  );

// Uso en use case
throw createUserAlreadyExistsError('email', 'john@example.com');
```

**Beneficios del nuevo enfoque**:

- ✅ **Menos código**: 15 líneas de clase → 4 líneas de helper
- ✅ **Sin boilerplate**: No need para `constructor`, `name`, `setPrototypeOf`
- ✅ **Sin duplicación**: Status code centralizado en el factory
- ✅ **Type-safe**: TypeScript verifica parámetros
- ✅ **Fácil de testear**: Función pura, sin estado
- ✅ **Consistente**: Todos los errores usan el mismo patrón
- ✅ **Flexible**: Agrega helpers sin modificar el factory

## 🎨 Mejores Prácticas

### 1. Crear Helpers para Errores Frecuentes

```typescript
// ✅ BIEN: Helper para error que se usa 3+ veces
export const createUserNotFoundError = (id: string) =>
  ErrorFactory.createNotFoundError('USER_NOT_FOUND', `User not found with id: ${id}`, {
    userId: id,
  });

// Uso simple y consistente
throw createUserNotFoundError('123');
```

### 2. Uso Directo para Errores Únicos

```typescript
// ✅ BIEN: Factory directo para caso específico
export class UpdateUserAvatarUseCase {
  async execute(userId: string, file: File) {
    if (file.size > MAX_AVATAR_SIZE) {
      throw ErrorFactory.createBadRequestError(
        'AVATAR_TOO_LARGE',
        `Avatar size exceeds maximum of ${MAX_AVATAR_SIZE} bytes`,
        { maxSize: MAX_AVATAR_SIZE, actualSize: file.size },
      );
    }
  }
}
```

### 3. Contexto Rico para Debugging

```typescript
// ✅ BIEN: Incluye contexto útil
export const createSessionLimitExceededError = (
  userId: string,
  activeCount: number,
  maxLimit: number,
) =>
  ErrorFactory.createConflictError(
    'SESSION_LIMIT_EXCEEDED',
    `Maximum session limit of ${maxLimit} exceeded`,
    {
      userId,
      activeSessionCount: activeCount,
      maxSessionLimit: maxLimit,
      exceeded: activeCount - maxLimit,
    },
  );

// ❌ EVITAR: Contexto mínimo sin valor para debugging
export const createSessionLimitError = (userId: string) =>
  ErrorFactory.createConflictError('SESSION_LIMIT', 'Too many sessions', { userId });
```

### 4. Mensajes Descriptivos

```typescript
// ✅ BIEN: Mensaje claro y accionable
ErrorFactory.createBadRequestError(
  'PASSWORD_TOO_WEAK',
  'Password must contain at least 8 characters, 1 uppercase, 1 number and 1 special character',
  { minLength: 8, providedLength: password.length },
);

// ❌ EVITAR: Mensaje vago
ErrorFactory.createBadRequestError('INVALID_PASSWORD', 'Invalid password', {});
```

### 5. Códigos Consistentes

```typescript
// ✅ BIEN: Patrón consistente ENTITY_ACTION_REASON
'USER_NOT_FOUND';
'USER_ALREADY_EXISTS';
'SESSION_LIMIT_EXCEEDED';
'EMAIL_ALREADY_VERIFIED';
'PASSWORD_TOO_WEAK';

// ❌ EVITAR: Códigos inconsistentes
'NOT_FOUND_USER';
'EXISTING_USER';
'TOO_MANY_SESSIONS';
'VERIFIED';
'WEAK_PWD';
```

### 6. Organización de Helpers

```typescript
// ✅ BIEN: Archivo helpers por módulo
// src/modules/users/domain/errors/user-error.helpers.ts
export const createUserNotFoundError = ...
export const createUserAlreadyExistsError = ...
export const createEmailAlreadyVerifiedError = ...

// src/modules/sessions/domain/errors/session-error.helpers.ts
export const createSessionNotFoundError = ...
export const createSessionLimitExceededError = ...
export const createSessionExpiredError = ...
```

## 🚀 Migración desde Clases Específicas

### Paso 1: Identificar Errores Frecuentes

Revisa cuántas veces se usa cada error:

```bash
# Buscar usos de un error específico
grep -r "UserNotFoundError" src/
```

### Paso 2: Crear Helpers

Para errores usados 3+ veces, crea helpers:

```typescript
// user-error.helpers.ts
export const createUserNotFoundError = (id: string) =>
  ErrorFactory.createNotFoundError('USER_NOT_FOUND', `User not found with id: ${id}`, {
    userId: id,
  });
```

### Paso 3: Reemplazar Uso

```typescript
// ❌ Antes
import { UserNotFoundError } from '../errors/user-not-found.error';
throw new UserNotFoundError(userId);

// ✅ Después
import { createUserNotFoundError } from '../errors/user-error.helpers';
throw createUserNotFoundError(userId);
```

### Paso 4: Eliminar Clases Antiguas

Una vez migrados todos los usos, elimina las clases específicas de error.

## 📝 Resumen

### Cuándo Usar Cada Enfoque

| Escenario                 | Enfoque                   | Ejemplo                                           |
| ------------------------- | ------------------------- | ------------------------------------------------- |
| Error usado 3+ veces      | Helper                    | `createUserNotFoundError(id)`                     |
| Error usado 1-2 veces     | Factory directo           | `ErrorFactory.createBadRequestError(...)`         |
| Error con lógica compleja | Helper + validación       | Helper que valida params antes de crear error     |
| Mapeo de errores Prisma   | `HandlerOrmErrorsService` | Servicio inyectable con logging y personalización |
| Mapeo de errores externos | Helper personalizado      | Similar a HandlerOrmErrorsService por servicio    |

### Ventajas del Enfoque Simplificado

1. **Menos archivos**: No necesitas un archivo por cada error
2. **Menos código**: 1-4 líneas de helper vs 15 líneas de clase
3. **Sin duplicación**: Status codes centralizados en factory
4. **Más flexible**: Crea cualquier error sin modificar factory
5. **Type-safe**: Todo verificado por TypeScript
6. **Fácil de testear**: Funciones puras sin estado
7. **Consistente**: Patrón uniforme en toda la app

### Estructura Recomendada

```
src/modules/users/
└── domain/
    └── errors/
        ├── user-error.helpers.ts  ← Todos los helpers del módulo
        └── index.ts               ← Barrel export
```

**No necesitas**:

- ❌ Un archivo por error (user-not-found.error.ts, user-already-exists.error.ts, etc.)
- ❌ Clases específicas para cada error
- ❌ Boilerplate repetitivo de constructores

**Solo necesitas**:

- ✅ Importar `ErrorFactory` desde `@/shared/domain/errors`
- ✅ Crear helpers de 1-4 líneas para errores frecuentes
- ✅ Usar factory directo para errores únicos

```typescript
// helpers/user-errors.ts
export const createUserNotFoundError = (identifier: string, type = 'id') =>
  ErrorFactory.createNotFoundError('user', identifier, type);

export const createUserAlreadyExistsError = (field: string, value: string) =>
  ErrorFactory.createAlreadyExistsError('user', field, value);

// Uso
throw createUserNotFoundError('123');
throw createUserAlreadyExistsError('email', 'john@example.com');
```

### 3. Agregar Contexto Rico

```typescript
// ✅ BIEN: Contexto rico para debugging
throw ErrorFactory.createDomainError({
  code: 'PAYMENT_FAILED',
  status: HttpStatus.BAD_REQUEST,
  message: 'Payment processing failed',
  context: {
    orderId: '123',
    amount: 100,
    currency: 'USD',
    paymentMethod: 'credit_card',
    errorCode: paymentGatewayError.code,
  },
});

// ❌ EVITAR: Poco contexto
throw new Error('Payment failed');
```

### 4. Validación Centralizada

```typescript
// ✅ BIEN: Acumular errores de validación
const errors: Array<{ field: string; message: string }> = [];

if (!isValidEmail(data.email)) {
  errors.push({ field: 'email', message: 'Invalid email' });
}

if (!isStrongPassword(data.password)) {
  errors.push({ field: 'password', message: 'Weak password' });
}

if (errors.length > 0) {

---

## 🔗 Referencias

- [Instrucciones de manejo de errores](./.github/instructions/error-handling.instructions.md)
- [Código fuente del ErrorFactory](../src/shared/domain/errors/error.factory.ts)
- [Ejemplo de helpers de usuario](../src/modules/users/domain/errors/user-error.helpers.ts)

**Creado**: Diciembre 2024
**Última actualización**: Diciembre 2024
**Versión**: 2.0 (Enfoque simplificado con métodos genéricos)
```
