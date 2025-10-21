# Database Seeds

Este directorio contiene los scripts de seeding para inicializar la base de datos con datos iniciales.

## Orden de Ejecución

Los seeds se ejecutan en el siguiente orden (definido en `index.ts`):

1. **Permisos** (`seed/permissions.seed.ts`): Crea o actualiza los permisos base del sistema
2. **Usuario Administrador** (`seed/admin-user.seed.ts`): Crea el usuario administrador con todos los permisos

⚠️ **Importante**: El orden es crítico porque el usuario administrador requiere que los permisos ya existan.

## Configuración del Usuario Administrador

### Variables de Entorno

El seed del usuario administrador utiliza las siguientes variables de entorno:

```bash
# Email del administrador
APP_ADMIN_EMAIL=admin@example.com

# Contraseña del administrador
APP_ADMIN_PASSWORD=SecurePassword123!
```

### Comportamiento por Entorno

#### Desarrollo (`NODE_ENV=development`)

- Si las variables de entorno no están definidas, se usan credenciales por defecto
- Credenciales por defecto:
  - Email: `admin@autanasoft.com`
  - Password: `Admin@12345`
- ⚠️ **Advertencia**: Las credenciales por defecto solo deben usarse en desarrollo

#### Producción (`NODE_ENV=production`)

- **Requiere** que las variables `APP_ADMIN_EMAIL` y `APP_ADMIN_PASSWORD` estén definidas
- **No permite** el uso de credenciales por defecto
- El seed fallará con error de seguridad si:
  - No se definen las variables de entorno
  - Se intentan usar las credenciales por defecto

## Uso

### Ejecutar todos los seeds

```bash
pnpm prisma:seed
```

### Reset de base de datos (incluye seeds)

```bash
pnpm prisma:migrate:reset
```

## Seguridad

### Validaciones Implementadas

1. **Validación de entorno**: En producción, las variables de entorno son obligatorias
2. **Validación de credenciales**: No se permiten credenciales por defecto en producción
3. **Transacciones**: Creación de usuario y asignación de permisos en transacción atómica
4. **Validación de permisos**: Verifica que todos los permisos necesarios existan antes de crear el usuario

### Mejores Prácticas

1. **Nunca** commits credenciales reales al repositorio
2. **Siempre** usa variables de entorno en producción
3. **Cambia** las credenciales del administrador después del primer login
4. Usa contraseñas **fuertes** y **únicas** para cada entorno
5. Considera usar un gestor de secretos (AWS Secrets Manager, Azure Key Vault, etc.)

## Características del Sistema de Seeds

### Permisos (`permissions.seed.ts`)

✅ **Operaciones en batch**: Crea múltiples permisos en una sola operación
✅ **Transacciones**: Garantiza consistencia de datos con rollback automático
✅ **Idempotencia**: Puede ejecutarse múltiples veces sin duplicar datos
✅ **Validación de integridad**: Verifica que todos los permisos se hayan creado correctamente
✅ **Actualización inteligente**: Actualiza solo las descripciones que han cambiado
✅ **Validación de roles**: Verifica que ROLE_PERMISSIONS referencie solo permisos existentes

### Usuario Administrador (`admin-user.seed.ts`)

✅ **Variables de entorno**: Lee credenciales desde APP_ADMIN_EMAIL y APP_ADMIN_PASSWORD
✅ **Validación de seguridad**: Previene uso de credenciales por defecto en producción
✅ **Transacciones**: Crea usuario y asigna permisos atómicamente
✅ **Validación de dependencias**: Verifica que todos los permisos existan antes de crear el usuario
✅ **Idempotencia**: Si el usuario existe, no lo duplica

## Estructura de Archivos

```
seeds/
├── index.ts                    # Función principal que ejecuta todos los seeds
├── README.md                   # Esta documentación
├── data/
│   ├── admin-user.data.ts      # Lógica de configuración del admin
│   └── permissions.data.ts     # Definición de permisos y validaciones
└── seed/
    ├── admin-user.seed.ts      # Seed del usuario administrador
    └── permissions.seed.ts     # Seed de permisos
```

## Ejemplo de Configuración

### Archivo `.env` para desarrollo

```bash
# No es necesario definir estas variables en desarrollo
# Se usarán las credenciales por defecto automáticamente
```

### Archivo `.env` para producción

```bash
NODE_ENV=production
APP_ADMIN_EMAIL=admin@mycompany.com
APP_ADMIN_PASSWORD=MyVerySecurePassword123!@#
```

## Manejo de Errores

El seed puede fallar por las siguientes razones:

### Errores de Permisos

1. **Validación de roles**: ROLE_PERMISSIONS refiere a permisos que no existen en INITIAL_PERMISSIONS
2. **Integridad de datos**: No se pudieron crear todos los permisos esperados
3. **Error de transacción**: Falla al crear o actualizar permisos

### Errores de Usuario Administrador

1. **Error de seguridad**: Credenciales no válidas en producción
   - Variables de entorno no definidas en producción
   - Intento de usar credenciales por defecto en producción
2. **Permisos faltantes**: Algunos permisos necesarios no existen en la base de datos
3. **Usuario duplicado**: El usuario administrador ya existe (⚠️ esto es seguro, solo se omite)
4. **Error de transacción**: Falla al crear el usuario o asignar permisos

### Errores Generales

1. **Error de conexión**: No se puede conectar a la base de datos
2. **Error de Prisma**: Error en las operaciones de base de datos

Todos los errores detienen la ejecución y muestran mensajes descriptivos con contexto.

## Optimizaciones de Rendimiento

### Antes de las Mejoras

- ❌ 19 queries individuales secuenciales para permisos
- ❌ Sin transacciones
- ❌ ~500-1000ms para completar el seed

### Después de las Mejoras

- ✅ 1-2 queries batch para permisos (createMany + updateMany en paralelo)
- ✅ Transacciones garantizan consistencia
- ✅ ~50-100ms para completar el seed

**Mejora de rendimiento: ~10x más rápido** 🚀
