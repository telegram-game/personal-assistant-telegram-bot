import { Environment } from 'src/config/validation';

export interface ConfigModuleOptions {
  env: Environment | 'development' | 'production';
}
