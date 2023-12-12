import { workspace } from "vscode";
import { extensionName } from "./utils";

export interface UnsafeTypescriptVSCodeConfig {
	enable: boolean;
	run: "onChange" | "onSave";
	decorate: "keyword" | "expression";
	highlight: {
		nonNullAssertion: boolean;
		asTypeAssertion: boolean;
		angleBracketedTypeAssertion: boolean;
		typePredicate: boolean;
	};
}

export function getConfig(): UnsafeTypescriptVSCodeConfig {
	const config = workspace.getConfiguration(extensionName);

	return {
		enable: !!config.enable,
		run: ["onChange", "onSave"].includes(config.run) ? config.run : "onChange",
		decorate: ["keyword", "expression"].includes(config.decorate)
			? config.decorate
			: "keyword",
		highlight: {
			nonNullAssertion: !!config.highlight.nonNullAssertion.enable,
			asTypeAssertion: !!config.highlight.asTypeAssertion.enable,
			angleBracketedTypeAssertion:
				!!config.highlight.angleBracketedTypeAssertion.enable,
			typePredicate: !!config.highlight.typePredicate.enable,
		},
	};
}
