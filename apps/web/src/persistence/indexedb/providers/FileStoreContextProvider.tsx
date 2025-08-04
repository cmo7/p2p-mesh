import React from "react";
import { FileIndexedDBStore } from "../stores/file.idb";

const FileContext = React.createContext<FileIndexedDBStore>(
	FileIndexedDBStore.getInstance(),
);

export function useFileStore() {
	return React.useContext(FileContext);
}

export function FileStoreContextProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const store = FileIndexedDBStore.getInstance();
	return <FileContext.Provider value={store}>{children}</FileContext.Provider>;
}
