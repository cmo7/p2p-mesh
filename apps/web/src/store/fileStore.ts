// ...existing code...
// Removed unused StateCreator import
import type {
	ChunkedFile,
	FileEventType,
	FileStorage,
	PaginatedResult,
	PaginationParams,
	Result,
} from "core";
import { create } from "zustand";

interface FileStore extends FileStorage {
	files: ChunkedFile[];
	_fileListeners: Array<(file: ChunkedFile, event: FileEventType) => void>;
	_notifyFileListeners: (file: ChunkedFile, event: FileEventType) => void;
}

export const useFileStore = create<FileStore>((set, get) => ({
	listFiles(
		params?: PaginationParams,
	): Promise<Result<PaginatedResult<ChunkedFile>>> {
		const files = get().files;
		// Implement your filtering logic based on params
		const filteredFiles = files.slice(
			params?.offset || 0,
			(params?.offset || 0) + (params?.limit || files.length),
		);
		return Promise.resolve({
			ok: true,
			value: {
				items: filteredFiles,
				total: files.length,
				offset: params?.offset || 0,
				limit: params?.limit || files.length,
			},
		});
	},
	getFile(fileId) {
		const files = get().files;
		const file = files.find((f) => f.id === fileId);
		if (!file) {
			return Promise.resolve({
				ok: false,
				error: { code: "not_found", message: "File not found" },
			});
		}
		return Promise.resolve({ ok: true, value: file });
	},
	saveFile(file) {
		const files = get().files;
		const existingIndex = files.findIndex((f) => f.id === file.id);
		let event: FileEventType = "added";
		if (existingIndex !== -1) {
			files[existingIndex] = file; // Update existing file
			event = "updated";
		} else {
			files.push(file); // Add new file
		}
		set({ files });
		get()._notifyFileListeners(file, event);
		return Promise.resolve({ ok: true, value: undefined });
	},
	deleteFile(fileId) {
		const files = get().files;
		const fileIndex = files.findIndex((f) => f.id === fileId);
		if (fileIndex === -1) {
			return Promise.resolve({
				ok: false,
				error: { code: "not_found", message: "File not found" },
			});
		}
		const [removed] = files.splice(fileIndex, 1);
		set({ files });
		if (removed) {
			get()._notifyFileListeners(removed, "deleted");
		}
		return Promise.resolve({ ok: true, value: undefined });
	},
	onFileChanged(
		callback: (file: ChunkedFile, event: FileEventType) => void,
	): () => void {
		const listeners = get()._fileListeners;
		listeners.push(callback);
		return () => {
			const idx = listeners.indexOf(callback);
			if (idx !== -1) listeners.splice(idx, 1);
		};
	},
	files: [] as ChunkedFile[],
	_fileListeners: [],
	_notifyFileListeners(file: ChunkedFile, event: FileEventType) {
		const listeners = get()._fileListeners;
		listeners.forEach(
			(cb: (file: ChunkedFile, event: FileEventType) => void) => {
				try {
					cb(file, event);
				} catch {
					// Optionally log error
				}
			},
		);
	},
}));
