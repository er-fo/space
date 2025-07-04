const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    target: 'web',
    entry: './src/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'renderer.bundle.js',
      clean: true
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-react',
                '@babel/preset-typescript'
              ]
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|jpe?g|gif|svg|ico)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[name][ext]'
          }
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@styles': path.resolve(__dirname, 'src/styles')
      },
      fallback: {
        "events": false,
        "buffer": false,
        "util": false,
        "process": false,
        "path": false,
        "fs": false,
        "os": false,
        "crypto": false,
        "stream": false,
        "url": false,
        "querystring": false,
        "http": false,
        "https": false,
        "zlib": false,
        "assert": false,
        "constants": false,
        "domain": false,
        "punycode": false,
        "string_decoder": false,
        "timers": false,
        "tty": false,
        "vm": false,
        "worker_threads": false
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        filename: 'index.html'
      })
    ],
    devServer: {
      port: 3000,
      hot: false,
      liveReload: false,
      static: {
        directory: path.join(__dirname, 'public')
      },
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    },
    devtool: isDevelopment ? 'eval-source-map' : false,
    mode: argv.mode || 'development'
  };
}; 