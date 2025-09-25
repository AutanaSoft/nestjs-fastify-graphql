import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({
  description: 'Configuración del servidor HTTP de la aplicación.',
})
export class ServerConfigDto {
  @Field({
    description: 'Nombre del host donde la API se expone.',
  })
  host: string;

  @Field(() => Int, {
    description: 'Puerto TCP usado por el servidor HTTP.',
  })
  port: number;

  @Field({
    description:
      'Indica si la aplicación aplica un prefijo global en las rutas.',
  })
  useGlobalPrefix: boolean;

  @Field({
    description: 'Prefijo global configurado para los endpoints HTTP.',
  })
  globalPrefix: string;

  @Field({
    description:
      'Entorno de despliegue activo de la aplicación (por ejemplo, desarrollo o producción).',
  })
  environment: string;

  @Field({
    description: 'Nivel de log configurado para el servicio.',
  })
  logLevel: string;
}

@ObjectType({
  description: 'Configuración general de la aplicación expuesta en la API.',
})
export class AppConfigDto {
  @Field({
    description: 'Nombre identificador de la aplicación.',
  })
  name: string;

  @Field({
    description: 'Descripción corta del propósito de la aplicación.',
  })
  description: string;

  @Field({
    description: 'Versión semántica actualmente desplegada.',
  })
  version: string;

  @Field(() => ServerConfigDto, {
    description: 'Configuración específica del servidor HTTP asociado.',
  })
  server: ServerConfigDto;
}
