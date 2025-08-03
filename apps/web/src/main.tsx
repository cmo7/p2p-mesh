import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { consoleLogger } from "./lib/logger.ts";
import { LogProvider } from "./providers/log-provider.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<LogProvider logger={consoleLogger}>
			<App />
		</LogProvider>
	</StrictMode>,
);
