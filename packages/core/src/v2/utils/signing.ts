import type { UUID } from "crypto";
import type { Chunk, CompletedChunk } from "../types";
import { arrayBufferToBase64, base64ToArrayBuffer } from "./base64";

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
	chunk: CompletedChunk,
	privateKey: CryptoKey,
	signerId: UUID,
): Promise<CompletedChunk> {
	if (!chunk.data) {
		throw new Error("Chunk data is required for signing.");
	}
	if (chunk.status !== "completed") {
		throw new Error("Only completed chunks can be signed.");
	}
	const dataToSign = JSON.stringify({
		chunkData: chunk.data,
		signerId,
	});
	const signature = await signData(dataToSign, privateKey);
	return {
		...chunk,
		signature: {
			signatureStatus: "signed",
			value: signature,
			signerId,
			signedAt: new Date().toISOString(),
		},
	};
}

export async function verifyChunkSignature(
	chunk: CompletedChunk,
	publicKey: CryptoKey,
): Promise<boolean> {
	if (!chunk.signature) {
		throw new Error("Chunk is not signed.");
	}
	const dataToVerify = JSON.stringify({
		chunkData: chunk.data,
		signerId: chunk.signature.signerId,
		signedAt: chunk.signature.signedAt,
	});
	return verifySignature(dataToVerify, chunk.signature.value, publicKey);
}

export async function isSigned(chunk: Chunk): Promise<boolean> {
	if (chunk.status !== "completed" || !chunk.signature) {
		return false;
	}
	return true;
}
