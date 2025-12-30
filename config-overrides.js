const webpack = require('webpack');

module.exports = function override(config, env) {
  //do stuff with the webpack config...

  config.resolve.fallback = {
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    stream: require.resolve('stream-browserify'),
    assert: require.resolve('assert'),
    zlib: require.resolve('browserify-zlib'),
    url: false,
  };

  config.plugins.unshift(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    })
  );

  // Support CJS file
  // https://github.com/facebook/create-react-app/pull/12021
  config.module.rules = config.module.rules.map((rule) => {
    if (rule.oneOf instanceof Array) {
      rule.oneOf[rule.oneOf.length - 1].exclude = [/\.(js|mjs|jsx|cjs|ts|tsx)$/, /\.html$/, /\.json$/];
      
      // Exclude @base-org/account from babel-loader (uses import attributes syntax)
      rule.oneOf.forEach((loader) => {
        if (loader.loader && loader.loader.includes('babel-loader')) {
          loader.exclude = loader.exclude || [];
          if (Array.isArray(loader.exclude)) {
            loader.exclude.push(/node_modules\/@base-org/);
          } else {
            loader.exclude = [loader.exclude, /node_modules\/@base-org/];
          }
        }
      });
    }
    return rule;
  });

  return config;
};
