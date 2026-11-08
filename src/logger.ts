import { extensionName } from "./utils";

const isDebugMode = () => process.env.VSCODE_DEBUG_MODE === "true";

export const debug = isDebugMode()
	? (message: string, data?: unknown) => {
			if (data === undefined) {
				// oxlint-disable-next-line no-console -- this is the debug logger
				console.log(`[${extensionName}] ${message}`);
				return;
			}

			// oxlint-disable-next-line no-console -- this is the debug logger
			console.log(`[${extensionName}] ${message}`, data);
		}
	: () => {};
