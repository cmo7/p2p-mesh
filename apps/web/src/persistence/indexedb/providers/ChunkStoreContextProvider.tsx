import React from "react";
import { ChunkIndexedDBStore } from "../stores/chunk.idb";

const ChunkContext = React.createContext<ChunkIndexedDBStore>(
	ChunkIndexedDBStore.getInstance(),
);

export function useChunkStore() {
	return React.useContext(ChunkContext);
}

export function ChunkStoreContextProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const store = ChunkIndexedDBStore.getInstance();
	return (
		<ChunkContext.Provider value={store}>{children}</ChunkContext.Provider>
	);
}
