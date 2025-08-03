import type { UUID } from "crypto";
import type { Checksum } from "./utils/checksum";

type ChunkDownloadStatus = "loading" | "waiting" | "completed" | "failed";

type ChunkSignatureStatus = "unsigned" | "signed" | "invalid";

type ChunkCompressionStatus = "uncompressed" | "compressed";

type FileReference = UUID;

type Timestamps = {
	createdAt: string;
	updatedAt: string;
};

type ChunkData = {
	data: ArrayBuffer;
	checksum?: string;
};

type ChunkSignature = {
	signatureStatus: ChunkSignatureStatus;
	value: string;
	signerId: UUID;
	signedAt: string;
};

export type CompressionAlgorithm = "gzip" | "deflate" | "none";

type ChunkCompression = {
	compressionStatus: ChunkCompressionStatus;
	compressionAlgorithm?: CompressionAlgorithm;
	transportChecksum?: Checksum;
};

type ChunkMetadata = {
	index: number;
	size: number;
	status: ChunkDownloadStatus;
	fileId: FileReference;
	metadata: Timestamps;
};

type PendingChunk = ChunkMetadata & {
	status: "pending";
	data: never;
};

type LoadingChunk = ChunkMetadata & {
	status: "loading";
	data: ChunkData;
};

export type CompletedChunk = ChunkMetadata & {
	status: "completed";
	data: ChunkData;
	signature?: ChunkSignature;
	compression?: ChunkCompression;
};

type FailedChunk = ChunkMetadata & {
	status: "failed";
	error: string;
};

export type Chunk = PendingChunk | CompletedChunk | FailedChunk | LoadingChunk;

type FileStatus = "loading" | "pending" | "completed" | "downloading";

type FileMetadata = {
	filename: string;
	id: UUID;
	size: number;
	progress: number;
	status: FileStatus;
	hash: string | null;
};

type LoadingFile = FileMetadata & {
	status: "loading";
	chunks: LoadingChunk[];
};

type PendingFile = FileMetadata & {
	status: "pending";
	chunks: PendingChunk[];
};

type CompletedFile = FileMetadata & {
	status: "completed";
	chunks: CompletedChunk[];
};

type DownloadingFile = FileMetadata & {
	status: "downloading";
	chunks: (PendingChunk | CompletedChunk)[];
};

export type ChunkedFile =
	| LoadingFile
	| PendingFile
	| CompletedFile
	| DownloadingFile;
