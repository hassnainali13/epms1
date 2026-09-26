import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/jspdf/")) return "pdf-export";
          if (id.includes("/node_modules/html2canvas/")) return "html-capture";
        },
      },
    },
  },
});
