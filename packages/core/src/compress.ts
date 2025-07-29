import { deflate, gzip, inflate, ungzip } from "pako";
import { getChunkChecksum, isValidTransportChecksum } from "./checksum";
import { isCompressed, isSigned } from "./guards";
import type {
	CompressedChunk,
	CompressionAlgorithm,
	UnCompressedChunk,
} from "./types";

export async function compressChunk(
	chunk: UnCompressedChunk,
	algorithm: CompressionAlgorithm,
): Promise<CompressedChunk> {
	if (isSigned(chunk)) {
		throw new Error(
			"Cannot compress a signed chunk. Please verify the chunk is unsigned before compressing.",
		);
	}

	const compressedData = compressData(chunk.data, algorithm);
	const compressedChecksum = await getChunkChecksum(compressedData);

	return {
		...chunk,
		compressed: true,
		compressionAlgorithm: algorithm,
		transportChecksum: compressedChecksum,
		data: compressedData,
	};
}

export async function decompressChunk(
	chunk: CompressedChunk,
): Promise<UnCompressedChunk> {
	if (!isCompressed(chunk)) {
		throw new Error("Chunk is not compressed.");
	}

	const decompressedData = await decompressData(
		chunk.data,
		chunk.compressionAlgorithm,
	);
    
    const decompressedChunk = {
        	...chunk,
		data: decompressedData,
		// Reset compression properties
		compressed: false,
		compressionAlgorithm: undefined,
		transportChecksum: undefined,
	};

    if (!isValidTransportChecksum(chunk)) {
        throw new Error("Invalid transport checksum after decompression.");
    }

	return decompressedChunk as UnCompressedChunk;
}

function compressData(
	data: ArrayBuffer,
	algorithm: CompressionAlgorithm,
): ArrayBuffer {
	switch (algorithm) {
		case "gzip":
			return compressWithGzip(data);
		case "deflate":
			return compressWithDeflate(data);
		default:
			throw new Error(`Unsupported compression algorithm: ${algorithm}`);
	}
}

function decompressData(
	data: ArrayBuffer,
	algorithm: CompressionAlgorithm,
): ArrayBuffer {
	switch (algorithm) {
		case "gzip":
			return decompressWithGzip(data);
		case "deflate":
			return decompressWithDeflate(data);
		default:
			throw new Error(`Unsupported decompression algorithm: ${algorithm}`);
	}
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

function checksumTransport(chunk: CompressedChunk): string {
    if (!isCompressed(chunk)) {
        throw new Error("Chunk is not compressed.");
    }
    return chunk.transportChecksum || "";
}