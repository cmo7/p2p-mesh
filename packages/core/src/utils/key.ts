import type { Chunk, ChunkedFile } from "../types";

export function getChunkKey(chunk: Chunk): IDBValidKey {
	if (typeof chunk === "string") {
		return ["chunk", chunk];
	} else if ("id" in chunk) {
		return ["chunk", chunk.id];
	} else {
		throw new Error("Invalid chunk provided for key generation.");
	}
}

export function getFileKey(chunkedFile: ChunkedFile): IDBValidKey {
	return ["file", chunkedFile.id];
}
