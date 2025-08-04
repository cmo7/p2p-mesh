import type {
	Chunk,
	ChunkEventType,
	ChunkStorage,
	PaginatedResult,
	PaginationParams,
	Result,
	UUID,
} from "core";
// ...existing code...

import { IndexedDBWrapper } from "../util/indexedDB";

export class ChunkIndexedDBStore implements ChunkStorage {
	private static instance: ChunkIndexedDBStore | null = null;
	private Database: IndexedDBWrapper;
	_chunkListeners: Array<(chunk: Chunk, event: ChunkEventType) => void> = [];

	private constructor(database: IndexedDBWrapper) {
		this.Database = database;
	}

	static getInstance(): ChunkIndexedDBStore {
		if (!ChunkIndexedDBStore.instance) {
			const db = IndexedDBWrapper.getInstance();
			ChunkIndexedDBStore.instance = new ChunkIndexedDBStore(db);
		}
		return ChunkIndexedDBStore.instance;
	}

	_notifyChunkListeners(chunkID: UUID, event: ChunkEventType) {
		this._chunkListeners.forEach((listener) => listener(chunkID, event));
	}

	async getChunk(chunkId: UUID): Promise<Result<Chunk>> {
		const chunk = await this.Database.get<Chunk>("chunks", chunkId);
		return chunk
			? { ok: true, value: chunk }
			: { ok: false, error: { code: "not_found", message: "Chunk not found" } };
	}

	async saveChunk(chunk: Chunk): Promise<Result<void>> {
		await this.Database.set<Chunk>("chunks", chunk, chunk.id);
		this._notifyChunkListeners(chunk, "added");
		return { ok: true, value: undefined };
	}

	async deleteChunk(chunkId: string): Promise<Result<void>> {
		await this.Database.delete("chunks", chunkId);
		this._notifyChunkListeners({ id: chunkId } as Chunk, "deleted");
		return { ok: true, value: undefined };
	}

	async listChunks(
		params?: PaginationParams,
	): Promise<Result<PaginatedResult<Chunk>>> {
		const chunks = await this.Database.getAll<Chunk>("chunks");
		const total = chunks.length;
		const offset = params?.offset || 0;
		const limit = params?.limit || total;

		const paginatedChunks = chunks.slice(offset, offset + limit);
		return {
			ok: true,
			value: {
				items: paginatedChunks,
				total,
				offset,
				limit,
			},
		};
	}
	onChunkChanged(
		callback: (chunkID: UUID, event: ChunkEventType) => void,
	): () => void {
		this._chunkListeners.push(callback);
		return () => {
			this._chunkListeners = this._chunkListeners.filter(
				(cb) => cb !== callback,
			);
		};
	}
}
