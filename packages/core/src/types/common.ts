export type { UUID } from "node:crypto";

export type IsoTimestamp =
	`${number}-${number}-${number}T${number}:${number}:${number}.${number}Z`;

export type Timestamps = {
	createdAt: IsoTimestamp;
	updatedAt: IsoTimestamp;
};
export type MetadataKey = string;
export type Metadata = Record<MetadataKey, unknown>;
export type Checksum = string;
export type Base64String = string;

export type Version = `${number}.${number}.${number}`;
