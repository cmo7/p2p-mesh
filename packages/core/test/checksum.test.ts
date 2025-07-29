import { expect, test } from "vitest";
import { chunkFile, isValidChunk } from "../src";

test("chunks checksum is correct", async () => {
	const buffer = new ArrayBuffer(1024);
	const file = await chunkFile(buffer, { chunkSize: 256 });
	for (const chunk of file.chunks) {
		const checksum = await chunk.checksum;
		expect(checksum).toBeDefined();
		expect(chunk.data.byteLength).toBeLessThanOrEqual(256);
	}
});

test("chunks with invalid checksum are detected", async () => {
	const buffer = new ArrayBuffer(1024);
	const file = await chunkFile(buffer, { chunkSize: 256 });
	for (const chunk of file.chunks) {
		// Modify the chunk data to create an invalid checksum
		chunk.data = new Uint8Array(chunk.data).map(() => 1).buffer;
		const isValid = await isValidChunk(chunk);
		expect(isValid).toBe(false);
	}
});
