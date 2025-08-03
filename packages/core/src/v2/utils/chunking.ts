import type { Chunk, ChunkedFile } from "../types";
import { getChecksum } from "./checksum";

type ChunkFileParams = {
	file: File;
	chunkSize: number;
	onProgress?: (progress: number, total: number) => void;
};

const defaultChunkSize = 64 * 1024; // 64 KB

export function chunkFile({
	file,
	chunkSize = defaultChunkSize,
	onProgress,
}: ChunkFileParams): Promise<ChunkedFile> {
	return new Promise((resolve, reject) => {
		const totalChunks = Math.ceil(file.size / chunkSize);
		const chunks: Chunk[] = [];
		let processedChunks = 0;
		const fileId = crypto.randomUUID(); // Generate a unique ID for the file

		const readChunk = (index: number) => {
			if (index >= totalChunks) {
				resolve({
					id: fileId,
					filename: file.name,
					status: "completed",
					chunks,
				});
				return;
			}

			const start = index * chunkSize;
			const end = Math.min(start + chunkSize, file.size);
			const chunkBlob = file.slice(start, end);

			const reader = new FileReader();
			reader.onload = async (event) => {
				const data = event.target?.result as ArrayBuffer;
				const checksum = await getChecksum(data);
				chunks.push({
					fileId: fileId,
					index,
					total: totalChunks,
					data,
					checksum,
					metadata: {
						createdAt: new Date().toISOString(),
						size: data.byteLength,
					},
				});

				processedChunks++;
				if (onProgress) {
					onProgress(processedChunks, totalChunks);
				}
				readChunk(index + 1);
			};
			reader.onerror = reject;
			reader.readAsArrayBuffer(chunkBlob);
		};

		readChunk(0);
	});
}
