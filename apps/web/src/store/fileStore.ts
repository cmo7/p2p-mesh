import { create } from "zustand";
import { type FileDBEntry, getFiles, removeFile } from "../lib/storage";
import type { FileStatus } from "../components/FileInDB";

export type FileWithProgress = {
	status: FileStatus
	file: FileDBEntry;
	progress: number;
};

interface FileStore {
	files: FileWithProgress[];
	loadFiles: () => Promise<void>;
	getFileByHash: (hash: string) => FileWithProgress | undefined;
	removeFileByHash: (hash: string) => Promise<void>;
	updateProgress: (hash: string, progress: number) => void;
	updateStatus: (hash: string, status: FileStatus) => void;
	addFile: (entry: FileDBEntry) => void;
}

export const useFileStore = create<FileStore>((set, _get) => ({
	files: [],
	loadFiles: async () => {
		const files = await getFiles();
		set({ files: files.map((file) => ({ file, progress: 0, status: "waiting" })) });
	},
	getFileByHash: (hash) => {
		return _get().files.find((f) => f.file.hash === hash);
	},
	removeFileByHash: async (hash) => {
		await removeFile(hash);
		set((state) => ({
			files: state.files.filter((f) => f.file.hash !== hash),
		}));
	},
	updateProgress: (hash, progress) => {
		set((state) => ({
			files: state.files.map((f) =>
				f.file.hash === hash ? { ...f, progress } : f,
			),
		}));
	},
	updateStatus: (hash, status) => {
		set((state) => ({
			files: state.files.map((f) =>
				f.file.hash === hash ? { ...f, status } : f,
			),
		}));
	},
	addFile: (entry) => {
		set((state) => ({ files: [...state.files, { file: entry, progress: 0, status: "waiting" }] }));
	},
}));
