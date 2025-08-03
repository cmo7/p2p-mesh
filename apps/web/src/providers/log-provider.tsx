import { createContext, type ReactNode, useContext } from "react";
import { consoleLogger, type Logger } from "../lib/logger";

const LogContext = createContext<Logger>(consoleLogger);

type LogProviderProps = {
	logger: Logger;
	children: ReactNode;
};
export function LogProvider(props: LogProviderProps) {
	const { logger, children } = props;
	return <LogContext.Provider value={logger}>{children}</LogContext.Provider>;
}

export function useLog() {
	const context = useContext(LogContext);
	if (!context) {
		throw new Error("useLog must be used within a LogProvider");
	}
	return context;
}
