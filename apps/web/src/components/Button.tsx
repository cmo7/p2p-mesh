import {
	Button as ChakraButton,
	type ButtonProps as ChakraButtonProps,
} from "@chakra-ui/react";
import { Link, type LinkProps } from "@tanstack/react-router";

export type ButtonProps = LinkProps & ChakraButtonProps;

export function Button(props: ButtonProps) {
	if (props.to) {
		return (
			<ChakraButton asChild {...props}>
				<Link to={props.to} activeProps={{ color: "blue.500" }}>
					{props.children}
				</Link>
			</ChakraButton>
		);
	}
	return <ChakraButton {...props}>{props.children}</ChakraButton>;
}
