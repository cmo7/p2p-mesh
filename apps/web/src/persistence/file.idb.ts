import type {
	ChunkedFile,
	FileEventType,
	FileStorage,
	PaginatedResult,
	PaginationParams,
	Result,
	UUID,
} from "core";

export class FileIndexedDBStore implements FileStorage {
	private Database: IDBDatabase;
	private _fileListeners: Array<
		(fileId: UUID, event: "added" | "updated" | "deleted") => void
	> = [];

	constructor(database: IDBDatabase) {
		this.Database = database;
	}

	_notifyFileListeners(fileId: UUID, event: "added" | "updated" | "deleted") {
		this._fileListeners.forEach((listener) => listener(fileId, event));
	}

	getFile(fileId: UUID): Promise<Result<ChunkedFile>> {
		const transaction = this.Database.transaction("files", "readonly");
		const store = transaction.objectStore("files");
		return new Promise((resolve) => {
			const request = store.get(fileId);
			request.onsuccess = () => {
				const file = request.result;
				if (file) {
					resolve({ ok: true, value: file });
				} else {
					resolve({
						ok: false,
						error: { code: "not_found", message: "File not found" },
					});
				}
			};
			request.onerror = () => {
				resolve({
					ok: false,
					error: { code: "unknown", message: "Error retrieving file" },
				});
			};
		});
	}
	saveFile(file: ChunkedFile): Promise<Result<void>> {
		const transaction = this.Database.transaction("files", "readwrite");
		const store = transaction.objectStore("files");
		return new Promise((resolve) => {
			const request = store.put(file, file.id);
			request.onsuccess = () => {
				this._notifyFileListeners(file, "added");
				resolve({ ok: true, value: undefined });
			};
			request.onerror = () => {
				resolve({
					ok: false,
					error: { code: "unknown", message: "Error saving file" },
				});
			};
		});
	}
	deleteFile(fileId: UUID): Promise<Result<void>> {
		const transaction = this.Database.transaction("files", "readwrite");
		const store = transaction.objectStore("files");
		return new Promise((resolve) => {
			const request = store.delete(fileId);
			request.onsuccess = () => {
				this._notifyFileListeners({ id: fileId } as ChunkedFile, "deleted");
				resolve({ ok: true, value: undefined });
			};
			request.onerror = () => {
				resolve({
					ok: false,
					error: { code: "not_found", message: "File not found" },
				});
			};
		});
	}
	listFiles(
		params?: PaginationParams,
	): Promise<Result<PaginatedResult<ChunkedFile>>> {
		const transaction = this.Database.transaction("files", "readonly");
		const store = transaction.objectStore("files");
		return new Promise((resolve) => {
			const request = store.getAll();
			request.onsuccess = () => {
				const files = request.result;
				const total = files.length;
				const offset = params?.offset || 0;
				const limit = params?.limit || total;

				const paginatedFiles = files.slice(offset, offset + limit);
				resolve({
					ok: true,
					value: {
						items: paginatedFiles,
						total,
						offset,
						limit,
					},
				});
			};
			request.onerror = () => {
				resolve({
					ok: false,
					error: { code: "unknown", message: "Error listing files" },
				});
			};
		});
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
