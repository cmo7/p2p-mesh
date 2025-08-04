import { createSHA256 } from "hash-wasm";
import {
	type Chunk,
	type ChunkedFile,
	type ChunkStorage,
	type CompletedChunk,
	type DryChunk,
	type IsoTimestamp,
	isCompletedChunk,
	isDryChunk,
} from "../types";
import { getChecksum } from "./checksum";
import { createTimestamps } from "./timestamp";
import { isUUID } from "./uuid";

type ChunkFileParams = {
	file: File;
	chunkSize: number;
	onProgress?: (progress: number, total: number) => void;
};

const defaultChunkSize = 64 * 1024; // 64 KB

export async function chunkFile({
	file,
	chunkSize = defaultChunkSize,
	onProgress,
}: ChunkFileParams): Promise<ChunkedFile> {
	const fileId = crypto.randomUUID();
	const chunks: CompletedChunk[] = [];
	const totalChunks = Math.ceil(file.size / chunkSize);
	let processedBytes = 0;
	const hasher = await createSHA256();

	for (let i = 0; i < totalChunks; i++) {
		const start = i * chunkSize;
		const end = Math.min(start + chunkSize, file.size);
		const chunkBlob = file.slice(start, end);
		const chunkRawData = await chunkBlob.arrayBuffer();
		const chunkChecksum = await getChecksum(chunkRawData);

		// Update full file hash incrementally
		hasher.update(new Uint8Array(chunkRawData));

		chunks.push({
			id: crypto.randomUUID(),
			index: i,
			fileId,
			status: "completed",
			size: chunkRawData.byteLength,
			payload: {
				data: chunkRawData,
				checksum: chunkChecksum,
			},
			timestamps: {
				createdAt: new Date().toISOString() as IsoTimestamp,
				updatedAt: new Date().toISOString() as IsoTimestamp,
			},
		});

		processedBytes += chunkRawData.byteLength;

		if (onProgress) {
			onProgress(processedBytes, file.size);
		}
	}

	const fileChecksum = hasher.digest("hex");

	return {
		filename: file.name,
		id: fileId,
		size: file.size,
		progress: processedBytes,
		status: "hydrated",
		hash: fileChecksum,
		chunks,
		timestamps: createTimestamps(),
	};
}

export function mergeFile({
	chunkedFile,
	onProgress,
}: {
	chunkedFile: ChunkedFile;
	onProgress?: (progress: number, total: number) => void;
}): File {
	if (chunkedFile.status !== "hydrated") {
		throw new Error("Cannot merge an dehydrated or partial file.");
	}
	const blobParts = chunkedFile.chunks
		.sort((a, b) => a.index - b.index)
		.map((chunk, index) => {
			if (onProgress) {
				onProgress(index + 1, chunkedFile.chunks.length);
			}
			return chunk.payload.data;
		});
	return new File(blobParts, chunkedFile.filename, {
		type: "application/octet-stream",
	});
}

export async function hydrateChunk(
	chunk: Chunk,
	store: ChunkStorage,
): Promise<Chunk> {
	if (isUUID(chunk)) {
		const r = await store.getChunk(chunk);
		if (!r.ok) {
			throw new Error(`Failed to retrieve chunk: ${r.error.message}`);
		}
		return r.value;
	} else if (isCompletedChunk(chunk)) {
		return chunk;
	}
	throw new Error("Invalid chunk provided for hydration.");
}

async function batchHydrateChunks(
	chunks: Chunk[],
	store: ChunkStorage,
	onProgress?: (progress: number, total: number) => void,
): Promise<Chunk[]> {
	const hydratedBatch = await Promise.all(
		chunks.map(async (chunk, index) => {
			if (onProgress) {
				onProgress(index + 1, chunks.length);
			}
			const hydratedChunk = await hydrateChunk(chunk, store);
			if (!isCompletedChunk(hydratedChunk)) {
				return chunk as DryChunk;
			}
			return hydratedChunk as CompletedChunk;
		}),
	);

	return hydratedBatch;
}

export async function hydrateFile({
	chunkedFile,
	store,
	onProgress,
}: {
	chunkedFile: ChunkedFile;
	store: ChunkStorage;
	onProgress?: (progress: number, total: number) => void;
}): Promise<ChunkedFile> {
	const batches: Chunk[][] = [];
	const batchSize = 100; // Define your batch size here
	for (let i = 0; i < chunkedFile.chunks.length; i += batchSize) {
		batches.push(chunkedFile.chunks.slice(i, i + batchSize));
	}

	const hydratedChunks: Chunk[] = [];
	for (const batch of batches) {
		const hydratedBatch = await batchHydrateChunks(batch, store, onProgress);
		hydratedChunks.push(...hydratedBatch);
	}

	const fullyHydrated = hydratedChunks.every((chunk): chunk is CompletedChunk =>
		isCompletedChunk(chunk),
	);

	return {
		...chunkedFile,
		chunks: hydratedChunks as CompletedChunk[],
		status: fullyHydrated ? "hydrated" : "partial",
		timestamps: createTimestamps(),
	};
}

export function missingChunks(chunkedFile: ChunkedFile): Chunk[] {
	return chunkedFile.chunks.filter((chunk): chunk is DryChunk =>
		isDryChunk(chunk),
	);
}
