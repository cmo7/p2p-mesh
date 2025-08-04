import { deflate, gzip, inflate, ungzip } from "pako";
import type { CompletedChunk, CompressionAlgorithm } from "../types";
import { getChecksum } from "./checksum";
import { updateTimestamps } from "./timestamp";

export function isCompressed(chunk: CompletedChunk): boolean {
	return (
		chunk.compressionDetails !== undefined &&
		chunk.compressionDetails.compressionStatus === "compressed" &&
		chunk.compressionDetails.compressionAlgorithm !== undefined
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
			const chunkData = compressWithGzip(chunk.payload.data);
			const transportChecksum = await getChecksum(chunkData);
			chunk.compressionDetails = {
				compressionStatus: "compressed",
				compressionAlgorithm: "gzip",
				transportChecksum,
			};
			chunk.payload.data = chunkData;
			chunk.timestamps = updateTimestamps(chunk.timestamps);
			break;
		}
		case "deflate": {
			const chunkData = compressWithDeflate(chunk.payload.data);
			const transportChecksum = await getChecksum(chunkData);
			chunk.compressionDetails = {
				compressionStatus: "compressed",
				compressionAlgorithm: "deflate",
				transportChecksum,
			};
			chunk.payload.data = chunkData;
			chunk.timestamps = updateTimestamps(chunk.timestamps);
			break;
		}
		case "none":
			chunk.compressionDetails = {
				compressionStatus: "uncompressed",
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
	if (
		!chunk.compressionDetails ||
		!chunk.compressionDetails.transportChecksum
	) {
		throw new Error("Chunk compression metadata is missing.");
	}

	const calculatedChecksum = await getChecksum(chunk.payload.data);
	return calculatedChecksum === chunk.compressionDetails.transportChecksum;
}

export async function decompressedChunk(
	chunk: CompletedChunk,
): Promise<CompletedChunk> {
	if (!isCompressed(chunk)) {
		return chunk; // No decompression needed
	}

	if (
		!chunk.compressionDetails ||
		!chunk.compressionDetails.compressionAlgorithm
	) {
		throw new Error("Chunk compression metadata is missing.");
	}

	const isValid = await verifyTransportChecksum(chunk);
	if (!isValid) {
		throw new Error("Transport checksum does not match, cannot decompress.");
	}

	switch (chunk.compressionDetails.compressionAlgorithm) {
		case "gzip":
			chunk.payload.data = decompressWithGzip(chunk.payload.data);
			break;
		case "deflate":
			chunk.payload.data = decompressWithDeflate(chunk.payload.data);
			break;
		default:
			throw new Error("Unsupported compression algorithm.");
	}

	chunk.compressionDetails = {
		compressionStatus: "uncompressed",
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
