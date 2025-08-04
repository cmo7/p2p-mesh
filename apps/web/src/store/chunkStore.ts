import type { Chunk, ChunkEventType, ChunkStorage } from "core";
import { create } from "zustand";

interface ChunkStore extends ChunkStorage {
	chunks: Chunk[];
	_chunkListeners: Array<(chunk: Chunk, event: ChunkEventType) => void>;
	_notifyChunkListeners: (chunk: Chunk, event: ChunkEventType) => void;
}

export const useChunkStore = create<ChunkStore>((set, get) => ({
	chunks: [],
	_chunkListeners: [],

	_notifyChunkListeners(chunk, event) {
		get()._chunkListeners.forEach((listener) => listener(chunk, event));
	},

	async getChunk(chunkId) {
		const chunk = get().chunks.find((c) => c.id === chunkId);
		if (!chunk) {
			return {
				ok: false,
				error: { code: "not_found", message: "Chunk not found" },
			};
		}
		return { ok: true, value: chunk };
	},

	async saveChunk(chunk) {
		const chunks = get().chunks;
		const existingIndex = chunks.findIndex((c) => c.id === chunk.id);
		let event: ChunkEventType = "added";
		if (existingIndex !== -1) {
			chunks[existingIndex] = chunk; // Update existing chunk
			event = "updated";
		} else {
			chunks.push(chunk); // Add new chunk
		}
		set({ chunks });
		get()._notifyChunkListeners(chunk, event);
		return { ok: true, value: undefined };
	},

	async deleteChunk(chunkId) {
		const chunks = get().chunks;
		const index = chunks.findIndex((c) => c.id === chunkId);
		if (index === -1) {
			return {
				ok: false,
				error: { code: "not_found", message: "Chunk not found" },
			};
		}
		const [deletedChunk] = chunks.splice(index, 1);
		set({ chunks });
		get()._notifyChunkListeners(deletedChunk, "deleted");
		return { ok: true, value: undefined };
	},

	async listChunks(params) {
		const chunks = get().chunks;
		const filteredChunks = chunks.slice(
			params?.offset || 0,
			(params?.offset || 0) + (params?.limit || chunks.length),
		);
		return {
			ok: true,
			value: {
				items: filteredChunks,
				total: chunks.length,
				offset: params?.offset || 0,
				limit: params?.limit || chunks.length,
			},
		};
	},

	onChunkChanged(callback) {
		get()._chunkListeners.push(callback);
		return () => {
			const listeners = get()._chunkListeners;
			set({ _chunkListeners: listeners.filter((l) => l !== callback) });
		};
	},
}));
