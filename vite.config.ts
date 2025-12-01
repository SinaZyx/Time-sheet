import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Augmenter la limite d'avertissement à 1000 KB (les bibliothèques PDF/Excel sont lourdes)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Séparer les grosses bibliothèques dans des chunks séparés pour un meilleur caching
        manualChunks: {
          // Bibliothèques PDF
          'pdf-vendor': ['jspdf', 'jspdf-autotable'],
          // Bibliothèques Excel et ZIP
          'excel-vendor': ['xlsx', 'jszip'],
          // React et Supabase
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
  },
});
