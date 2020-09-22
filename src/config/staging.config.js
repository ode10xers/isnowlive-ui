import devConfig from './development.config';

export default {
  ...devConfig,
  /* Staging config here */
  server: {
    baseURL: 'https://stage-api.isnow.live',
  },
};
