import type { Chunk, ChunkedFile } from "core";

// Utilidades para el almacenamiento en el navegador
export type FileDBEntry = Omit<ChunkedFile, "chunks"> & {
	size: number; // Tamaño del archivo en bytes
};
export type ChunkDBEntry = Omit<Chunk, "data"> & {
	hash: string;
	filename?: string;
	data: Uint8Array; // Convert ArrayBuffer to Uint8Array for IndexedDB
};

class StorageDB {
	private static instance: StorageDB;
	private db: IDBDatabase | null = null;
	private dbPromise: Promise<IDBDatabase> | null = null;

	private dbName: string;
	private fileStoreName: string;
	private chunkStoreName: string;

	private constructor(
		dbName = "chunkedFilesDB",
		fileStoreName = "files",
		chunkStoreName = "chunks",
	) {
		this.dbName = dbName;
		this.fileStoreName = fileStoreName;
		this.chunkStoreName = chunkStoreName;
	}

	public static getInstance(
		dbName?: string,
		fileStoreName?: string,
		chunkStoreName?: string,
	): StorageDB {
		if (!StorageDB.instance) {
			StorageDB.instance = new StorageDB(dbName, fileStoreName, chunkStoreName);
		}
		return StorageDB.instance;
	}

	// Recupera un FileDBEntry por clave
	public async getFileDBEntry(key: string): Promise<FileDBEntry | undefined> {
		console.log("Getting file DB entry for key:", key);
		const store = await this.getFileStore();
		return new Promise((resolve, reject) => {
			const request = store.get(key);
			request.onsuccess = () =>
				resolve(request.result as FileDBEntry | undefined);
			request.onerror = () => reject(request.error);
		});
	}

	// Recupera un ChunkDBEntry por clave
	public async getChunkDBEntry(key: string): Promise<ChunkDBEntry | undefined> {
		const store = await this.getChunkStore();
		return new Promise((resolve, reject) => {
			const request = store.get(key);
			request.onsuccess = () => {
				const result = request.result as ChunkDBEntry | undefined;
				resolve(result);
			};
			request.onerror = () => reject(request.error);
		});
	}

	// Recupera todos los chunks de un archivo por hash
	public async getChunksForFile(hash: string): Promise<Chunk[]> {
		console.log("Getting chunks for file with hash:", hash);
		if (!hash) {
			console.warn("Hash is required to get chunks for a file.");
			return [];
		}
		const f = await this.getFileDBEntry(
			this.generateFileStorageKey({ hash } as FileDBEntry),
		);
		if (!f) {
			console.warn("File not found in IndexedDB for hash:", hash);
			return [];
		}
		const chunks: Chunk[] = [];
		for (let i = 0; i < f.size; i++) {
			const key = this.generateChunkStorageKey(i, hash);
			const chunk = await this.getChunkDBEntry(key);
			if (chunk) {
				chunks.push(chunk);
			}
		}
		return chunks;
	}

	// Recupera un archivo completo, hidratando sus chunks
	public async getHydratedFile(hash: string): Promise<ChunkedFile | undefined> {
		console.log("Getting hydrated file for hash:", hash);
		const fileKey = this.generateFileStorageKey({ hash } as FileDBEntry);
		const fileEntry = await this.getFileDBEntry(fileKey);
		if (!fileEntry) return undefined;
		const chunks = await this.getChunksForFile(hash);
		if (chunks.length === 0) {
			console.warn("No chunks found for file with hash:", hash);
			return undefined;
		} else if (chunks.some((chunk) => !chunk.data)) {
			console.warn("Some chunks are missing data for file with hash:", hash);
			return undefined;
		}

		return { filename: fileEntry.filename, hash, chunks };
	}

	// Recupera un chunk dado el hash y el index
	public async getChunkByHashAndIndex(
		hash: string,
		index: number,
	): Promise<Chunk | undefined> {
		const key = this.generateChunkStorageKey(index, hash);
		const chunkEntry = await this.getChunkDBEntry(key);
		if (!chunkEntry) return undefined;
		// Convert Uint8Array back to ArrayBuffer
		return {
			...chunkEntry,
			data: chunkEntry.data.buffer.slice(
				chunkEntry.data.byteOffset,
				chunkEntry.data.byteOffset + chunkEntry.data.byteLength,
			),
		};
	}

	private async getDB(): Promise<IDBDatabase> {
		console.log("Opening IndexedDB:", this.dbName);
		if (this.db) return this.db;
		if (this.dbPromise) return this.dbPromise;
		this.dbPromise = new Promise((resolve, reject) => {
			const req = indexedDB.open(this.dbName, 1);
			req.onupgradeneeded = () => {
				const db = req.result;
				if (!db.objectStoreNames.contains(this.fileStoreName)) {
					db.createObjectStore(this.fileStoreName);
				}
				if (!db.objectStoreNames.contains(this.chunkStoreName)) {
					db.createObjectStore(this.chunkStoreName);
				}
			};
			req.onsuccess = () => {
				console.log("IndexedDB opened successfully:", this.dbName);
				this.db = req.result;
				resolve(this.db);
			};
			req.onerror = () => {
				console.error("IndexedDB open error:", req.error);
				reject(req.error);
			};
		});
		return this.dbPromise;
	}

	private generateFileStorageKey(metadata: FileDBEntry): string {
		return `chunked-file-${metadata.hash}`;
	}

	private generateChunkStorageKey(index: number, hash: string): string {
		return `chunk-${index}-${hash}`;
	}

	private async getFileStore(): Promise<IDBObjectStore> {
		const db = await this.getDB();
		return db
			.transaction(this.fileStoreName, "readwrite")
			.objectStore(this.fileStoreName);
	}

	private async getChunkStore(): Promise<IDBObjectStore> {
		const db = await this.getDB();
		return db
			.transaction(this.chunkStoreName, "readwrite")
			.objectStore(this.chunkStoreName);
	}

	public async saveChunkToIndexedDB(
		chunk: Chunk,
		fileHash: string,
	): Promise<void> {
		console.log("Saving chunk to IndexedDB:", chunk.index, fileHash);
		if (!chunk.data) {
			console.error("Chunk data is missing:", chunk);
			throw new Error("Chunk data is required for saving.");
		}
		const store = await this.getChunkStore();
		return new Promise((resolve, reject) => {
			const key = this.generateChunkStorageKey(chunk.index, fileHash);
			const chunkEntry: ChunkDBEntry = {
				...chunk,
				hash: fileHash,
				data: new Uint8Array(chunk.data), // Convert ArrayBuffer to Uint8Array
			};
			const request = store.put(chunkEntry, key);
			request.onsuccess = () => resolve();
			request.onerror = () => {
				console.error(
					"IndexedDB chunk put error:",
					request.error,
					chunkEntry,
					key,
				);
				reject(request.error);
			};
		});
	}

	public async saveChunkedFileToIndexedDB(
		chunkedFile: ChunkedFile,
	): Promise<void> {
		console.log("Saving chunked file to IndexedDB:", chunkedFile.filename);
		if (!chunkedFile.chunks || chunkedFile.chunks.length === 0) {
			console.error("Chunked file has no chunks:", chunkedFile);
			throw new Error("Chunked file must have at least one chunk.");
		}
		const store = await this.getFileStore();
		const key = this.generateFileStorageKey({
			hash: chunkedFile.hash,
		} as FileDBEntry);
		const fileMetadata: FileDBEntry = {
			filename: chunkedFile.filename,
			hash: chunkedFile.hash,
			size: chunkedFile.chunks.length,
		};
		const request = store.put(fileMetadata, key);
		await new Promise<void>((resolve, reject) => {
			request.onerror = () => {
				console.error(
					"IndexedDB file put error:",
					request.error,
					fileMetadata,
					key,
				);
				reject(request.error);
			};
			request.onsuccess = () => resolve();
		});
		await Promise.all(
			chunkedFile.chunks.map((chunk) =>
				this.saveChunkToIndexedDB(chunk, chunkedFile.hash),
			),
		);
	}

	public async getFiles(): Promise<FileDBEntry[]> {
		const store = await storageDB.getFileStore();
		return new Promise((resolve, reject) => {
			const request = store.getAll();
			request.onsuccess = () => {
				const result = request.result as FileDBEntry[];
				resolve(result);
			};
			request.onerror = () => reject(request.error);
		});
	}

	public async removeFile(hash: string): Promise<void> {
		const fileKey = this.generateFileStorageKey({ hash } as FileDBEntry);
		const store = await this.getFileStore();
		return new Promise((resolve, reject) => {
			const request = store.delete(fileKey);
			request.onsuccess = () => resolve();
			request.onerror = () => {
				console.error("IndexedDB file delete error:", request.error, fileKey);
				reject(request.error);
			};
		});
	}
}

const storageDB = StorageDB.getInstance();

export async function saveChunkToIndexedDB(
	chunk: Chunk,
	hash: string,
): Promise<void> {
	return storageDB.saveChunkToIndexedDB(chunk, hash);
}

export async function saveChunkedFileToIndexedDB(
	chunkedFile: ChunkedFile,
): Promise<void> {
	return storageDB.saveChunkedFileToIndexedDB(chunkedFile);
}

export async function getFileDBEntry(
	key: string,
): Promise<FileDBEntry | undefined> {
	return storageDB.getFileDBEntry(key);
}

export async function getChunkDBEntry(key: string): Promise<Chunk | undefined> {
	const chunkEntry = await storageDB.getChunkDBEntry(key);
	if (!chunkEntry) return undefined;
	// Convert Uint8Array back to ArrayBuffer
	return {
		...chunkEntry,
		data: chunkEntry.data.buffer.slice(
			chunkEntry.data.byteOffset,
			chunkEntry.data.byteOffset + chunkEntry.data.byteLength,
		),
	};
}

export async function getHydratedFile(
	hash: string,
): Promise<ChunkedFile | undefined> {
	return storageDB.getHydratedFile(hash);
}

export async function getChunkByHashAndIndex(
	hash: string,
	index: number,
): Promise<Chunk | undefined> {
	return storageDB.getChunkByHashAndIndex(hash, index);
}

export async function getFiles(): Promise<FileDBEntry[]> {
	return storageDB.getFiles();
}

export async function removeFile(hash: string): Promise<void> {
	return storageDB.removeFile(hash);
}
