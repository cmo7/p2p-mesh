import type {
	Checksum,
	IsoTimestamp,
	Metadata,
	Timestamps,
	UUID,
	Version,
} from "./common";

export type ChunkEncryptionAlgorithm = "aes-256-gcm" | "none";

type EncryptedDetails = {
	encryptionStatus: "encrypted";
	encryptionAlgorithm: ChunkEncryptionAlgorithm;
	peerId: UUID;
	cypherChecksum: Checksum;
	iv: Uint8Array;
};

type UnEncryptedDetails = {
	encryptionStatus: "unencrypted";
	encryptionAlgorithm?: never;
	peerId?: never;
	cypherChecksum?: never;
	iv?: never;
};

type ChunkEncryptionDetails = EncryptedDetails | UnEncryptedDetails;

type FileReference = UUID;

type ChunkPayload = {
	data: ArrayBuffer;
	checksum?: string;
};

type UnsignedDetails = {
	signatureStatus: "unsigned";
	signature?: never;
	signerId?: never;
	signedAt?: never;
};

type SignedDetails = {
	signatureStatus: "signed";
	signature: string;
	signerId: UUID;
	signedAt: IsoTimestamp;
};

type InvalidSignatureDetails = {
	signatureStatus: "invalid";
	signature?: never;
	signerId?: never;
	signedAt?: never;
};

type ChunkSigningDetails =
	| SignedDetails
	| UnsignedDetails
	| InvalidSignatureDetails;

export type CompressionAlgorithm = "gzip" | "deflate" | "none";

type CompressedDetails = {
	compressionStatus: "compressed";
	compressionAlgorithm: CompressionAlgorithm;
	transportChecksum: Checksum;
};

type UncompressedDetails = {
	compressionStatus: "uncompressed";
	compressionAlgorithm?: never;
	transportChecksum?: never;
};

type ChunkCompressionDetails = CompressedDetails | UncompressedDetails;

type BaseChunk = {
	id: UUID;
	index: number;
	size: number;
	fileId: FileReference;
	timestamps: Timestamps;
	version?: Version;
	metadata?: Metadata;
};

export type CompletedChunk = BaseChunk & {
	status: "completed";
	payload: ChunkPayload;
	signatureDetails?: ChunkSigningDetails;
	compressionDetails?: ChunkCompressionDetails;
	encryptionDetails?: ChunkEncryptionDetails;
};

export type DryChunk = UUID;

export type Chunk = CompletedChunk | DryChunk;

export function isCompletedChunk(chunk: Chunk): chunk is CompletedChunk {
	if (typeof chunk === "string") {
		return false;
	}
	return (
		"status" in chunk &&
		chunk.status === "completed" &&
		"payload" in chunk &&
		chunk.payload !== undefined &&
		"data" in chunk.payload &&
		chunk.payload.data instanceof ArrayBuffer
	);
}

export function isMissingChunk(chunk: Chunk): chunk is DryChunk {
	return typeof chunk === "string";
}
export function isDryChunk(chunk: Chunk): chunk is DryChunk {
	return typeof chunk === "string";
}
export function isChunkedFile(
	chunk: Chunk | CompletedChunk | DryChunk,
): chunk is CompletedChunk | DryChunk {
	return isCompletedChunk(chunk) || isDryChunk(chunk);
}
