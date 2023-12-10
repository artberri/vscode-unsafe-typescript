import { workspace } from "vscode";
import { extensionName } from "./utils";

export interface UnsafeTypescriptVSCodeConfig {
	enable: boolean;
	run: "onChange" | "onSave";
	decorate: "keyword" | "expression";
}

export function getConfig(): UnsafeTypescriptVSCodeConfig {
	const config = workspace.getConfiguration(extensionName);

	return {
		enable: !!config.enable,
		run: ["onChange", "onSave"].includes(config.run) ? config.run : "onChange",
		decorate: ["keyword", "expression"].includes(config.decorate)
			? config.decorate
			: "keyword",
	};
}
