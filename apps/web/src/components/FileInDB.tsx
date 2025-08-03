
import { Link } from "@tanstack/react-router";
import { ProgressBar } from "../components/ProgressBar";

type FileDBProps = {
	status: FileStatus;
	filename: string;
	hash: string;
	progress: number;
	total: number;
	onOpen: () => void;
	onRemove: () => void;
};

export type FileStatus = "waiting" | "opening" | "removing";

export function FileInDB(props: FileDBProps & {
	onOpen: () => void;
	onRemove: () => void;
}) {
	const encodedHash = encodeURIComponent(props.hash);
	switch (props.status) {
		case "waiting":
			return (
				<div>
					<span>{props.filename}</span>
					<button onClick={props.onOpen}>Open</button>
					<button onClick={props.onRemove}>Remove</button>
					<Link to={`/details/${encodedHash}`}>
						Details
					</Link>
				</div>
			);
		case "opening":
			return (
				<div>
					<span>Opening {props.filename}...</span>
					<ProgressBar progress={props.progress} total={props.total} color="blue" label="Opening..." />
				</div>
			);
		case "removing":
			return (
				<div>
					<span>{props.filename}</span>
					<ProgressBar progress={props.progress} total={props.total} color="red" label="Removing..." />
					<button onClick={props.onOpen}>Open</button>
					<button onClick={props.onRemove}>Remove</button>
				</div>
			);
	}
}
