import { Box, Flex } from "@chakra-ui/react";
import type { ChunkedFile } from "core";
import React from "react";
import { useStorage } from "../hooks/storage";
import { FileBadge } from "./FileInDB";

export function FilesInDB() {
	const store = useStorage();

	const [files, setFiles] = React.useState<
		(ChunkedFile & { source: "local" | "persistent" })[]
	>([]);
	React.useEffect(() => {
		const fetchFiles = async () => {
			const localFiles = await store.file.local.listFiles();
			const persistentFiles = await store.file.persistent.listFiles();
			const allFiles = [];
			if (localFiles.ok) {
				for (const file of localFiles.value.items) {
					allFiles.push({ ...file, source: "local" } as ChunkedFile & {
						source: "local";
					});
				}
			}
			if (persistentFiles.ok) {
				for (const file of persistentFiles.value.items) {
					if (!allFiles.some((f) => f.id === file.id)) {
						allFiles.push({ ...file, source: "persistent" } as ChunkedFile & {
							source: "persistent";
						});
					}
				}
			}
			setFiles(allFiles);
		};

		fetchFiles();
	}, [store]);

	return (
		<Flex direction="column" gap="10px" padding="20px">
			{files.map((file) => (
				<Box key={file.id}>
					<FileBadge file={file} />
				</Box>
			))}
		</Flex>
	);
}
