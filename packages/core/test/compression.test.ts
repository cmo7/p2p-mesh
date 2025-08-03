import { expect, test } from "vitest";
import {
	chunkFile,
	compressChunk,
	decompressChunk,
	type UnCompressedChunk,
} from "../src";
import {
	getExampleBuffer,
	getLargeTextBuffer,
	getTestImageBuffer,
} from "./testdata";

test("can compress and decompress chunks", async () => {
	const data = getExampleBuffer(2048);
	const { chunks } = await chunkFile({
		filename: "test file",
		file: data,
		chunkSize: 512,
	});
	for (const chunk of chunks) {
		const compressed = await compressChunk(chunk as UnCompressedChunk, "gzip");
		expect(compressed).toBeDefined();
		const decompressed = await decompressChunk(compressed);
		expect(decompressed).toEqual(chunk);
	}
});

test("can compress and decompress a real image file", async () => {
	const data = getTestImageBuffer();
	const { chunks } = await chunkFile({
		filename: "test file",
		file: data,
		chunkSize: 512 * 1024,
	});
	for (const chunk of chunks) {
		const compressed = await compressChunk(chunk as UnCompressedChunk, "gzip");
		expect(compressed).toBeDefined();
		const decompressed = await decompressChunk(compressed);
		expect(decompressed).toEqual(chunk);
	}
});

test("can compress and decompress a large text file", async () => {
	const data = getLargeTextBuffer();
	const { chunks } = await chunkFile({
		filename: "test file",
		file: data,
		chunkSize: 4096,
	});
	for (const chunk of chunks) {
		const compressed = await compressChunk(chunk as UnCompressedChunk, "gzip");
		expect(compressed).toBeDefined();
		const decompressed = await decompressChunk(compressed);
		expect(decompressed).toEqual(chunk);
	}
});
