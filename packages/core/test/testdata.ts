import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Devuelve el ArrayBuffer de la imagen de test ubicada en test/data/24011087867_640a7a55ed_b.jpg
 */
export function getTestImageBuffer(): ArrayBuffer {
	const imgPath = join(__dirname, "data", "24011087867_640a7a55ed_b.jpg");
	const buffer = readFileSync(imgPath);
	// Node.js Buffer -> ArrayBuffer
	return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}
/**
 * Utilidades y datos de prueba para los tests del módulo core
 */

/** Buffer de ejemplo de 1024 bytes, relleno con valores secuenciales */
export function getExampleBuffer(size: number = 1024): ArrayBuffer {
	const arr = new Uint8Array(size);
	for (let i = 0; i < size; i++) arr[i] = i % 256;
	return arr.buffer;
}

/** Buffer de ejemplo de 2048 bytes, relleno con valores aleatorios */
export function getRandomBuffer(size: number = 2048): ArrayBuffer {
	const arr = new Uint8Array(size);
	for (let i = 0; i < size; i++) arr[i] = Math.floor(Math.random() * 256);
	return arr.buffer;
}

/** Buffer vacío */
export const emptyBuffer = new ArrayBuffer(0);

/** Buffer con grandes cantidades de texto */
export function getLargeTextBuffer(): ArrayBuffer {
	const file = join(__dirname, "data", "don_quijote.txt");
	const buffer = readFileSync(file);
	return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}