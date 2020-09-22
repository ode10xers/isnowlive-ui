import devConfig from './development.config';
import stagingConfig from './staging.config';
import prodConfig from './production.config';

const env = process.env.REACT_APP_ENV || 'development';

const config = {
  development: devConfig,
  staging: stagingConfig,
  production: prodConfig,
};

export default config[env];
