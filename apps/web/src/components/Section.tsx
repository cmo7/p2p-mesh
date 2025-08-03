import type React from "react";

export function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section
			style={{
				border: "1px solid #ccc",
				padding: "10px",
				borderRadius: "5px",
				backgroundColor: "#f9f9f9",
				fontFamily: "Arial, sans-serif",
			}}
		>
			<h2>{title}</h2>
			<div>{children}</div>
		</section>
	);
}
