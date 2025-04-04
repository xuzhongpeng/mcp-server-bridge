const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

// 创建多个配置
module.exports = [
  // 渲染进程配置
  {
    target: "web", // 改为web，而不是electron-renderer
    entry: "./src/renderer/index.tsx",
    output: {
      path: path.resolve(__dirname, "build"),
      filename: "renderer.js",
      publicPath: "./",
    },
    optimization: {
      splitChunks: false,
    },
    node: {
      global: true,
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "ts-loader",
          },
        },
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                "@babel/preset-env", 
                "@babel/preset-react",
                "@babel/preset-typescript"
              ],
            },
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: "asset/resource",
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx"],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "public", "index.html"),
        filename: "index.html",
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, "public"),
      },
      port: 3000,
      hot: true,
    },
  },
  // 主进程配置
  {
    target: "electron-main",
    entry: "./src/main/main.ts",
    output: {
      path: path.resolve(__dirname, "build"),
      filename: "main.js",
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: "ts-loader",
          },
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    node: {
      __dirname: false,
      __filename: false,
    },
  },
  // 预加载脚本配置
  {
    target: "electron-preload",
    entry: "./src/main/preload.ts",
    output: {
      path: path.resolve(__dirname, "build"),
      filename: "preload.js",
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: "ts-loader",
          },
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    node: {
      __dirname: false,
      __filename: false,
    },
  },
];
