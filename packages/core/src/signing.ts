import type { UUID } from "node:crypto";
import { getChunkChecksum } from "./checksum";
import type { Keyring, SignedChunk, UnsignedChunk } from "./types";
import { arrayBufferToBase64, base64ToArrayBuffer } from "./utils/base64";

export async function signChunk(
	fileChunk: UnsignedChunk,
	signerId: UUID,
	privateKey: CryptoKey,
): Promise<SignedChunk> {
	const encoder = new TextEncoder();

	const dataToSign = encoder.encode(
		JSON.stringify({
			index: fileChunk.index,
			total: fileChunk.total,
			checksum: fileChunk.checksum,
			metadata: fileChunk.metadata ?? {},
		}),
	);

	const algorithm =
		privateKey.algorithm.name === "ECDSA"
			? { name: "ECDSA", hash: "SHA-256" }
			: { name: "RSASSA-PKCS1-v1_5" };

	const signature = await crypto.subtle.sign(algorithm, privateKey, dataToSign);

	const signedChunk: SignedChunk = {
		...fileChunk,
		signature: arrayBufferToBase64(signature),
		signed: true,
		signerId,
	};
	return signedChunk;
}

export async function verifyChunk(
	chunk: SignedChunk,
	publicKey: CryptoKey,
): Promise<boolean> {
	const encoder = new TextEncoder();

	const dataToVerify = encoder.encode(
		JSON.stringify({
			index: chunk.index,
			total: chunk.total,
			checksum: chunk.checksum,
			metadata: chunk.metadata ?? {},
		}),
	);

	const signature = base64ToArrayBuffer(chunk.signature);

	const algorithm =
		publicKey.algorithm.name === "ECDSA"
			? { name: "ECDSA", hash: "SHA-256" }
			: { name: "RSASSA-PKCS1-v1_5" };

	const valid = await crypto.subtle.verify(
		algorithm,
		publicKey,
		signature,
		dataToVerify,
	);

	if (!valid) return false;

	// Verifica también el checksum del contenido
	const calculatedChecksum = await getChunkChecksum(chunk.data);
	return calculatedChecksum === chunk.checksum;
}

export async function verifyChunkUsingKeyring(
	chunk: SignedChunk,
	keyring: Keyring,
): Promise<boolean> {
	const entry = keyring.get(chunk.signerId);
	if (!entry) {
		throw new Error("Key not found in keyring");
	}
	return verifyChunk(chunk, entry.key);
}
