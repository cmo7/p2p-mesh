import type { Chunk, ChunkedFile } from "core";

// Utilidades para el almacenamiento en el navegador
type FileDBEntry = Omit<ChunkedFile, 'chunks'>;
type ChunkDBEntry = Chunk & {
  hash: string;
  filename?: string;
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
    chunkStoreName = "chunks"
  ) {
    this.dbName = dbName;
    this.fileStoreName = fileStoreName;
    this.chunkStoreName = chunkStoreName;
  }

  public static getInstance(
    dbName?: string,
    fileStoreName?: string,
    chunkStoreName?: string
  ): StorageDB {
    if (!StorageDB.instance) {
      StorageDB.instance = new StorageDB(
        dbName,
        fileStoreName,
        chunkStoreName
      );
    }
    return StorageDB.instance;
  }

  // Recupera un FileDBEntry por clave
  public async getFileDBEntry(key: string): Promise<FileDBEntry | undefined> {
    const store = await this.getFileStore();
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result as FileDBEntry | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  // Recupera un ChunkDBEntry por clave
  public async getChunkDBEntry(key: string): Promise<ChunkDBEntry | undefined> {
    const store = await this.getChunkStore();
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result as ChunkDBEntry | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  // Recupera todos los chunks de un archivo por hash
  public async getChunksForFile(hash: string): Promise<ChunkDBEntry[]> {
    const store = await this.getChunkStore();
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const result = (request.result as ChunkDBEntry[]).filter(chunk => chunk.hash === hash);
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Recupera un archivo completo, hidratando sus chunks
  public async getHydratedFile(hash: string): Promise<ChunkedFile | undefined> {
    const fileKey = this.generateFileStorageKey({ hash } as FileDBEntry);
    const fileEntry = await this.getFileDBEntry(fileKey);
    if (!fileEntry) return undefined;
    const chunks = await this.getChunksForFile(hash);
    // Extrae filename del primer chunk si existe
    const filename = chunks.length > 0 && chunks[0].filename ? chunks[0].filename : '';
    return { filename, hash, chunks };
  }

  // Recupera un chunk dado el hash y el index
  public async getChunkByHashAndIndex(hash: string, index: number): Promise<ChunkDBEntry | undefined> {
    const key = this.generateChunkStorageKey(index, hash);
    return this.getChunkDBEntry(key);
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(this.fileStoreName)) {
          db.createObjectStore(this.fileStoreName, { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains(this.chunkStoreName)) {
          db.createObjectStore(this.chunkStoreName, { keyPath: "index" });
        }
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve(this.db);
      };
      req.onerror = () => reject(req.error);
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
    return db.transaction(this.fileStoreName, "readwrite").objectStore(this.fileStoreName);
  }

  private async getChunkStore(): Promise<IDBObjectStore> {
    const db = await this.getDB();
    return db.transaction(this.chunkStoreName, "readwrite").objectStore(this.chunkStoreName);
  }

  public async saveChunkToIndexedDB(
    chunk: Chunk,
    fileHash: string
  ): Promise<void> {
    const store = await this.getChunkStore();
    return new Promise((resolve, reject) => {
      const key = this.generateChunkStorageKey(chunk.index, fileHash);
      const chunkEntry: ChunkDBEntry = {
        ...chunk,
        hash: fileHash,
      };
      const request = store.put(chunkEntry, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async saveChunkedFileToIndexedDB(chunkedFile: ChunkedFile): Promise<void> {
    const store = await this.getFileStore();
    const key = this.generateFileStorageKey({ hash: chunkedFile.hash } as FileDBEntry);
    const fileMetadata: FileDBEntry = {
      filename: chunkedFile.filename,
        hash: chunkedFile.hash,
    };
    const request = store.put(fileMetadata, key);
    await new Promise<void>((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
    await Promise.all(
      chunkedFile.chunks.map(chunk =>
        this.saveChunkToIndexedDB(chunk, chunkedFile.hash)
      )
    );
  }
}

const storageDB = StorageDB.getInstance();

export async function saveChunkToIndexedDB(
  chunk: Chunk,
  hash: string
): Promise<void> {
  return storageDB.saveChunkToIndexedDB(chunk, hash);
}

export async function saveChunkedFileToIndexedDB(chunkedFile: ChunkedFile): Promise<void> {
  return storageDB.saveChunkedFileToIndexedDB(chunkedFile);
}

export async function getFileDBEntry(key: string): Promise<FileDBEntry | undefined> {
  return storageDB.getFileDBEntry(key);
}

export async function getChunkDBEntry(key: string): Promise<ChunkDBEntry | undefined> {
  return storageDB.getChunkDBEntry(key);
}

export async function getHydratedFile(hash: string): Promise<ChunkedFile | undefined> {
  return storageDB.getHydratedFile(hash);
}

export async function getChunkByHashAndIndex(hash: string, index: number): Promise<ChunkDBEntry | undefined> {
  return storageDB.getChunkByHashAndIndex(hash, index);
}