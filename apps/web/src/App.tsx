import { createRouter, RouterProvider } from "@tanstack/react-router";
import { consoleLogger } from "./lib/logger";
import { LogProvider } from "./providers/log-provider";
import { routeTree } from "./routes/__generated__/routeTree.gen";

const router = createRouter({ routeTree });

function App() {
	return (
		// biome-ignore lint/complexity/noUselessFragments: It's convenient to use fragments here
		<>
			<LogProvider logger={consoleLogger}>
				<RouterProvider router={router} />
			</LogProvider>
		</>
	);
}

export default App;
