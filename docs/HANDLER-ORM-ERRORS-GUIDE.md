# HandlerOrmErrorsService - Guía de Uso

## 📋 Descripción

El `HandlerOrmErrorsService` es un servicio centralizado que maneja todos los errores de Prisma ORM y los convierte en errores de dominio consistentes con códigos y mensajes personalizables por módulo.

## 🎯 Características

- ✅ **Configuración por defecto**: Valores sensatos para todos los tipos de errores
- ✅ **Personalización por módulo**: Cada módulo puede sobrescribir códigos y mensajes
- ✅ **API simple**: Un solo objeto de configuración en lugar de múltiples parámetros
- ✅ **Type-safe**: TypeScript garantiza la estructura correcta
- ✅ **Merge inteligente**: Solo sobrescribe lo que necesitas, el resto usa defaults

## 🔧 Uso Básico

### 1. Sin configuración personalizada (usa defaults)

```typescript
// En cualquier adaptador de persistencia
try {
  return await this.prisma.user.create({ data });
} catch (error) {
  return this.handlerOrmErrors.handleError(error);
  // Usa códigos y mensajes por defecto:
  // - P2002 → DATABASE_UNIQUE_CONSTRAINT_VIOLATION
  // - P2025 → DATABASE_RECORD_NOT_FOUND
  // - etc.
}
```

### 2. Con configuración personalizada inline

```typescript
try {
  return await this.prisma.user.findUnique({ where: { id } });
} catch (error) {
  return this.handlerOrmErrors.handleError(error, {
    notFound: {
      code: 'USER_NOT_FOUND',
      message: 'User not found in the system',
    },
  });
}
```

### 3. Con configuración reutilizable (RECOMENDADO)

```typescript
// infrastructure/config/user-orm-errors.config.ts
export const USER_ORM_ERROR_CONFIG: HandlerOrmErrorConfig = {
  uniqueConstraint: {
    code: 'USER_ALREADY_EXISTS',
    message: 'A user with this email or username already exists',
  },
  notFound: {
    code: 'USER_NOT_FOUND',
    message: 'The requested user was not found',
  },
};

// infrastructure/adapters/user-prisma.adapter.ts
try {
  return await this.prisma.user.create({ data });
} catch (error) {
  return this.handlerOrmErrors.handleError(error, USER_ORM_ERROR_CONFIG);
}
```

## 📚 Tipos de Errores Configurables

### ErrorConfig

Estructura base para cada tipo de error:

```typescript
type ErrorConfig = {
  code: string; // Código en SCREAMING_SNAKE_CASE
  message: string; // Mensaje descriptivo para el usuario
};
```

### HandlerOrmErrorConfig

Configuración completa (todas las propiedades son opcionales):

```typescript
type HandlerOrmErrorConfig = {
  uniqueConstraint?: ErrorConfig; // P2002 - Violación de constraint único
  notFound?: ErrorConfig; // P2025 - Registro no encontrado
  foreignKeyConstraint?: ErrorConfig; // P2003 - Violación de clave foránea
  validation?: ErrorConfig; // P2011-P2020 - Errores de validación
  connection?: ErrorConfig; // P1001-P1017 - Errores de conexión
  unknown?: ErrorConfig; // Cualquier otro error
};
```

## 🗺️ Mapeo de Códigos de Prisma

| Código Prisma | Categoría            | HTTP Status | Default Code                              |
| ------------- | -------------------- | ----------- | ----------------------------------------- |
| P2002         | uniqueConstraint     | 409         | DATABASE_UNIQUE_CONSTRAINT_VIOLATION      |
| P2025         | notFound             | 404         | DATABASE_RECORD_NOT_FOUND                 |
| P2003         | foreignKeyConstraint | 500         | DATABASE_FOREIGN_KEY_CONSTRAINT_VIOLATION |
| P2011-P2020   | validation           | 500         | DATABASE_VALIDATION_ERROR                 |
| P1001-P1017   | connection           | 500         | DATABASE_CONNECTION_ERROR                 |
| Otros         | unknown              | 500         | DATABASE_UNKNOWN_ERROR                    |

## 💡 Ejemplos por Módulo

### Módulo Users

```typescript
// user-orm-errors.config.ts
export const USER_ORM_ERROR_CONFIG: HandlerOrmErrorConfig = {
  uniqueConstraint: {
    code: 'USER_ALREADY_EXISTS',
    message: 'A user with this email or username already exists',
  },
  notFound: {
    code: 'USER_NOT_FOUND',
    message: 'The requested user was not found',
  },
};
```

### Módulo Auth

```typescript
// auth-orm-errors.config.ts
export const AUTH_ORM_ERROR_CONFIG: HandlerOrmErrorConfig = {
  uniqueConstraint: {
    code: 'SESSION_ALREADY_EXISTS',
    message: 'An active session already exists for this device',
  },
  notFound: {
    code: 'SESSION_NOT_FOUND',
    message: 'The session was not found or has expired',
  },
};
```

### Módulo Permissions

```typescript
// permission-orm-errors.config.ts
export const PERMISSION_ORM_ERROR_CONFIG: HandlerOrmErrorConfig = {
  uniqueConstraint: {
    code: 'PERMISSION_ALREADY_ASSIGNED',
    message: 'This permission is already assigned to the user',
  },
  notFound: {
    code: 'PERMISSION_NOT_FOUND',
    message: 'The requested permission does not exist',
  },
  foreignKeyConstraint: {
    code: 'INVALID_USER_OR_PERMISSION',
    message: 'The user or permission reference is invalid',
  },
};
```

## 🎨 Buenas Prácticas

### 1. Crear configuración por módulo

```typescript
// ✅ BIEN: Configuración centralizada y reutilizable
export const USER_ORM_ERROR_CONFIG: HandlerOrmErrorConfig = { ... };

// ❌ MAL: Configuración inline repetida
this.handlerOrmErrors.handleError(error, { notFound: { ... } });
this.handlerOrmErrors.handleError(error, { notFound: { ... } }); // Duplicado
```

### 2. Usar códigos específicos del dominio

```typescript
// ✅ BIEN: Código específico del dominio
code: 'USER_EMAIL_ALREADY_EXISTS';

// ❌ MAL: Código genérico
code: 'DUPLICATE_ERROR';
```

### 3. Mensajes orientados al usuario

```typescript
// ✅ BIEN: Mensaje claro y accionable
message: 'A user with this email already exists. Please use a different email or try logging in.';

// ❌ MAL: Mensaje técnico
message: 'Unique constraint violation on email field';
```

### 4. Solo sobrescribir lo necesario

```typescript
// ✅ BIEN: Solo sobrescribe errores relevantes para el módulo
export const USER_ORM_ERROR_CONFIG: HandlerOrmErrorConfig = {
  uniqueConstraint: { ... },
  notFound: { ... }
  // connection y unknown usan defaults
};

// ❌ MAL: Sobrescribe todo innecesariamente
export const USER_ORM_ERROR_CONFIG: HandlerOrmErrorConfig = {
  uniqueConstraint: { ... },
  notFound: { ... },
  connection: { code: 'DATABASE_CONNECTION_ERROR', message: '...' }, // Innecesario
  unknown: { code: 'DATABASE_UNKNOWN_ERROR', message: '...' }        // Innecesario
};
```

## 🔍 Debugging

El servicio registra información detallada de los errores:

```typescript
this.logger.assign({
  method: 'handleKnownRequestError',
  code: error.code, // Código de Prisma (ej: P2002)
  meta: {
    target: ['email'], // Campos afectados
    modelName: 'User', // Modelo de Prisma
    cause: '...', // Causa del error
    constraint: 'email_key', // Constraint violado
  },
});
```

## 🚀 Migración desde la API Anterior

### Antes (API antigua con 3 parámetros)

```typescript
this.handlerOrmErrors.handleError(
  error,
  { uniqueConstraint: 'User already exists' },
  { uniqueConstraint: 'USER_ALREADY_EXISTS' },
);
```

### Ahora (API nueva con 1 objeto)

```typescript
this.handlerOrmErrors.handleError(error, {
  uniqueConstraint: {
    code: 'USER_ALREADY_EXISTS',
    message: 'User already exists',
  },
});
```

## 📖 Referencias

- Tipo `ErrorConfig`: `/src/shared/applications/types/handler-orm-error-config.type.ts`
- Tipo `HandlerOrmErrorConfig`: `/src/shared/applications/types/handler-orm-error-config.type.ts`
- Configuración por defecto: `/src/shared/applications/constants/handler-orm-errors-default-message.constant.ts`
- Servicio: `/src/shared/applications/services/handler-orm-errors.service.ts`
- Ejemplo de configuración: `/src/modules/users/infrastructure/config/user-orm-errors.config.ts`
