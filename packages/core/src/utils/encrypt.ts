import type { Chunk, ChunkEncryptionAlgorithm, UUID } from "../types";
import { getChecksum } from "./checksum";

export async function encryptChunk(
	chunk: Chunk,
	cypherKey: CryptoKey,
	peerId: UUID,
	algorithm: ChunkEncryptionAlgorithm = "aes-256-gcm",
): Promise<Chunk> {
	// Chunk is not an UUID
	if (typeof chunk !== "object" || !chunk || !("status" in chunk)) {
		throw new Error("Invalid chunk provided for encryption.");
	}
	if (chunk.status !== "completed") {
		throw new Error("Only completed chunks can be cyphered.");
	}
	if (!chunk.payload) {
		throw new Error("Chunk data is required for cyphering.");
	}
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const data = chunk.payload.data;
	const cypherData = await crypto.subtle.encrypt(
		{ name: algorithm, iv },
		cypherKey,
		data,
	);
	const cypherChecksum = await getChecksum(cypherData);
	return {
		...chunk,
		payload: {
			...chunk.payload,
			data: cypherData,
		},
		encryptionDetails: {
			encryptionStatus: "encrypted",
			encryptionAlgorithm: algorithm,
			peerId,
			cypherChecksum,
			iv,
		},
	};
}

export async function decryptChunk(
	chunk: Chunk,
	cypherKey: CryptoKey,
): Promise<Chunk> {
	// Chunk is not an UUID
	if (typeof chunk !== "object" || !chunk || !("status" in chunk)) {
		throw new Error("Invalid chunk provided for decryption.");
	}
	if (chunk.status !== "completed") {
		throw new Error("Only completed chunks can be decyphered.");
	}
	if (
		!chunk.encryptionDetails ||
		chunk.encryptionDetails.encryptionStatus !== "encrypted"
	) {
		throw new Error("Chunk is not encrypted.");
	}
	if (!chunk.payload || !chunk.payload.data) {
		throw new Error("Chunk data is required for decryption.");
	}
	if (
		!chunk.encryptionDetails.iv ||
		!chunk.encryptionDetails.encryptionAlgorithm
	) {
		throw new Error("Chunk encryption details are incomplete.");
	}
	const { iv, encryptionAlgorithm } = chunk.encryptionDetails;
	const decryptedData = await crypto.subtle.decrypt(
		{ name: encryptionAlgorithm, iv },
		cypherKey,
		chunk.payload.data,
	);
	return {
		...chunk,
		payload: {
			...chunk.payload,
			data: decryptedData,
		},
		encryptionDetails: {
			encryptionStatus: "unencrypted",
		},
	};
}
