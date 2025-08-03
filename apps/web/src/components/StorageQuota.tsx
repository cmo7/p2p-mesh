import React from "react";
import { getEstimatedUsage } from "../routes";
import { ProgressBar } from "./ProgressBar";

export function StorageQuota() {
	const [usage, setUsage] = React.useState<number>(0);
	const [quota, setQuota] = React.useState<number>(0);

	React.useEffect(() => {
		getEstimatedUsage().then((estimate) => {
			const usageValue = parseFloat(estimate.usage);
			const quotaValue = parseFloat(estimate.quota);
			setUsage(Number.isNaN(usageValue) ? 0 : usageValue);
			setQuota(Number.isNaN(quotaValue) ? 0 : quotaValue);
		});
	}, []);

	return (
		<div>
			Estimated Usage:{" "}
			<ProgressBar
				color="#2196f3"
				progress={usage}
				total={quota > 0 ? quota : 1}
			/>
			<br />
			<span>
				{usage.toFixed(2)} MB / {quota.toFixed(2)} MB
			</span>
		</div>
	);
}
