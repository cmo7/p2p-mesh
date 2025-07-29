import type { Chunk } from "./types";

/**
 * Devuelve `true` si el chunk ha sido firmado.
 */
export function isSigned(chunk: Chunk): chunk is Chunk & { signature: string } {
	return typeof chunk.signature === "string" && chunk.signature.length > 0;
}

/**
 * Devuelve `true` si el chunk ha sido comprimido.
 */
export function isCompressed(chunk: Chunk): chunk is Chunk & {
	compressed: true;
	compressionAlgorithm: "gzip" | "deflate";
} {
	return (
		chunk.compressed === true && typeof chunk.compressionAlgorithm === "string"
	);
}
