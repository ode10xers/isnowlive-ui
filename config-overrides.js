const TerserPlugin = require('terser-webpack-plugin');
const rewireUglifyjs = require('react-app-rewire-uglifyjs');
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');

const smp = new SpeedMeasurePlugin();

const getBabelLoader = (config, isOutsideOfApp) => {
  let babelLoaderFilter;
  if (isOutsideOfApp) {
    babelLoaderFilter = (rule) => rule.loader && rule.loader.includes('babel') && rule.exclude;
  } else {
    babelLoaderFilter = (rule) => rule.loader && rule.loader.includes('babel') && rule.include;
  }
  let loaders = config.module.rules.find((rule) => Array.isArray(rule.oneOf)).oneOf;

  let babelLoader = loaders.find(babelLoaderFilter);
  if (!babelLoader) {
    loaders = loaders.reduce((ldrs, rule) => ldrs.concat(rule.use || []), []);
    babelLoader = loaders.find(babelLoaderFilter);
  }
  return babelLoader;
};

module.exports = function override(config, env) {
  const isEnvProduction = env === 'production';
  const isEnvProductionProfile = isEnvProduction && process.argv.includes('--profile');
  config.optimization = {
    ...config.optimization,
    runtimeChunk: true,
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
    minimizer: config.optimization.minimizer.map((plugin) => {
      if (plugin.constructor.name === 'TerserPlugin') {
        return new TerserPlugin({
          terserOptions: {
            parse: {
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
              evaluate: false,
            },
            mangle: {
              safari10: true,
            },
            keep_classnames: isEnvProductionProfile,
            keep_fnames: isEnvProductionProfile,
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
        });
      }
      return plugin;
    }),
  };

  config.output = {
    ...config.output,
    pathinfo: false,
  };

  const returnTarget = rewireUglifyjs({
    ...config,
    ...(isEnvProduction ? getBabelLoader(config).options.plugins.push('react-remove-properties') : {}),
  });

  return isEnvProduction ? smp.wrap(returnTarget) : returnTarget;
};
