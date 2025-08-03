import { expect, test } from "vitest";
import {
	chunkFile,
	newKeyring,
	signChunk,
	type UnsignedChunk,
	verifyChunk,
} from "../src";
import { verifyChunkUsingKeyring } from "../src/signing";
import type { Keyring, SignedChunk } from "../src/types";

test("signed chunks are verifiable", async () => {
	const data = new ArrayBuffer(2048);
	const { chunks } = await chunkFile({
		filename: "test file",
		file: data,
		chunkSize: 512,
	});
	const keyPair = await crypto.subtle.generateKey(
		{ name: "ECDSA", namedCurve: "P-256" },
		true,
		["sign", "verify"],
	);
	const signerId = crypto.randomUUID();

	for (const chunk of chunks) {
		const signed = await signChunk(
			chunk as UnsignedChunk,
			signerId,
			keyPair.privateKey,
		);
		expect(signed.signed).toBe(true);
		const valid = await verifyChunk(signed, keyPair.publicKey);
		expect(valid).toBe(true);
	}
});
test("verifyChunkUsingKeyring returns true for valid chunk and keyring", async () => {
	const data = new ArrayBuffer(1024);
	const { chunks } = await import("../src").then((m) =>
		m.chunkFile({ filename: "test file", file: data, chunkSize: 512 }),
	);
	const keyPair = await crypto.subtle.generateKey(
		{ name: "ECDSA", namedCurve: "P-256" },
		true,
		["sign", "verify"],
	);
	const signerId = crypto.randomUUID();

	const signed = await import("../src").then((m) =>
		m.signChunk(chunks[0] as UnsignedChunk, signerId, keyPair.privateKey),
	);

	const keyring: Keyring = newKeyring();
	keyring.add(signerId, keyPair.publicKey);

	const result = await verifyChunkUsingKeyring(signed, keyring);
	expect(result).toBe(true);
});

test("verifyChunkUsingKeyring throws if key not found in keyring", async () => {
	const data = new ArrayBuffer(1024);
	const { chunks } = await import("../src").then((m) =>
		m.chunkFile({ filename: "test file", file: data, chunkSize: 512 }),
	);
	const keyPair = await crypto.subtle.generateKey(
		{ name: "ECDSA", namedCurve: "P-256" },
		true,
		["sign", "verify"],
	);
	const signerId = crypto.randomUUID();

	const signed = await import("../src").then((m) =>
		m.signChunk(chunks[0] as UnsignedChunk, signerId, keyPair.privateKey),
	);

	const keyring: Keyring = newKeyring(); // empty keyring

	await expect(verifyChunkUsingKeyring(signed, keyring)).rejects.toThrow(
		"Key not found in keyring",
	);
});
