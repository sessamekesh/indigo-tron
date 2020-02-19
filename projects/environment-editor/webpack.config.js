const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  mode: "development",

  devtool: "source-map",

  resolve: {
    extensions: ['.ts', '.tsx'],
    plugins: [new TsconfigPathsPlugin({
      configFile: "./tsconfig.json",
    })]
  },

  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader"
      }
    ]
  },
  externals: {
    "react": "React",
    "react-dom": "ReactDOM"
  },
  watch: true,
};
