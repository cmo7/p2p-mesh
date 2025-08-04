import { Box, Heading } from "@chakra-ui/react";
import type React from "react";

export function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<Box as={"section"} padding="20px" borderRadius="8px" boxShadow="md">
			<Heading>{title}</Heading>
			<div>{children}</div>
		</Box>
	);
}
