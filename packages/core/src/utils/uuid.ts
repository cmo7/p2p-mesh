import type { UUID } from "../types";

export function isUUID(value: unknown): value is UUID {
	if (typeof value !== "string") {
		return false;
	}

	// Regular expression to match UUID format

	return true;
}
