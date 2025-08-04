import type { IsoTimestamp, Metadata, UUID } from "./common";

export type PeerStatus = "online" | "offline";

export type PeerInfo = {
	peerId: UUID;
	status: PeerStatus;
	lastSeen: IsoTimestamp;
	publicKey?: CryptoKey;
	metadata?: Metadata;
};
