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

export interface FileStorage {
	getFile(fileId: UUID): Promise<Result<ChunkedFile>>;
	saveFile(file: ChunkedFile): Promise<Result<void>>;
	deleteFile(fileId: UUID): Promise<Result<void>>;
	listFiles(
		params?: PaginationParams,
	): Promise<Result<PaginatedResult<ChunkedFile>>>;
	onFileChanged(
		callback: (fileID: UUID, event: FileEventType) => void,
	): () => void;
}

export interface ChunkStorage {
	getChunk(chunkId: UUID): Promise<Result<Chunk>>;
	saveChunk(chunk: Chunk): Promise<Result<void>>;
	deleteChunk(chunkId: UUID): Promise<Result<void>>;
	listChunks(
		params?: PaginationParams,
	): Promise<Result<PaginatedResult<Chunk>>>;
	onChunkChanged(
		callback: (chunkID: UUID, event: ChunkEventType) => void,
	): () => void;
}

export interface Keystore {
	savePeerKey(peerId: UUID, publicKey: CryptoKey): Promise<Result<void>>;
	getPeerKey(peerId: UUID): Promise<Result<CryptoKey>>;
	deletePeerKey(peerId: UUID): Promise<Result<void>>;
	listPeerIds(): Promise<Result<UUID[]>>;
	listPeerKeys(): Promise<Result<{ peerId: UUID; publicKey: CryptoKey }[]>>;
}

export interface PeerStorage {
	getPeer(peerId: UUID): Promise<Result<PeerInfo>>;
	savePeer(peerInfo: PeerInfo): Promise<Result<void>>;
	deletePeer(peerId: UUID): Promise<Result<void>>;
	listPeers(
		params?: PaginationParams,
	): Promise<Result<PaginatedResult<PeerInfo>>>;
	onPeerChanged(
		callback: (peerInfo: PeerInfo, event: PeerEventType) => void,
	): () => void;
}
