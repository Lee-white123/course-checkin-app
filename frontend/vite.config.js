import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
  build: {
    outDir: "../static",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("vue-router") || /node_modules[\\/](vue)[\\/]/.test(id)) return "vendor-vue";
          if (id.includes("element-plus") || id.includes("@element-plus") || id.includes("vant")) return "vendor-ui";
          if (id.includes("@vueuse")) return "vendor-utils";
          return "vendor";
        },
      },
    },
  },
});
