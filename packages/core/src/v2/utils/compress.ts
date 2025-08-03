import { deflate, gzip, inflate, ungzip } from "pako";
import type { CompletedChunk, CompressionAlgorithm } from "../types";
import { getChecksum } from "./checksum";

export function isCompressed(chunk: CompletedChunk): boolean {
	return (
		chunk.compression !== undefined &&
		chunk.compression.compressionStatus === "compressed" &&
		chunk.compression.compressionAlgorithm !== undefined
	);
}

export async function compressChunk(
	chunk: CompletedChunk,
	algorithm: CompressionAlgorithm,
): Promise<CompletedChunk> {
	if (isCompressed(chunk)) {
		throw new Error("Chunk is already compressed.");
	}

	switch (algorithm) {
		case "gzip": {
			const chunkData = compressWithGzip(chunk.data.data);
			const transportChecksum = await getChecksum(chunkData);
			chunk.compression = {
				compressionStatus: "compressed",
				compressionAlgorithm: "gzip",
				transportChecksum,
			};
			chunk.data.data = chunkData;
			break;
		}
		case "deflate": {
			const chunkData = compressWithDeflate(chunk.data.data);
			const transportChecksum = await getChecksum(chunkData);
			chunk.compression = {
				compressionStatus: "compressed",
				compressionAlgorithm: "deflate",
				transportChecksum,
			};
			chunk.data.data = chunkData;
			break;
		}
		case "none":
			chunk.compression = {
				compressionStatus: "uncompressed",
				compressionAlgorithm: "none",
				transportChecksum: undefined,
			};
			// No compression applied, just return the chunk as is
			break;
		default:
			throw new Error("Unsupported compression algorithm.");
	}

	return chunk;
}

export async function verifyTransportChecksum(
	chunk: CompletedChunk,
): Promise<boolean> {
	if (!chunk.compression || !chunk.compression.transportChecksum) {
		throw new Error("Chunk compression metadata is missing.");
	}

	const calculatedChecksum = await getChecksum(chunk.data.data);
	return calculatedChecksum === chunk.compression.transportChecksum;
}

export async function decompressedChunk(
	chunk: CompletedChunk,
): Promise<CompletedChunk> {
	if (!isCompressed(chunk)) {
		return chunk; // No decompression needed
	}

	if (!chunk.compression || !chunk.compression.compressionAlgorithm) {
		throw new Error("Chunk compression metadata is missing.");
	}

	const isValid = await verifyTransportChecksum(chunk);
	if (!isValid) {
		throw new Error("Transport checksum does not match, cannot decompress.");
	}

	switch (chunk.compression.compressionAlgorithm) {
		case "gzip":
			chunk.data.data = decompressWithGzip(chunk.data.data);
			break;
		case "deflate":
			chunk.data.data = decompressWithDeflate(chunk.data.data);
			break;
		default:
			throw new Error("Unsupported compression algorithm.");
	}

	chunk.compression = {
		compressionStatus: "uncompressed",
		compressionAlgorithm: "none",
		transportChecksum: undefined,
	};

	return chunk;
}

function compressWithGzip(data: ArrayBuffer): ArrayBuffer {
	const compressed = gzip(new Uint8Array(data));
	return compressed.slice().buffer;
}

function compressWithDeflate(data: ArrayBuffer): ArrayBuffer {
	const compressed = deflate(new Uint8Array(data));
	return compressed.slice().buffer;
}

function decompressWithGzip(data: ArrayBuffer): ArrayBuffer {
	const decompressed = ungzip(new Uint8Array(data));
	return decompressed.slice().buffer;
}

function decompressWithDeflate(data: ArrayBuffer): ArrayBuffer {
	const decompressed = inflate(new Uint8Array(data));
	return decompressed.slice().buffer;
}
