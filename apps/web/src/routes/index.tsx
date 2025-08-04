import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../components/Section";
import { StorageQuota } from "../components/StorageQuota";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

export async function getEstimatedUsage(): Promise<{
	usage: string;
	quota: string;
}> {
	const estimate = await navigator.storage.estimate();
	const usage = estimate.usage;
	const quota = estimate.quota;
	return {
		usage: (usage ?? 0 / (1024 * 1024)).toFixed(2) + " MB",
		quota: (quota ?? 0 / (1024 * 1024)).toFixed(2) + " MB",
	};
}

function RouteComponent() {
	return (
		<div>
			<div
				style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}
			>
				<Section title="Storage Quota">
					<StorageQuota />
				</Section>
			</div>
		</div>
	);
}
