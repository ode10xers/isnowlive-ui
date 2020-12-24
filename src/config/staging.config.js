import devConfig from './development.config';

export default {
  ...devConfig,
  client: {
    platformBaseURL: 'https://app.stage.passion.do',
  },
};
