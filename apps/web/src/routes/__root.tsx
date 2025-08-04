import { Box, ButtonGroup, type ButtonProps } from "@chakra-ui/react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Button } from "@/components/Button";
import { useColorMode } from "@/components/ui/color-mode";

export const Route = createRootRoute({
	component: RootComponent,
});

const menuButtonProps: ButtonProps = {
	variant: "outline",
	colorScheme: "blue",
	size: "md",
};

function RootComponent() {
	const { toggleColorMode } = useColorMode();
	return (
		<Box
			display="flex"
			flexDirection="column"
			minHeight="100vh"
			backgroundColor="background"
			color="text"
			fontFamily="body"
			fontSize="md"
			lineHeight="tall"
			overflowY="auto"
			width="100%"
			maxWidth="100vw"
			padding={4}
			boxSizing="border-box"
		>
			<Box padding={4}>
				<ButtonGroup>
					<Button to="/" {...menuButtonProps}>
						Home
					</Button>
					<Button to="/files" {...menuButtonProps}>
						Files
					</Button>
					<Button to="/upload" {...menuButtonProps}>
						Upload
					</Button>
					<Button onClick={toggleColorMode} {...menuButtonProps}>
						Toggle Color Mode
					</Button>
				</ButtonGroup>
			</Box>
			<Outlet />
		</Box>
	);
}
