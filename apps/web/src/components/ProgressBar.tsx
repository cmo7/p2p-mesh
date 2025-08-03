import type React from "react";

export function ProgressBar(props: {
	color: string;
	progress: number;
	total: number;
	label?: string | undefined;
}) {
	return (
		<div style={{ width: "100%", backgroundColor: "#f3f3f3" }}>
			<div
				style={{
					width: `${(props.progress / props.total) * 100}%`,
					height: "20px",
					backgroundColor: props.color,
				}}
			/>
		</div>
	);
}
