import { Chunk, ChunkedFile } from "../types";

export function getChunkKey(chunk: Chunk): IDBValidKey {
    return ['chunk', chunk.fileId, chunk.index];
}

export function getFileKey(chunkedFile: ChunkedFile): IDBValidKey {
    return ['file', chunkedFile.id];
}