import { ConfigService } from '@nestjs/config';
import { AppService } from '../../src/app.service';
import { AppConfig } from '../../src/config';
import { AppConfigDto } from '../../src/shared/applications/dto/response/app-config.dto';

describe('AppService', () => {
  let service: AppService;
  let configServiceMock: ConfigServiceMock;

  const expectedConfig: AppConfig = {
    name: 'App de pruebas',
    description: 'Descripción de pruebas',
    version: '9.9.9-test',
    server: {
      host: '127.0.0.1',
      port: 9999,
      useGlobalPrefix: true,
      globalPrefix: 'graphql',
      environment: 'test',
      logLevel: 'info',
    },
  };

  beforeEach(() => {
    configServiceMock = {
      getOrThrow: jest.fn<AppConfig, [string]>(() => expectedConfig),
    };

    service = new AppService(configServiceMock as unknown as ConfigService);
  });

  describe('getHello', () => {
    it('debe devolver el saludo por defecto', () => {
      expect(service.getHello()).toBe('Hello World!');
    });
  });

  describe('getAppInfo', () => {
    it('debe recuperar la configuración desde ConfigService y transformarla a DTO', () => {
      const result = service.getAppInfo();

      expect(configServiceMock.getOrThrow).toHaveBeenCalledTimes(1);
      expect(configServiceMock.getOrThrow).toHaveBeenCalledWith('appConfig');
      expect(result).toBeInstanceOf(AppConfigDto);
      expect(result).toMatchObject(expectedConfig);
      expect(result.server).toEqual(expectedConfig.server);
    });
  });
});

interface ConfigServiceMock {
  getOrThrow: jest.Mock<AppConfig, [string]>;
}
