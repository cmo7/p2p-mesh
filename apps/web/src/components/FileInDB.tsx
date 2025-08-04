import { Box, Flex, Grid, GridItem, Heading, Text } from "@chakra-ui/react";
import { type ChunkedFile, hydrateFile, mergeFile } from "core";
import { useStorage } from "@/hooks/storage";
import { Button } from "./Button";

export function FileBadge({ file }: { file: ChunkedFile }) {
	const storage = useStorage();
	return (
		<Box
			border="1px solid #ccc"
			padding="10px"
			borderRadius="5px"
			display={"flex"}
			flexDirection="column"
			alignItems="start"
			justifyContent={"start"}
			backgroundColor="white"
			boxShadow="md"
			margin="10px auto"
			transition="box-shadow 0.2s"
			_hover={{ boxShadow: "lg" }}
		>
			<Heading>{file.filename}</Heading>
			<Text fontFamily="monospace">ID: {file.id}</Text>
			<Text>Size: {Math.round(file.size / 1024)} KB</Text>
			<Text>Status: {file.status}</Text>
			<Text>Progress: {(file.size / file.progress) * 100}%</Text>
			{file.status === "hydrated" && (
				<div>
					<h5>Chunks:</h5>
					<FileChunks file={file} />
				</div>
			)}
			{file.metadata && (
				<div>
					<h5>Metadata:</h5>
					<pre>{JSON.stringify(file.metadata, null, 2)}</pre>
				</div>
			)}
			<Flex
				justifyContent="start"
				alignItems="center"
				marginTop="10px"
				gap="10px"
			>
				<Button
					onClick={async () => {
						const result = await storage.file.persistent.getFile(file.id);
						if (result.ok) {
							console.log(`File ${file.id} downloaded successfully.`);
							const v = result.value;
							const h = await hydrateFile({
								chunkedFile: v,
								onProgress: (processedBytes, totalBytes) => {
									console.log(
										`Hydrating file ${file.id}: ${processedBytes}/${totalBytes} bytes processed.`,
									);
								},
								store: storage.chunk.persistent,
							});
							const b = mergeFile({
								chunkedFile: h,
								onProgress: (progress, total) => {
									console.log(
										`Merging file ${file.id}: ${progress}/${total} bytes merged.`,
									);
								},
							});
							DownloadFile(b);
						} else {
							console.error(
								`Failed to download file ${file.id}:`,
								result.error,
							);
						}
					}}
				>
					Download
				</Button>
				<Button
					onClick={() => console.log(`Deleting file ${file.id}`)}
					colorScheme={"red"}
				>
					Delete
				</Button>
				<Button
					onClick={() => console.log(`Showing details for file ${file.id}`)}
				>
					Details
				</Button>
			</Flex>
		</Box>
	);
}

function FileChunks({ file }: { file: ChunkedFile }) {
	return (
		<Grid
			templateColumns="repeat(auto-fill, minmax(50px, 1fr))"
			gap={4}
			width="100%"
			marginTop="10px"
			marginBottom="10px"
		>
			{file.chunks.map((chunk) => (
				<GridItem key={chunk.id}>
					<Box
						border="1px solid #ccc"
						padding="10px"
						borderRadius="5px"
						display={"flex"}
						flexDirection="column"
						alignItems="center"
						justifyContent={"center"}
						aspectRatio={"1 / 1"}
					>
						<p>{chunk.index}</p>
					</Box>
				</GridItem>
			))}
		</Grid>
	);
}

function DownloadFile(file: File) {
	const url = URL.createObjectURL(file);
	const a = document.createElement("a");
	a.href = url;
	a.download = file.name;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
