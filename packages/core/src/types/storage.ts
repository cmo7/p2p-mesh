import type { Chunk } from "./chunk";
import type { UUID } from "./common";
import type { ChunkedFile } from "./file";
import type { PeerInfo } from "./peer";

export type FileEventType = "added" | "updated" | "deleted";
export type ChunkEventType = "added" | "updated" | "deleted";
export type PeerEventType = "online" | "offline" | "updated" | "new";

// Structured error type for storage operations
export type StorageErrorCode =
	| "not_found"
	| "conflict"
	| "network"
	| "permission"
	| "unknown";

export interface StorageError {
	code: StorageErrorCode;
	message: string;
	details?: unknown;
}

// Pagination types
export type PaginationParams = {
	offset?: number;
	limit?: number;
};

export type PaginatedResult<T> = {
	items: T[];
	total: number;
	offset: number;
	limit: number;
};

// Result type for operations
export type Result<T> =
	| { ok: true; value: T }
	| { ok: false; error: StorageError };

// Helper type for progress-enabled operations
export type WithProgress<T> = T & {
	onProgress?: (progress: number, total: number) => void;
};

export interface FileStorage {
	getFile(fileId: UUID): Promise<Result<ChunkedFile>>;
	saveFile(args: WithProgress<{ file: ChunkedFile }>): Promise<Result<void>>;
	deleteFile(args: WithProgress<{ fileId: UUID }>): Promise<Result<void>>;
	listFiles(
		args: WithProgress<{ params?: PaginationParams }>,
	): Promise<Result<PaginatedResult<ChunkedFile>>>;
	onFileChanged(
		callback: (fileID: UUID, event: FileEventType) => void,
	): () => void;
}

export interface ChunkStorage {
	getChunk(chunkId: UUID): Promise<Result<Chunk>>;
	saveChunk(args: WithProgress<{ chunk: Chunk }>): Promise<Result<void>>;
	deleteChunk(args: WithProgress<{ chunkId: UUID }>): Promise<Result<void>>;
	listChunks(
		args: WithProgress<{ params?: PaginationParams }>,
	): Promise<Result<PaginatedResult<Chunk>>>;
	onChunkChanged(
		callback: (chunkID: UUID, event: ChunkEventType) => void,
	): () => void;
}

export interface Keystore {
	savePeerKey(
		args: WithProgress<{ peerId: UUID; publicKey: CryptoKey }>,
	): Promise<Result<void>>;
	getPeerKey(args: WithProgress<{ peerId: UUID }>): Promise<Result<CryptoKey>>;
	deletePeerKey(args: WithProgress<{ peerId: UUID }>): Promise<Result<void>>;
	listPeerIds(
		args?: WithProgress<Record<string, never>>,
	): Promise<Result<UUID[]>>;
	listPeerKeys(
		args?: WithProgress<Record<string, never>>,
	): Promise<Result<{ peerId: UUID; publicKey: CryptoKey }[]>>;
}

export interface PeerStorage {
	getPeer({
		peerId,
		onProgress,
	}: {
		peerId: UUID;
		onProgress?: (progress: number, total: number) => void;
	}): Promise<Result<PeerInfo>>;
	savePeer({
		peerInfo,
		onProgress,
	}: {
		peerInfo: PeerInfo;
		onProgress?: (progress: number, total: number) => void;
	}): Promise<Result<void>>;
	deletePeer({
		peerId,
		onProgress,
	}: {
		peerId: UUID;
		onProgress?: (progress: number, total: number) => void;
	}): Promise<Result<void>>;
	listPeers({
		params,
		onProgress,
	}: {
		params?: PaginationParams;
		onProgress?: (progress: number, total: number) => void;
	}): Promise<Result<PaginatedResult<PeerInfo>>>;
	onPeerChanged(
		callback: (peerInfo: PeerInfo, event: PeerEventType) => void,
	): () => void;
}
