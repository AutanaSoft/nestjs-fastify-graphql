# Validación de Propiedad de Recursos en Casos de Uso

## Principio fundamental

La validación de propiedad de recursos es **responsabilidad de cada caso de uso**, no del guard de permisos. Cada dominio tiene reglas de negocio específicas que determinan quién puede acceder a qué recursos.

## Separación de responsabilidades

### Guard de permisos (PermissionsGuard)

- ✅ Verifica si el usuario tiene el **permiso necesario**
- ✅ Ejemplo: ¿Tiene el permiso `user:update`?
- ❌ NO valida si el recurso específico pertenece al usuario

### Caso de uso (Use Case)

- ✅ Valida si el usuario puede acceder al **recurso específico**
- ✅ Implementa las **reglas de negocio** de propiedad
- ✅ Verifica permisos administrativos (`:all`) cuando corresponde

## Sistema de permisos de 2 niveles

### Permisos básicos (implican `:own`)

```typescript
'user:read'; // Puede leer su propio perfil
'user:update'; // Puede actualizar su propio perfil
'post:delete'; // Puede eliminar sus propios posts
```

### Permisos administrativos (acceso total)

```typescript
'user:read:all'; // Puede leer cualquier perfil
'user:update:all'; // Puede actualizar cualquier perfil
'post:delete:all'; // Puede eliminar cualquier post
```

### Permisos de gestión (acceso completo al recurso)

```typescript
'user:manage'; // Puede hacer cualquier operación sobre usuarios
'post:manage'; // Puede hacer cualquier operación sobre posts
```

## Patrón de implementación

### Caso 1: Validación simple de propiedad

Para recursos con un solo campo de propietario:

```typescript
import { UnauthorizedResourceAccessError } from '@/shared/domain/errors';

@Injectable()
export class UpdateUserUseCase {
  async execute(command: UpdateUserCommand, currentUser: UserEntity): Promise<UserEntity> {
    // 1. Obtener el recurso
    const user = await this.userRepository.findById(command.id);

    if (!user) throw new UserNotFoundError(command.id);

    // 2. Validación de propiedad
    // Si no tiene permiso :all, solo puede actualizar su propio perfil
    if (!currentUser.hasPermission('user:update:all')) {
      if (user.id !== currentUser.id) {
        throw new UnauthorizedResourceAccessError('user', user.id);
      }
    }

    // 3. Continuar con la lógica de negocio...
    return await this.userRepository.update(command);
  }
}
```

### Caso 2: Validación con múltiples campos de propietario

Para recursos que pueden tener diferentes campos de propietario:

```typescript
@Injectable()
export class UpdatePostUseCase {
  async execute(command: UpdatePostCommand, currentUser: UserEntity): Promise<PostEntity> {
    const post = await this.postRepository.findById(command.id);

    if (!post) throw new PostNotFoundError(command.id);

    // Validación de propiedad
    if (!currentUser.hasPermission('post:update:all')) {
      // Buscar el campo de propietario que corresponda
      const ownerId = post.authorId ?? post.userId ?? post.createdBy;

      if (ownerId !== currentUser.id) {
        throw new UnauthorizedResourceAccessError('post', post.id);
      }
    }

    return await this.postRepository.update(command);
  }
}
```

### Caso 3: Validación con lógica compleja de acceso

Para recursos con reglas de negocio más complejas:

```typescript
@Injectable()
export class DeleteCommentUseCase {
  async execute(command: DeleteCommentCommand, currentUser: UserEntity): Promise<void> {
    const comment = await this.commentRepository.findById(command.id);

    if (!comment) throw new CommentNotFoundError(command.id);

    // Validación de propiedad con lógica compleja
    if (!currentUser.hasPermission('comment:delete:all')) {
      // El usuario puede eliminar si:
      // 1. Es el autor del comentario, O
      // 2. Es el autor del post donde está el comentario, O
      // 3. Es moderador del proyecto/comunidad

      const canDelete =
        comment.authorId === currentUser.id ||
        comment.post.authorId === currentUser.id ||
        (await this.projectService.isModerator(comment.post.projectId, currentUser.id));

      if (!canDelete) {
        throw new UnauthorizedResourceAccessError('comment', comment.id);
      }
    }

    await this.commentRepository.delete(command.id);
  }
}
```

### Caso 4: Validación con recursos compartidos

Para recursos que pueden ser compartidos con otros usuarios:

```typescript
@Injectable()
export class UpdateDocumentUseCase {
  async execute(command: UpdateDocumentCommand, currentUser: UserEntity): Promise<DocumentEntity> {
    const document = await this.documentRepository.findById(command.id);

    if (!document) throw new DocumentNotFoundError(command.id);

    // Validación de propiedad considerando recursos compartidos
    if (!currentUser.hasPermission('document:update:all')) {
      const hasAccess =
        document.ownerId === currentUser.id ||
        document.collaborators.some((c) => c.userId === currentUser.id && c.canEdit) ||
        document.team?.members.includes(currentUser.id);

      if (!hasAccess) {
        throw new UnauthorizedResourceAccessError('document', document.id);
      }
    }

    return await this.documentRepository.update(command);
  }
}
```

### Caso 5: Solo lectura (sin validación de propiedad necesaria)

Para operaciones que no requieren validación de propiedad:

```typescript
@Injectable()
export class FindUserByIdUseCase {
  async execute(command: FindUserByIdCommand, currentUser: UserEntity): Promise<UserEntity> {
    const user = await this.userRepository.findById(command.id);

    if (!user) throw new UserNotFoundError(command.id);

    // Si el permiso es solo 'user:read' (sin :all), el guard ya validó
    // que el usuario tiene permiso para leer perfiles

    // Opcionalmente, puedes limitar información sensible si no es el propietario
    if (user.id !== currentUser.id && !currentUser.hasPermission('user:read:all')) {
      // Ocultar información privada
      user.hidePrivateInfo();
    }

    return user;
  }
}
```

## Mejores prácticas

### ✅ DO

1. **Implementar validación específica del dominio**

   ```typescript
   // Cada caso de uso implementa su propia lógica
   if (!currentUser.hasPermission('resource:action:all')) {
     // Validación específica según reglas de negocio
   }
   ```

2. **Usar UnauthorizedResourceAccessError**

   ```typescript
   throw new UnauthorizedResourceAccessError('resourceType', resourceId);
   ```

3. **Verificar primero el permiso :all**

   ```typescript
   if (!currentUser.hasPermission('post:update:all')) {
     // Solo validar propiedad si no tiene permiso administrativo
   }
   ```

4. **Documentar las reglas de acceso**

   ```typescript
   /**
    * @remarks
    * Reglas de acceso:
    * - El usuario puede actualizar si es el autor
    * - Administradores pueden actualizar cualquier post
    */
   ```

5. **Manejar casos edge**
   ```typescript
   // Considerar recursos huérfanos, eliminados, etc.
   const ownerId = resource.ownerId ?? resource.createdBy;
   if (!ownerId) {
     throw new OrphanResourceError('resource', resource.id);
   }
   ```

### ❌ DON'T

1. **NO crear servicios genéricos de validación de propiedad**

   ```typescript
   // ❌ Cada dominio tiene reglas diferentes
   class ResourceOwnershipService {
     validateOwnership(resource, user) { ... }
   }
   ```

2. **NO validar propiedad en el guard**

   ```typescript
   // ❌ El guard solo debe verificar permisos
   @Injectable()
   export class PermissionsGuard {
     canActivate(context) {
       // NO hacer validación de propiedad aquí
     }
   }
   ```

3. **NO asumir campos de propietario estándar**

   ```typescript
   // ❌ Diferentes recursos usan diferentes campos
   if (resource.userId === currentUser.id) // NO siempre es userId
   ```

4. **NO omitir validación en casos de uso**
   ```typescript
   // ❌ Confiar solo en el guard no es suficiente
   async execute(command, currentUser) {
     // DEBE validar propiedad aquí
     return await this.repository.update(command);
   }
   ```

## Flujo completo de autorización

```
1. Request → GqlJwtAuthGuard
   ✓ Verifica que el usuario esté autenticado
   ✓ Extrae el usuario del token JWT
   ✓ Adjunta el usuario al contexto de GraphQL

2. Request → PermissionsGuard
   ✓ Lee permisos requeridos del decorador @RequiresPermissions
   ✓ Verifica que el usuario tenga al menos uno de los permisos
   ✓ NO valida propiedad de recursos específicos

3. Request → Resolver → Use Case
   ✓ Recibe el usuario autenticado como parámetro
   ✓ Obtiene el recurso específico
   ✓ VALIDA PROPIEDAD según reglas de negocio
   ✓ Ejecuta la lógica de negocio
```

## Error: UnauthorizedResourceAccessError

```typescript
/**
 * Status: 403 FORBIDDEN
 * Code: UNAUTHORIZED_RESOURCE_ACCESS
 *
 * Extensions:
 * - resourceType: Tipo de recurso (user, post, comment, etc.)
 * - resourceId: ID del recurso al que se intentó acceder
 */
throw new UnauthorizedResourceAccessError('post', postId);
```

## Ejemplo completo en resolver

```typescript
@Resolver(() => PostType)
export class PostResolver {
  constructor(private readonly updatePostUseCase: UpdatePostUseCase) {}

  @Mutation(() => PostType)
  @UseGuards(GqlJwtAuthGuard, PermissionsGuard)
  @RequiresPermissions(['post:update']) // Permiso básico (implica :own)
  async updatePost(
    @Args() args: UpdatePostArgsDto,
    @CurrentUser() currentUser: UserEntity, // Usuario inyectado por GqlJwtAuthGuard
  ): Promise<PostType> {
    // El caso de uso valida la propiedad internamente
    const post = await this.updatePostUseCase.execute(args.input, currentUser);
    return PostMapper.toGraphQL(post);
  }
}
```

## Conclusión

La validación de propiedad de recursos **no puede generalizarse** porque:

1. Cada dominio tiene campos de propietario diferentes
2. Las reglas de negocio varían por recurso
3. Algunos recursos tienen lógica de acceso compleja (compartidos, colaboradores, etc.)
4. La validación debe considerar el contexto del negocio

Por lo tanto, **cada caso de uso debe implementar su propia validación** usando `UnauthorizedResourceAccessError` cuando corresponda.
