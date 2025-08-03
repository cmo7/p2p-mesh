import { createFileRoute } from "@tanstack/react-router";
import { type Chunk, type ChunkedFile, chunkFile, mergeChunks } from "core";
import React from "react";
import { MyDropzone } from "../components/UploadZone";
import {
	type FileDBEntry,
	getFiles,
	getHydratedFile,
	removeFile,
	saveChunkedFileToIndexedDB,
} from "../lib/storage";
import { useLog } from "../providers/log-provider";

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

function RouteComponent() {
	const [logs, setLogs] = React.useState<string[]>([]);
	const [chunkedFiles, setChunkedFiles] = React.useState<ChunkedFile[]>([]);
	const logger = useLog();
	const [usage, setUsage] = React.useState<string>("...");
	const [quota, setQuota] = React.useState<string>("...");

	React.useEffect(() => {
		getEstimatedUsage().then((estimate) => {
			setUsage(estimate.usage);
			setQuota(estimate.quota);
		});
	}, []);

	return (
		<div>
			Hello "/"!
			<div>
				Estimated Usage:{" "}
				<span>
					{usage} / {quota}
				</span>
			</div>
			<div
				style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}
			>
				<FilesInDB />

				<MyDropzone
					onDrop={async (acceptedFiles) => {
						logger.log("Files dropped:", acceptedFiles);
						for (const file of acceptedFiles) {
							logger.log("Chunking file:", file.name);
							setLogs((prev) => [...prev, `Chunking file: ${file.name}`]);
							const buffer = await file.arrayBuffer();
							const fileChunks = await chunkFile(file.name, buffer, {
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
							logger.log(
								`File ${file.name} has been saved to IndexedDB with hash: ${fileChunks.hash}`,
							);
							setLogs((prev) => [
								...prev,
								`File ${file.name} has been saved to IndexedDB with hash: ${fileChunks.hash}`,
							]);
						}
					}}
				/>
				<ChunkContainer chunks={chunkedFiles.flatMap((f) => f.chunks)} />
				<Logs logs={logs} />
			</div>
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
			{logs.map((log) => (
				<Logger key={log} message={log} />
			))}
		</div>
	);
}

type ChunkContainerProps = { chunks: Chunk[] };

function ChunkContainer({ chunks }: ChunkContainerProps) {
	return (
		<div>
			<h3>Chunks</h3>
			<ul>
				{chunks.map((chunk) => (
					<li key={chunk.index}>
						<div>index: {chunk.index}</div>
						<div>total: {chunk.total}</div>
						<div>data: {chunk.data ? chunk.data.byteLength : "No data"}</div>
					</li>
				))}
			</ul>
		</div>
	);
}

function FilesInDB() {
	const [files, setFiles] = React.useState<FileDBEntry[]>([]);

	React.useEffect(() => {
		getFiles().then((files) => {
			setFiles(files);
		});
	}, []);

	return (
		<div>
			<h3>Files in DB</h3>
			<ul>
				{files.map((file) => (
					<li key={file.hash}>
						<div>Filename: {file.filename}</div>
						<div>Hash: {file.hash}</div>
						<button
							type="button"
							onClick={async () => {
								// Implement file opening logic here
								// Hydrate the file data if needed
								console.log("Opening file:", file.filename);
								// You can implement logic to read the file data from IndexedDB
								const hFile = await getHydratedFile(file.hash);
								if (!hFile) {
									console.error("File not found in IndexedDB:", file.hash);
									return;
								}
								const rawData = await mergeChunks(hFile);
								if (!rawData) {
									console.error(
										"Failed to merge file chunks for:",
										file.filename,
									);
									return;
								}
								try {
									const blob = new Blob([rawData], {
										type: "application/octet-stream",
									});
									const url = URL.createObjectURL(blob);
									const a = document.createElement("a");
									a.href = url;
									a.download = file.filename || "downloaded_file";
									document.body.appendChild(a);
									a.click();
									document.body.removeChild(a);
									URL.revokeObjectURL(url); // Clean up
								} catch (err) {
									console.error(
										"Error creating Blob or downloading file:",
										err,
									);
								}
							}}
						>
							Open
						</button>
						<button
							type="button"
							onClick={async () => {
								console.log("Removing file:", file.filename);
								// Implement file removal logic here
								await removeFile(file.hash);
								setFiles((prev) => prev.filter((f) => f.hash !== file.hash));
							}}
						>
							Remove
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}
