import type {
	ChunkedFile,
	FileEventType,
	FileStorage,
	PaginatedResult,
	PaginationParams,
	Result,
	UUID,
} from "core";
import { IndexedDBWrapper } from "../util/indexedDB";

export class FileIndexedDBStore implements FileStorage {
	private static instance: FileIndexedDBStore | null = null;
	private Database: IndexedDBWrapper;
	private _fileListeners: Array<
		(fileId: UUID, event: "added" | "updated" | "deleted") => void
	> = [];

	private constructor(database: IndexedDBWrapper) {
		this.Database = database;
	}

	static getInstance(): FileIndexedDBStore {
		if (!FileIndexedDBStore.instance) {
			const db = IndexedDBWrapper.getInstance();
			FileIndexedDBStore.instance = new FileIndexedDBStore(db);
		}
		return FileIndexedDBStore.instance;
	}

	_notifyFileListeners(fileId: UUID, event: "added" | "updated" | "deleted") {
		this._fileListeners.forEach((listener) => listener(fileId, event));
	}

	async getFile(fileId: UUID): Promise<Result<ChunkedFile>> {
		const file = await this.Database.get<ChunkedFile>("files", fileId);
		return file
			? { ok: true, value: file }
			: {
					ok: false,
					error: { code: "not_found", message: "File not found" },
				};
	}

	async saveFile(file: ChunkedFile): Promise<Result<void>> {
		await this.Database.set<ChunkedFile>("files", file, file.id);
		this._notifyFileListeners(file, "added");
		return { ok: true, value: undefined };
	}

	async deleteFile(fileId: UUID): Promise<Result<void>> {
		await this.Database.delete("files", fileId);
		this._notifyFileListeners({ id: fileId } as ChunkedFile, "deleted");
		return { ok: true, value: undefined };
	}

	async listFiles(
		params?: PaginationParams,
	): Promise<Result<PaginatedResult<ChunkedFile>>> {
		const files = await this.Database.getAll<ChunkedFile>("files");
		const total = files.length;
		const offset = params?.offset || 0;
		const limit = params?.limit || total;

		const paginatedFiles = files.slice(offset, offset + limit);
		return {
			ok: true,
			value: {
				items: paginatedFiles,
				total,
				offset,
				limit,
			},
		};
	}

	onFileChanged(
		callback: (file: ChunkedFile, event: FileEventType) => void,
	): () => void {
		this._fileListeners.push(callback);
		return () => {
			this._fileListeners = this._fileListeners.filter((cb) => cb !== callback);
		};
	}
}
