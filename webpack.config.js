const path = require("path");
const { VueLoaderPlugin } = require("vue-loader");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",
  devtool: "cheap-module-source-map",
  entry: {
    main: "./src/main.js", // Popup entry point
    background: "./src/background.js",
    content: "./src/content.js", // Content script entry point
  },
  output: {
    filename: "[name].js", // Use [name] to create main.js and background.js
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  module: {
    rules: [
      { test: /\.vue$/, use: "vue-loader" },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      { test: /\.css$/, use: ["style-loader", "css-loader", "postcss-loader"] },
      {
        test: /\.(svg|png|jpg|gif)$/,
        type: "asset/resource",
        generator: { filename: "icons/[name][ext]" },
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new CopyPlugin({
      patterns: [
        { from: "index.html", to: "." }, // Popup HTML
        { from: "manifest.json", to: "." }, // Manifest file
        { from: "src/icons", to: "icons" }, // Icons folder
        { from: 'src/background.js', to: 'background.js' }, 
        { from: "src/content.js", to: "content.js" },
      ],
    }),
  ],
  resolve: {
    extensions: [".js", ".vue", ".json"],
  },
  watch: true,
};
