import { expect, test } from "vitest";
import { chunkFile } from "../src";
import { emptyBuffer, getExampleBuffer, getTestImageBuffer } from "./testdata";

test("divides buffer correctly", async () => {
	const buffer = getExampleBuffer(1024);
	const file = await chunkFile(buffer, { chunkSize: 256 });
	expect(file.chunks).toHaveLength(4);
});

test("handles empty buffer", async () => {
	const buffer = emptyBuffer;
	const file = await chunkFile(buffer, { chunkSize: 256 });
	expect(file.chunks).toHaveLength(0);
});

test("handles buffer smaller than chunk size", async () => {
	const buffer = getExampleBuffer(128);
	const file = await chunkFile(buffer, { chunkSize: 256 });
	expect(file.chunks).toHaveLength(1);
	expect(file.chunks[0].data.byteLength).toBe(128);
});

test("can chunk a real image file", async () => {
	const buffer = getTestImageBuffer();
	// chunk size de 64 KiB para imagen grande
	const file = await chunkFile(buffer, { chunkSize: 64 * 1024 });
	expect(file.chunks.length).toBeGreaterThan(1);
	expect(file.chunks[0].data.byteLength).toBeLessThanOrEqual(64 * 1024);
});
