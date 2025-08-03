import { createFileRoute } from "@tanstack/react-router";
import { chunkFile } from "core";
import React from "react";
import { ProgressBar } from "../components/ProgressBar";
import { Section } from "../components/Section";
import { MyDropzone } from "../components/UploadZone";
import { saveChunkedFileToIndexedDB } from "../lib/storage";
import { useLog } from "../providers/log-provider";

export const Route = createFileRoute("/upload")({
	component: RouteComponent,
});

type UploadPhase = "waiting" | "reading" | "chunking" | "completed";

function RouteComponent() {
	const logger = useLog();
	const [phase, setPhase] = React.useState<UploadPhase>("waiting");
	const [progress, setProgress] = React.useState({
		value: 0,
		total: 0,
	});
  switch (phase) {
    case "waiting":
      return (
        <Section title="Upload File">
          <MyDropzone
            onDrop={async (files) => {
              setPhase("reading");
              setProgress({ value: 0, total: files.length });
              for (const file of files) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                  if (event.target?.result) {
                    setPhase("chunking");
                    const fileContent = event.target.result as ArrayBuffer;
                    const chunkedFile = await chunkFile({
                      filename: file.name,
                      file: fileContent,
                      chunkSize: 1024 * 1024, // 1 MB chunks
                      onProgress: (value, total) => {
                        setProgress({ value, total });
                      }
                    });
                    await saveChunkedFileToIndexedDB(chunkedFile, {
                      onProgress: (value, total) => {
                        setProgress({ value, total });
                      },
                    });
                    setPhase("completed");
                    logger.log(`File ${file.name} uploaded successfully.`);
                  } else {
                    logger.error(`Failed to read file ${file.name}.`);
                  }
                };
                reader.onerror = () => {
                  logger.error(`Error reading file ${file.name}.`);
                };
                reader.readAsArrayBuffer(file);
              }
            }}
            
          />
        </Section>
      );
    case "reading":
    case "chunking":
      return (
        <MultiPhaseProgressBar phase={phase} progress={progress} />
      );
    case "completed":
      return (
        <Section title="Upload Completed">
          <p>File upload completed successfully!</p>
          <button onClick={() => setPhase("waiting")}>Upload another file</button>
        </Section>
      );
    default:
      return (
        <Section title="Upload Error">
          <p>Unknown upload phase: {phase}</p>
          <button onClick={() => setPhase("waiting")}>Retry</button>
        </Section>
      );
    }
}

function MultiPhaseProgressBar({
	phase,
	progress,
}: {
	phase: UploadPhase;
	progress: { value: number; total: number };
}) {
	const phaseLabels: Record<UploadPhase, string> = {
		waiting: "Waiting for file upload",
		reading: "Reading file",
		chunking: "Chunking file",
		completed: "Upload completed",
	};

	const phaseColor: Record<UploadPhase, string> = {
		waiting: "gray",
		reading: "blue",
		chunking: "orange",
		completed: "green",
	};

	return (
		<Section title="Upload Progress">
			<ProgressBar
				label={phaseLabels[phase]}
				progress={progress.value}
				total={progress.total}
				color={phaseColor[phase]}
			/>
		</Section>
	);
}
