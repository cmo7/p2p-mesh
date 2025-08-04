import type { Chunk, UUID } from "../types";
import { arrayBufferToBase64, base64ToArrayBuffer } from "./base64";
import { newTimestamp } from "./timestamp";

export async function signData(
	data: string,
	privateKey: CryptoKey,
): Promise<string> {
	const encoder = new TextEncoder();
	const dataBuffer = encoder.encode(data);
	const signature = await crypto.subtle.sign(
		{ name: "HMAC", hash: "SHA-256" },
		privateKey,
		dataBuffer,
	);
	return arrayBufferToBase64(signature);
}

export async function verifySignature(
	data: string,
	signature: string,
	publicKey: CryptoKey,
): Promise<boolean> {
	const encoder = new TextEncoder();
	const dataBuffer = encoder.encode(data);
	const signatureBuffer = base64ToArrayBuffer(signature);
	const isValid = await crypto.subtle.verify(
		{ name: "HMAC", hash: "SHA-256" },
		publicKey,
		signatureBuffer,
		dataBuffer,
	);
	return isValid;
}

export async function signChunk(
	chunk: Chunk,
	privateKey: CryptoKey,
	signerId: UUID,
): Promise<Chunk> {
	if (typeof chunk !== "object" || !chunk || !("status" in chunk)) {
		throw new Error("Invalid chunk provided for signing.");
	}
	if (chunk.status !== "completed") {
		throw new Error("Only completed chunks can be signed.");
	}
	if (!chunk.payload) {
		throw new Error("Chunk data is required for signing.");
	}
	if (chunk.status !== "completed") {
		throw new Error("Only completed chunks can be signed.");
	}
	const dataToSign = JSON.stringify({
		chunkData: chunk.payload,
		signerId,
	});
	const signature = await signData(dataToSign, privateKey);
	return {
		...chunk,
		signatureDetails: {
			signatureStatus: "signed",
			signature,
			signerId,
			signedAt: newTimestamp(),
		},
	};
}

export async function verifyChunkSignature(
	chunk: Chunk,
	publicKey: CryptoKey,
): Promise<boolean> {
	if (typeof chunk !== "object" || !chunk || !("status" in chunk)) {
		throw new Error("Invalid chunk provided for signature verification.");
	}
	if (chunk.status !== "completed") {
		throw new Error("Only completed chunks can be verified.");
	}
	if (!chunk.signatureDetails) {
		throw new Error("Chunk is not signed.");
	}
	if (chunk.signatureDetails.signatureStatus !== "signed") {
		throw new Error("Chunk signature is invalid or missing.");
	}
	const dataToVerify = JSON.stringify({
		chunkData: chunk.payload,
		signerId: chunk.signatureDetails.signerId,
		signedAt: chunk.signatureDetails.signedAt,
	});
	return verifySignature(
		dataToVerify,
		chunk.signatureDetails.signature,
		publicKey,
	);
}

export async function isSigned(chunk: Chunk): Promise<boolean> {
	if (typeof chunk !== "object" || !chunk || !("status" in chunk)) {
		throw new Error("Invalid chunk provided for signature check.");
	}
	if (chunk.status !== "completed" || !chunk.signatureDetails) {
		return false;
	}
	return true;
}
