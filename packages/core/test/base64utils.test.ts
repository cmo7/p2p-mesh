import { describe, expect, it } from "vitest";
import { arrayBufferToBase64, base64ToArrayBuffer } from "../src/base64utils";
import { emptyBuffer, getExampleBuffer, getLargeTextBuffer, getRandomBuffer } from "./testdata";


describe("base64utils", () => {
    it("should encode and decode a simple buffer", () => {
        const buf = getExampleBuffer(32);
        const b64 = arrayBufferToBase64(buf);
        const decoded = base64ToArrayBuffer(b64);
        expect(new Uint8Array(decoded)).toEqual(new Uint8Array(buf));
    });

    it("should encode and decode a random buffer", () => {
        const buf = getRandomBuffer(128);
        const b64 = arrayBufferToBase64(buf);
        const decoded = base64ToArrayBuffer(b64);
        expect(new Uint8Array(decoded)).toEqual(new Uint8Array(buf));
    });

    it("should encode and decode an empty buffer", () => {
        const b64 = arrayBufferToBase64(emptyBuffer);
        const decoded = base64ToArrayBuffer(b64);
        expect(new Uint8Array(decoded)).toEqual(new Uint8Array(emptyBuffer));
    });

    it("should encode and decode a large text buffer", () => {
        const buf = getLargeTextBuffer();
        const b64 = arrayBufferToBase64(buf);
        const decoded = base64ToArrayBuffer(b64);
        expect(new Uint8Array(decoded)).toEqual(new Uint8Array(buf));
    });

    it("should throw for invalid base64 input", () => {
        expect(() => base64ToArrayBuffer("!@#$%^&*()"))
            .toThrow();
    });
});
