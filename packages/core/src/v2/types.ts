import { UUID } from "crypto";

type ChunkDownloadStatus = "waiting" | "completed" | "failed";

type ChunkSignatureStatus = "unsigned" | "signed" | "invalid";

type ChunkCompressionStatus = "uncompressed" | "compressed";

type FileReference = UUID;

type Timestamps = {
    createdAt: string;
    updatedAt: string;
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
    data?: never;
    checksum?: never;
};

type CompletedChunk = ChunkMetadata & {
    status: "completed";
    data: ArrayBuffer;
    checksum: string;
    signatureStatus: ChunkSignatureStatus;
    compressionStatus: ChunkCompressionStatus;
    compressionAlgorithm?: string;
};

type FailedChunk = ChunkMetadata & {
    status: "failed";
    error: string;
};

export type Chunk = PendingChunk | CompletedChunk | FailedChunk;


type FileStatus = "pending"  | "completed" | "downloading";

type FileMetadata = {
    filename: string;
    id: UUID;
    size: number;
    progress: number;
    status: FileStatus;
    hash: string | null;
};

type PendingFile = FileMetadata & {
    status: "pending";
};

type CompletedFile = FileMetadata & {
    status: "completed";
    chunks: CompletedChunk[];
};

type DownloadingFile = FileMetadata & {
    status: "downloading";
    chunks: Chunk[];
};

export type ChunkedFile = PendingFile | CompletedFile | DownloadingFile;