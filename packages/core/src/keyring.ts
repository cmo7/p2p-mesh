import { UUID } from "crypto";
import type { Keyring, KeyringEntry } from "./types";

export function newKeyring(): Keyring {
    const keyring: Keyring = {
        keys: new Map<UUID, KeyringEntry>(),
        get: (id: UUID) => {
            return keyring.keys.get(id);
        },
        add: (id: UUID, key: CryptoKey) => {
            if (keyring.keys.has(id)) {
                console.warn(`Key with id ${id} already exists in the keyring.`);
            }
            keyring.keys.set(id, { id, key } as KeyringEntry);
        },
        remove: (id: UUID) => {
            keyring.keys.delete(id);
        },

    };
    return keyring;

}