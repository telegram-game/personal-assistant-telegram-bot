import { ConfigurableModuleBuilder } from '@nestjs/common';
import { ConfigModuleOptions } from 'src/interfaces';

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE: MODULE_OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE: MODULE_ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<ConfigModuleOptions>()
  .setClassMethodName('forRoot')
  .build();
