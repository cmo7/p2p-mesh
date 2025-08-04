import type { IsoTimestamp, Timestamps } from "../types";

export function newTimestamp(): IsoTimestamp {
	return new Date().toISOString() as IsoTimestamp;
}

export function updateTimestamps(timestamps: Timestamps): Timestamps {
	const now = newTimestamp();
	return {
		...timestamps,
		updatedAt: now,
	};
}

export function createTimestamps(): Timestamps {
	return {
		createdAt: newTimestamp(),
		updatedAt: newTimestamp(),
	};
}

export function asDate(isoTimestamp: IsoTimestamp): Date {
	const date = new Date(isoTimestamp);
	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid ISO timestamp: ${isoTimestamp}`);
	}
	return date;
}
