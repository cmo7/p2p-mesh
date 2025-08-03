export type Checksum = string;

export async function getChecksum(data: ArrayBuffer): Promise<Checksum> {
	const hash = await crypto.subtle.digest("SHA-256", data);
	return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

export async function isValidChecksum(
	data: ArrayBuffer,
	checksum: Checksum,
): Promise<boolean> {
	const calculatedChecksum = await getChecksum(data);
	console.log(
		`Calculated checksum: ${calculatedChecksum}, Expected: ${checksum}`,
	);
	return calculatedChecksum === checksum;
}
