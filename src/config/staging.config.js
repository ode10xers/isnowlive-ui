import devConfig from './development.config';

export default {
  ...devConfig,
  /* Staging config here */
  server: {
    baseURL: 'https://api.mocklets.com/mock68084',
  },
};
