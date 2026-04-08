const path = require("path");

module.exports = {
  transpileDependencies: [],
  configureWebpack: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"), 
        "@shared": path.resolve(__dirname, "src/shared-ui/src"),
      },
    },
  },
  css: {
    loaderOptions: {
      sass: {
        additionalData: `@import "@/sass/variables.scss"`
      },
      scss: {
        additionalData: `@import "@/sass/variables.scss";`
      }
    }
  },
};
