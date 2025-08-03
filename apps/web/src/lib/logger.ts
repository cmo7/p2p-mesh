export interface Logger {
	log: (...args: any[]) => void;
	error: (...args: any[]) => void;
	warn: (...args: any[]) => void;
	info: (...args: any[]) => void;
	debug: (...args: any[]) => void;
}

export const consoleLogger: Logger = {
	log: (...args: any[]) => {
		console.log(`[LOG]`, ...args);
	},
	error: (...args: any[]) => {
		console.error(`[ERROR]`, ...args);
	},
	warn: (...args: any[]) => {
		console.warn(`[WARN]`, ...args);
	},
	info: (...args: any[]) => {
		console.info(`[INFO]`, ...args);
	},
	debug: (...args: any[]) => {
		console.debug(`[DEBUG]`, ...args);
	},
};
