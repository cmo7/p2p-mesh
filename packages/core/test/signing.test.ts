import { expect, test } from "vitest";
import { chunkFile, signChunk, type UnsignedChunk, verifyChunk } from "../src";

test("signed chunks are verifiable", async () => {
	const data = new ArrayBuffer(2048);
	const { chunks } = await chunkFile(data, { chunkSize: 512 });
	const keyPair = await crypto.subtle.generateKey(
		{ name: "ECDSA", namedCurve: "P-256" },
		true,
		["sign", "verify"],
	);
	for (const chunk of chunks) {
		const signed = await signChunk(chunk as UnsignedChunk, keyPair.privateKey);
		expect(signed.signed).toBe(true);
		const valid = await verifyChunk(signed, keyPair.publicKey);
		expect(valid).toBe(true);
	}
});
