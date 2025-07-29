import { UUID } from "crypto";

/**
 * Mapa de metadatos arbitrarios para chunks.
 * Las claves pueden ser cualquier string y los valores cualquier tipo.
 */
export type MetadataMap = {
	[key: string]: unknown;
};

/**
 * Representa un fragmento de archivo con metainformación opcional.
 * Puede estar firmado y/o comprimido.
 * @property index Posición del chunk en el archivo original.
 * @property total Número total de chunks en el archivo.
 * @property data Datos binarios del chunk.
 * @property chunkSize Tamaño original del chunk en bytes.
 * @property metadata Metadatos arbitrarios asociados al chunk.
 * @property checksum Checksum SHA-256 en base64 del chunk original.
 * @property transportChecksum Checksum para transporte (si el chunk fue comprimido o transformado).
 * @property compressed Indica si el chunk está comprimido.
 * @property compressionAlgorithm Algoritmo de compresión usado.
 * @property signed Indica si el chunk está firmado.
 * @property signature Firma digital en base64.
 */
export type Chunk = {
	/** Posición del chunk en el archivo original */
	index: number;
	/** Número total de chunks en el archivo */
	total: number;
	/** Datos binarios del chunk */
	data: ArrayBuffer;
	/** Tamaño original del chunk en bytes */
	chunkSize: number;
	/** Metadatos arbitrarios asociados al chunk */
	metadata?: MetadataMap;
	/** Checksum SHA-256 en base64 del chunk original */
	checksum: string;
	/** Checksum para transporte (si el chunk fue comprimido o transformado) */
	transportChecksum?: string;
	/** Indica si el chunk está comprimido */
	compressed?: boolean;
	/** Algoritmo de compresión usado */
	compressionAlgorithm?: CompressionAlgorithm;
	/** Indica si el chunk está firmado */
	signed?: boolean;
	/** Firma digital en base64 */
	signature?: string;
	/** Firmante del chunk, si está firmado */
	signerId?: UUID;
};

/**
 * Chunk firmado: incluye la propiedad signature.
 */
export type SignedChunk = Chunk & {
	signature: string;
	signed: true;
	signerId: UUID;
};

/**
 * Chunk no firmado: la propiedad signed es false.
 */
export type UnsignedChunk = Chunk & { signed: false };

/**
 * Chunk comprimido: compressed es true, incluye algoritmo y checksum de transporte.
 */
export type CompressedChunk = Chunk & {
	compressed: true;
	compressionAlgorithm: string;
	transportChecksum: string;
};

/**
 * Chunk no comprimido: compressed es false o indefinido, sin algoritmo ni checksum de transporte.
 */
export type UnCompressedChunk = Chunk & {
	compressed?: false;
	compressionAlgorithm?: never;
};

/**
 * Representa un archivo dividido en chunks.
 * @property chunks Array de chunks que componen el archivo.
 */
export type ChunkedFile = {
	chunks: Chunk[];
};

/**
 * Algoritmos de compresión soportados.
 */
export type CompressionAlgorithm = "gzip" | "deflate";

export type SignatureAlgorithm = "RSASSA-PKCS1-v1_5" | "ECDSA";

export type KeyringEntry = {
	id: UUID;
	key: CryptoKey;
};

export type Keyring = {
	keys: Map<UUID, KeyringEntry>;
	get: (id: UUID) => KeyringEntry | undefined;
	add: (id: UUID, key: CryptoKey) => void;
	remove: (id: UUID) => void;
};

