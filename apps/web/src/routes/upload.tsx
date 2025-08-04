import { createFileRoute } from "@tanstack/react-router";
import { chunkFile } from "core";
import React from "react";
import { Button } from "../components/Button";
import { ProgressBar } from "../components/ProgressBar";
import { Section } from "../components/Section";
import { MyDropzone } from "../components/UploadZone";
import { useStorage } from "../hooks/storage";
import { useLog } from "../providers/log-provider";

export const Route = createFileRoute("/upload")({
	component: RouteComponent,
});

type UploadPhase = "waiting" | "reading" | "chunking" | "saving" | "completed";

function RouteComponent() {
	const logger = useLog();
	const [phase, setPhase] = React.useState<UploadPhase>("waiting");
	const [progress, setProgress] = React.useState({
		value: 0,
		total: 0,
	});

	const store = useStorage();

	const handleFileUpload = async (file: File) => {
		const chunkedFile = await chunkFile({
			file,
			chunkSize: 1024 * 1024, // 1MB chunks
			onProgress: (progressValue, total) => {
				setProgress({ value: progressValue, total });
			},
		});

		await store.file.local.saveFile(chunkedFile);
		await store.file.persistent.saveFile(chunkedFile);
		setPhase("completed");
		logger.info(`File ${file.name} uploaded successfully.`);
	};

	switch (phase) {
		case "waiting":
			return (
				<Section title="Upload File">
					<MyDropzone
						onDrop={async (files) => {
							if (files.length > 0) {
								setPhase("reading");
								setProgress({ value: 0, total: files[0].size });
								await handleFileUpload(files[0]);
							}
						}}
					/>
				</Section>
			);
		case "reading":
		case "chunking":
			return (
				<Section title="Processing File">
					<ProgressBar
						progress={progress.value}
						total={progress.total}
						color="blue"
						label={`Processing... ${Math.round(
							(progress.value / progress.total) * 100,
						)}%`}
					/>
				</Section>
			);
		case "completed":
			return (
				<Section title="Upload Completed">
					<p>File upload completed successfully!</p>
					<Button onClick={() => setPhase("waiting")}>
						Upload another file
					</Button>
				</Section>
			);
		default:
			return (
				<Section title="Upload Error">
					<p>Unknown upload phase: {phase}</p>
					<Button onClick={() => setPhase("waiting")}>Retry</Button>
				</Section>
			);
	}
}
