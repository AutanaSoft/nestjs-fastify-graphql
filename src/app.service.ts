import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { AppConfig } from './config';
import { AppConfigDto } from './shared/applications/dto/response/app-config.dto';

@Injectable()
/**
 * Servicio central que expone utilidades básicas de la aplicación.
 * @remarks Se apoya en {@link ConfigService} para consultar la configuración activa.
 * @public
 */
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Obtiene un saludo simple para validar la disponibilidad del servicio.
   * @returns Mensaje de saludo predeterminado.
   */
  getHello(): string {
    return 'Hello World!';
  }

  /**
   * Recupera la configuración vigente de la aplicación y la transforma a DTO.
   * @returns Instancia de {@link AppConfigDto} con los valores configurados.
   * @throws Error Si la configuración `appConfig` no está definida o es inválida.
   */
  getAppInfo(): AppConfigDto {
    return plainToInstance(
      AppConfigDto,
      this.configService.getOrThrow<AppConfig>('appConfig'),
    );
  }
}
