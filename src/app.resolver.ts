import { Query, Resolver } from '@nestjs/graphql';
import { AppService } from './app.service';
import { AppConfigDto } from './shared/applications/dto/response/app-config.dto';

/**
 * @public
 * @remarks Expone la configuración general de la aplicación a través de GraphQL.
 */
@Resolver()
export class AppResolver {
  /**
   * @param appService Servicio de aplicación que provee la información de configuración.
   */
  constructor(private readonly appService: AppService) {}

  /**
   * @returns Configuración general de la aplicación.
   */
  @Query(() => AppConfigDto, {
    description: 'Obtiene la configuración general disponible para la API.',
  })
  getAppInfo(): AppConfigDto {
    return this.appService.getAppInfo();
  }
}
