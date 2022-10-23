const fs = require("fs");
const path = require("path");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const appDirectory = fs.realpathSync(process.cwd());

module.exports = {
    entry: path.resolve(appDirectory, "src/app.ts"),
    output: {
        path: path.resolve(appDirectory, "dist"),
        filename: "js/app.js",
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    devServer: {
        host: "0.0.0.0",
        port: 80,
        static: path.resolve(appDirectory, "public"),
        hot: false,
        server: "http",
    },
    devtool: "inline-source-map",
    externals: {
        babylonjs: "BABYLON",
    },
    // infrastructureLogging: {
    // 	level: 'log',
    // },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.js$/,
                enforce: "pre",
                use: ["source-map-loader"],
            },
        ],
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: "node_modules/babylon*/babylon*.js", to: "js/[name].js" },
                { from: "node_modules/babylon*/babylon*.map", to: "js/[name].map" },
                { from: path.resolve("public/js/dat.gui.0.6.2.min.js"), to: "js" },
            ],
        }),
        new HtmlWebpackPlugin({
            inject: true,
            template: path.resolve(appDirectory, "public/index.html"),
        }),
        new CleanWebpackPlugin(),
    ],
    mode: "development",
};
