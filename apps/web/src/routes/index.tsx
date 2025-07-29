import { createFileRoute } from "@tanstack/react-router";
import { MyDropzone } from "../components/UploadZone";
import { chunkFile, ChunkedFile, type Chunk } from "core";
import React from "react";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

async function getEstimatedUsage(): Promise<{ usage: string; quota: string }> {
  const estimate = await navigator.storage.estimate();
  const usage = estimate.usage;
  const quota = estimate.quota;
  return {
    usage: (usage ?? 0 / (1024 * 1024)).toFixed(2) + " MB",
    quota: (quota ?? 0 / (1024 * 1024)).toFixed(2) + " MB",
  };
}

function getChunkFromIndexedDB(index: number): Promise<Chunk | undefined> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("chunksDB", 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("chunks")) {
        db.createObjectStore("chunks", { keyPath: "index" });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction("chunks", "readonly");
      const store = transaction.objectStore("chunks");
      const getRequest = store.get(index);
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };

    request.onerror = () => reject(request.error);
  });
}

function saveChunkToIndexedDB(chunk: Chunk): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("chunksDB", 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("chunks")) {
        db.createObjectStore("chunks", { keyPath: "index" });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction("chunks", "readwrite");
      const store = transaction.objectStore("chunks");
      store.put(chunk);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };

    request.onerror = () => reject(request.error);
  });
}

function saveChunkedFileToIndexedDB(chunkedFile: ChunkedFile): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("chunkedFilesDB", 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("chunkedFiles")) {
        db.createObjectStore("chunkedFiles", { keyPath: "fileName" });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction("chunkedFiles", "readwrite");
      const store = transaction.objectStore("chunkedFiles");
      store.put(chunkedFile);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      for (const chunk of chunkedFile.chunks) {
        saveChunkToIndexedDB(chunk).catch((error) => {
          console.error("Error saving chunk to IndexedDB:", error);
        });
      }
    };

    request.onerror = () => reject(request.error);
  });
}

function RouteComponent() {
	const [logs, setLogs] = React.useState<string[]>([]);
  const [chunkedFiles, setChunkedFiles] = React.useState<ChunkedFile[]>([]);
	return (
		<div>
			Hello "/"!
      <div>
        Estimated Usage:{" "}
        {getEstimatedUsage().then((estimate) => (
          <span>{estimate.usage} / {estimate.quota}</span>
        ))}
      </div>
			<MyDropzone
				onDrop={async (acceptedFiles) => {
					console.log("Files dropped:", acceptedFiles);
					for (const file of acceptedFiles) {
						console.log("Chunking file:", file.name);
            setLogs((prev) => [...prev, `Chunking file: ${file.name}`]);
						const buffer = await file.arrayBuffer();
						const fileChunks = await chunkFile(buffer, {
              chunkSize: 2 * 1024,
            }); // Chunk size
						console.log(
							`File ${file.name} has been chunked into ${fileChunks.chunks.length} parts.`,
						);
            setLogs((prev) => [
              ...prev,
              `File ${file.name} has been chunked into ${fileChunks.chunks.length} parts.`,
            ]);
            setChunkedFiles((prev) => [...prev, fileChunks]);
            // Save each chunk to IndexedDB
            await saveChunkedFileToIndexedDB(fileChunks);
					}
				}}
			/>
      <ChunkContainer chunks={chunkedFiles.flatMap((f) => f.chunks)} />
      <Logs logs={logs} />
		</div>
	);
}

type LoggerProps = {
	message: string;
};

function Logger({ message }: LoggerProps) {
	return <div>{message}</div>;
}

type LogsProps = {
	logs: string[];
};

function Logs({ logs }: LogsProps) {
	return (
		<div>
			{logs.map((log, index) => (
				<Logger key={index} message={log} />
			))}
		</div>
	);
}


type ChunkContainerProps = {  chunks: Chunk[];
};

function ChunkContainer({ chunks }: ChunkContainerProps) {
  return (
    <div>
      <h3>Chunks</h3>
      <ul>
        {chunks.map((chunk) => (
          <li key={chunk.index}>
            <div>
              index: {chunk.index}
            </div>
            <div>
              total: {chunk.total}
            </div>
            <div>
              data: {chunk.data ? chunk.data.byteLength : "No data"}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}