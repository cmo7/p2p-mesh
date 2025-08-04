// Modern IndexedDB wrapper for browser persistence
// Allows creation of generic storages and optimizes DB instance usage
import dbConfig from "../dbConfig";

type StoreSchema = {
	name: string;
	options?: IDBObjectStoreParameters;
};

interface DBConfig {
	name: string;
	version?: number;
	stores: StoreSchema[];
}

class IndexedDBWrapper {
	private static instances: Map<string, IndexedDBWrapper> = new Map();
	private db: IDBDatabase | null = null;
	private config: DBConfig;
	private openPromise: Promise<IDBDatabase> | null = null;

	private constructor(config: DBConfig) {
		this.config = config;
	}

	static getInstance(config: DBConfig = dbConfig): IndexedDBWrapper {
		const key = config.name;
		let instance = IndexedDBWrapper.instances.get(key);
		if (!instance) {
			instance = new IndexedDBWrapper(config);
			IndexedDBWrapper.instances.set(key, instance);
		}
		return instance;
	}

	private openDB(): Promise<IDBDatabase> {
		if (this.db) return Promise.resolve(this.db);
		if (this.openPromise) return this.openPromise;
		this.openPromise = new Promise((resolve, reject) => {
			const request = indexedDB.open(this.config.name, this.config.version);
			request.onupgradeneeded = () => {
				const db = request.result;
				for (const store of this.config.stores) {
					if (!db.objectStoreNames.contains(store.name)) {
						db.createObjectStore(store.name, store.options);
					}
				}
			};
			request.onsuccess = () => {
				this.db = request.result;
				resolve(this.db);
			};
			request.onerror = () => {
				reject(request.error);
			};
		});
		return this.openPromise;
	}

	async getStore(
		storeName: string,
		mode: IDBTransactionMode = "readonly",
	): Promise<IDBObjectStore> {
		const db = await this.openDB();
		const tx = db.transaction(storeName, mode);
		return tx.objectStore(storeName);
	}

	async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
		const store = await this.getStore(storeName);
		return new Promise((resolve, reject) => {
			const req = store.get(key);
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
	}

	async set<T>(storeName: string, value: T, key?: IDBValidKey): Promise<void> {
		const store = await this.getStore(storeName, "readwrite");
		return new Promise((resolve, reject) => {
			const req = key !== undefined ? store.put(value, key) : store.put(value);
			req.onsuccess = () => resolve();
			req.onerror = () => reject(req.error);
		});
	}

	async delete(storeName: string, key: IDBValidKey): Promise<void> {
		const store = await this.getStore(storeName, "readwrite");
		return new Promise((resolve, reject) => {
			const req = store.delete(key);
			req.onsuccess = () => resolve();
			req.onerror = () => reject(req.error);
		});
	}

	async clear(storeName: string): Promise<void> {
		const store = await this.getStore(storeName, "readwrite");
		return new Promise((resolve, reject) => {
			const req = store.clear();
			req.onsuccess = () => resolve();
			req.onerror = () => reject(req.error);
		});
	}

	async getAll<T>(storeName: string): Promise<T[]> {
		const store = await this.getStore(storeName);
		return new Promise((resolve, reject) => {
			const req = store.getAll();
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
	}

	async close(): Promise<void> {
		if (this.db) {
			this.db.close();
			this.db = null;
			this.openPromise = null;
			IndexedDBWrapper.instances.delete(this.config.name);
		}
	}
}

export { IndexedDBWrapper };
export type { DBConfig, StoreSchema };
