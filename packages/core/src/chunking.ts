import { getChunkChecksum } from "./checksum";
import type { ChunkedFile, CompletedChunkedFile, UnsignedChunk, UncompletedChunkedFile } from "./types";

/**
 * Divide un ArrayBuffer en chunks de tamaño fijo.
 * @param file ArrayBuffer a dividir
 * @param options Opciones de chunking (chunkSize, etc)
 */
export async function chunkFile(options: {
	filename: string;
	file: ArrayBuffer;
	chunkSize?: number;
	onProgress?: (progress: number, total: number) => void;
}): Promise<CompletedChunkedFile> {
	const { filename, file, chunkSize, onProgress } = options;
	const effectiveChunkSize = chunkSize ?? 64 * 1024;
	const chunks: UnsignedChunk[] = [];
	const totalChunks = Math.ceil(file.byteLength / effectiveChunkSize);
	for (let chunkNumber = 0; chunkNumber < totalChunks; chunkNumber++) {
		if (onProgress) {
			const progress = Math.round(((chunkNumber + 1) / totalChunks) * 100);
			onProgress(progress, totalChunks);
		}
		const chunkData = file.slice(
			chunkNumber * effectiveChunkSize,
			(chunkNumber + 1) * effectiveChunkSize,
		);
		const checksum = await getChunkChecksum(chunkData);

		const chunk: UnsignedChunk = {
			status: "ok",
			index: chunkNumber,
			total: totalChunks,
			data: chunkData,
			chunkSize: chunkData.byteLength,
			checksum: checksum,
			metadata: {
				createdAt: new Date().toISOString(),
				size: chunkData.byteLength,
			},
			signed: false,
			compressed: false,
		};
		chunks.push(chunk);
	}
	return {
		status: "completed",
		filename: filename,
		hash: await getChunkChecksum(file),
		chunks: chunks,
	};
}

export async function mergeChunks(
	chunkedFile: ChunkedFile,
): Promise<ArrayBuffer> {
	if (chunkedFile.status === "incomplete") {
		throw new Error("Cannot merge incomplete chunked file");
	}
	const totalSize = chunkedFile.chunks.reduce(
		(acc, chunk) => acc + chunk.data.byteLength,
		0,
	);
	const restoredFile = new Uint8Array(totalSize);
	let offset = 0;
	for (const chunk of chunkedFile.chunks) {
		restoredFile.set(new Uint8Array(chunk.data), offset);
		offset += chunk.data.byteLength;
	}
	return restoredFile.buffer;
}

export async function sortChunks(
	chunkedFile: ChunkedFile,
): Promise<ChunkedFile> {
	if (chunkedFile.status === "incomplete") {
		throw new Error("Cannot sort chunks of an incomplete chunked file");
	}
	const sortedChunks = [...chunkedFile.chunks].sort(
		(a, b) => a.index - b.index,
	);
	return { ...chunkedFile, chunks: sortedChunks };
}


export function getMissingChunkIndices(
	chunkedFile: UncompletedChunkedFile,
): number[] {
	const missingIndices = chunkedFile.chunks.filter(
		(chunk) => chunk.status !== "ok",
	).map((chunk) => chunk.index);
	return missingIndices;
}