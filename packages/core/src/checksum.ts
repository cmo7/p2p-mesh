import type { Chunk } from "./types";

// Genera un checksum sha-256 para los datos del chunk
export async function getChunkChecksum(data: ArrayBuffer): Promise<string> {
	const hash = await crypto.subtle.digest("SHA-256", data);
	return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

// Verifica si un chunk es válido comparando su checksum
export async function isValidChunk(chunk: Chunk): Promise<boolean> {
	if (!chunk.checksum) {
		console.warn("Chunk checksum is missing.");
		return false;
	}
	return isValidChecksum(chunk.data, chunk.checksum);
}

// Verifica si el checksum de transporte es válido
export async function isValidTransportChecksum(chunk: Chunk): Promise<boolean> {
	if (!chunk.transportChecksum) {
		console.warn("Chunk transport checksum is missing.");
		return false;
	}
	return isValidChecksum(chunk.data, chunk.transportChecksum);
}

// Verifica un checksum contra los datos
export async function isValidChecksum(
	data: ArrayBuffer,
	checksum: string,
): Promise<boolean> {
	const calculatedChecksum = await getChunkChecksum(data);
	console.log(
		`Calculated checksum: ${calculatedChecksum}, Expected: ${checksum}`,
	);
	return calculatedChecksum === checksum;
}
