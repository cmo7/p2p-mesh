import { createRouter, RouterProvider } from "@tanstack/react-router";
import { consoleLogger } from "./lib/logger";
import { ChunkStoreContextProvider } from "./persistence/indexedb/providers/ChunkStoreContextProvider";
import { FileStoreContextProvider } from "./persistence/indexedb/providers/FileStoreContextProvider";
import { LogProvider } from "./providers/log-provider";
import { routeTree } from "./routes/__generated__/routeTree.gen";

const router = createRouter({ routeTree });

function StoreProviders({ children }: { children: React.ReactNode }) {
	return (
		<ChunkStoreContextProvider>
			<FileStoreContextProvider>{children}</FileStoreContextProvider>
		</ChunkStoreContextProvider>
	);
}

function App() {
	return (
		// biome-ignore lint/complexity/noUselessFragments: It's convenient to use fragments here
		<>
			<LogProvider logger={consoleLogger}>
				<StoreProviders>
					<RouterProvider router={router} />
				</StoreProviders>
			</LogProvider>
		</>
	);
}

export default App;
