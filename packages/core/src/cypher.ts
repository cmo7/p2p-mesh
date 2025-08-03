import type { CypherAlgorithm, UnsignedChunk } from "./types";

export function cypherChunk(
	chunk: UnsignedChunk,
	algorithm: CypherAlgorithm,
	key: CryptoKey,
): Promise<UnsignedChunk> {
	if (algorithm === "NONE") {
		return Promise.resolve(chunk);
	}

	const iv = crypto.getRandomValues(new Uint8Array(12)); // IV for AES-GCM
	const enc = new TextEncoder();
	const data = enc.encode(JSON.stringify(chunk));

	return crypto.subtle
		.encrypt(
			{
				name: algorithm === "AES-GCM" ? "AES-GCM" : "AES-CBC",
				iv: iv,
			},
			key,
			data,
		)
		.then((encryptedData) => {
			return {
				...chunk,
				data: encryptedData as ArrayBuffer,
				cypherAlgorithm: algorithm,
				metadata: {
					...chunk.metadata,
					cypherIV: iv, // Store IV for decryption
				},
			};
		});
}
