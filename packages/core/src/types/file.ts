import type { Chunk, CompletedChunk, DryChunk } from "./chunk";
import type { Metadata, Timestamps, UUID, Version } from "./common";

type BaseFile = {
	filename: string;
	id: UUID;
	size: number;
	progress: number;
	hash: string | null;
	version?: Version;
	metadata?: Metadata;
	timestamps: Timestamps;
};

type DryFile = BaseFile & {
	status: "dry";
	chunks: DryChunk[];
};

type PartialFile = BaseFile & {
	status: "partial";
	chunks: Chunk[];
};

type HydratedFile = BaseFile & {
	status: "hydrated";
	chunks: CompletedChunk[];
};

export type ChunkedFile = DryFile | PartialFile | HydratedFile;
