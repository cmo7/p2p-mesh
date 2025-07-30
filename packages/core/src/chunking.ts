import { getChunkChecksum } from "./checksum";
import type { ChunkedFile, UnsignedChunk } from "./types";

/**
 * Divide un ArrayBuffer en chunks de tamaño fijo.
 * @param file ArrayBuffer a dividir
 * @param options Opciones de chunking (chunkSize, etc)
 */
export async function chunkFile(
	filename: string,
	file: ArrayBuffer,
	options?: { chunkSize?: number },
): Promise<ChunkedFile> {
	const chunkSize = options?.chunkSize ?? 64 * 1024;
	const chunks: UnsignedChunk[] = [];
	const totalChunks = Math.ceil(file.byteLength / chunkSize);
	for (let chunkNumber = 0; chunkNumber < totalChunks; chunkNumber++) {
		const chunkData = file.slice(
			chunkNumber * chunkSize,
			(chunkNumber + 1) * chunkSize,
		);
		const checksum = await getChunkChecksum(chunkData);

		const chunk: UnsignedChunk = {
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
		filename: filename,
		hash: await getChunkChecksum(file),
		chunks: chunks,
	};
}

export async function mergeChunks(
	chunkedFile: ChunkedFile,
): Promise<ArrayBuffer> {
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
	const sortedChunks = [...chunkedFile.chunks].sort(
		(a, b) => a.index - b.index,
	);
	return { ...chunkedFile, chunks: sortedChunks };
}
