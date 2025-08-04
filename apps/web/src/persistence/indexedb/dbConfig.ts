// Configuración centralizada para IndexedDB
import type { DBConfig } from "./util/indexedDB";

const dbConfig: DBConfig = {
	name: "p2p-mesh-db",
	version: 1,
	stores: [{ name: "chunks" }, { name: "files" }],
};

export default dbConfig;
