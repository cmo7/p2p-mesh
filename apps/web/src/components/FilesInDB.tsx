import { mergeChunks } from "core";
import React from "react";
import { type FileDBEntry, getHydratedFile } from "../lib/storage";
import { useFileStore } from "../store/fileStore";
import { FileInDB } from "./FileInDB";

export function FilesInDB() {
	const files = useFileStore((state) => state.files);
	const loadFiles = useFileStore((state) => state.loadFiles);
	const removeFileByHash = useFileStore((state) => state.removeFileByHash);
	const updateProgress = useFileStore((state) => state.updateProgress);
	const updateStatus = useFileStore((state) => state.updateStatus);

	React.useEffect(() => {
		loadFiles();
	}, [loadFiles]);

	const handleOpen = async (entry: { file: FileDBEntry; progress: number }) => {
		console.log("Opening file:", entry.file.filename);
		updateStatus(entry.file.hash, "opening");
		const hFile = await getHydratedFile(entry.file.hash, {
			onDbRetrievalProgress: (p: number, t: number) => {
				updateProgress(entry.file.hash, (p / t) * 100);
			},
		});
		if (!hFile) {
			console.error("File not found in IndexedDB:", entry.file.hash);
			return;
		}
		const rawData = await mergeChunks(hFile);
		if (!rawData) {
			console.error("Failed to merge file chunks for:", entry.file.filename);
			return;
		}
		try {
			const blob = new Blob([rawData], {
				type: "application/octet-stream",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = entry.file.filename || "downloaded_file";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			updateStatus(entry.file.hash, "waiting");
		} catch (err) {
			console.error("Error creating Blob or downloading file:", err);
		}
	};

	const handleRemove = async (entry: {
		file: FileDBEntry;
		progress: number;
	}) => {
		console.log("Removing file:", entry.file.filename);
		updateStatus(entry.file.hash, "removing");
		await removeFileByHash(entry.file.hash);
		updateStatus(entry.file.hash, "waiting");
	};

	return (
		<div>
			<h3>Files in DB</h3>
			<ul>
				{files.map((entry) => (
					<FileInDB
						key={entry.file.hash}
						filename={entry.file.filename}
						hash={entry.file.hash}
						progress={entry.progress}
						total={100} // Assuming total is always 100 for progress bar
						status={entry.status}
						onOpen={() => handleOpen(entry)}
						onRemove={() => handleRemove(entry)}
					/>
				))}
			</ul>
		</div>
	);
}
