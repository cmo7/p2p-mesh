import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
      generatedRouteTree: "./src/routes/__generated__/routeTree.gen.ts",
      quoteStyle: "double",
		}),
		react(),
	],
});
