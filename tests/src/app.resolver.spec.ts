import { AppResolver } from '../../src/app.resolver';
import { AppService } from '../../src/app.service';
import { AppConfigDto } from '../../src/shared/applications/dto/response/app-config.dto';

describe('AppResolver', () => {
  let resolver: AppResolver;
  let appServiceMock: AppServiceMock;

  const mockAppConfigDto: AppConfigDto = {
    name: 'Test App',
    description: 'Aplicación de ejemplo',
    version: '0.0.1-test',
    server: {
      host: 'localhost',
      port: 4000,
      useGlobalPrefix: false,
      globalPrefix: 'api',
      environment: 'test',
      logLevel: 'debug',
    },
  };

  beforeEach(() => {
    appServiceMock = {
      getAppInfo: jest.fn<AppConfigDto, []>(() => mockAppConfigDto),
    };

    resolver = new AppResolver(appServiceMock as unknown as AppService);
  });

  describe('getAppInfo', () => {
    it('debe delegar en el servicio de aplicación y retornar la configuración recibida', () => {
      const result = resolver.getAppInfo();

      expect(appServiceMock.getAppInfo).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockAppConfigDto);
      expect(result).toEqual(mockAppConfigDto);
    });
  });
});

interface AppServiceMock {
  getAppInfo: jest.Mock<AppConfigDto, []>;
}
