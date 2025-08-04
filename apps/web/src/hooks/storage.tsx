import { useChunkStore as usePersistentChunkContext } from "../persistence/indexedb/providers/ChunkStoreContextProvider";
import { useFileStore as usePersistentFileContext } from "../persistence/indexedb/providers/FileStoreContextProvider";
import { useChunkStore } from "../store/chunkStore";
import { useFileStore } from "../store/fileStore";

export function useStorage() {
	const chunk = {
		persistent: usePersistentChunkContext(),
		local: useChunkStore(),
	};

	const file = {
		persistent: usePersistentFileContext(),
		local: useFileStore(),
	};

	return {
		chunk,
		file,
	};
}
