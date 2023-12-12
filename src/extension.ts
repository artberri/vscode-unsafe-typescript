import {
	DiagnosticCollection,
	ExtensionContext,
	languages,
	window,
	workspace,
} from "vscode";
import { getConfig } from "./config";
import { lint } from "./lint";
import { debug } from "./logger";
import { extensionName } from "./utils";

let diagnosticCollection: DiagnosticCollection;

const supportedLanguages = ["typescript", "typescriptreact", "vue", "svelte"];

export function activate(context: ExtensionContext) {
	debug("Activating extension");

	let { enable, decorate, run, highlight } = getConfig();

	let timeout: NodeJS.Timeout | undefined = undefined;
	let activeEditor = window.activeTextEditor;

	diagnosticCollection =
		languages.createDiagnosticCollection("unsafe-typescript");

	function updateLinting() {
		if (!activeEditor) {
			debug("No active editor, aborting linting");
			return;
		}

		if (!supportedLanguages.includes(activeEditor.document.languageId)) {
			debug(`Language ${activeEditor.document.languageId} not supported`);
			return;
		}

		debug(
			`Linting ${activeEditor.document.fileName} with language ${activeEditor.document.languageId}`,
		);
		const sourceCode = activeEditor.document.getText();
		const fileName = activeEditor.document.fileName;
		diagnosticCollection.clear();
		const diagnosticArray = lint(
			fileName,
			sourceCode,
			activeEditor.document.languageId,
			{ decorate, highlight },
		);
		diagnosticCollection.set(activeEditor.document.uri, diagnosticArray);
	}

	function triggerUpdateLinting(throttle = false) {
		if (!enable) {
			debug("Linting disabled, aborting linting");
			return;
		}

		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}

		if (throttle) {
			timeout = setTimeout(updateLinting, 500);
		} else {
			updateLinting();
		}
	}

	if (activeEditor) {
		debug("Triggering initial linting");
		triggerUpdateLinting();
	}

	const changeActiveTextEditorDisposable = window.onDidChangeActiveTextEditor(
		(editor) => {
			activeEditor = editor;

			if (!editor) {
				return;
			}

			triggerUpdateLinting();
		},
	);

	const saveTextDocumentDisposable = workspace.onDidSaveTextDocument(
		(document) => {
			if (activeEditor && document === activeEditor.document) {
				triggerUpdateLinting();
			}
		},
	);

	const changeTextDocumentDisposable = workspace.onDidChangeTextDocument(
		(event) => {
			if (
				run === "onChange" &&
				activeEditor &&
				event.document === activeEditor.document
			) {
				triggerUpdateLinting(true);
			}
		},
	);

	const changeConfigurationDisposable = workspace.onDidChangeConfiguration(
		(event) => {
			if (event.affectsConfiguration(`${extensionName}.enable`)) {
				debug("Updating enable configuration");

				const config = getConfig();
				enable = config.enable;
				if (enable) {
					triggerUpdateLinting();
				} else {
					diagnosticCollection.clear();
				}
			}

			if (event.affectsConfiguration(`${extensionName}.run`)) {
				debug("Updating run configuration");

				const config = getConfig();
				run = config.run;
			}

			if (event.affectsConfiguration(`${extensionName}.decorate`)) {
				debug("Updating decorate configuration");

				const config = getConfig();
				decorate = config.decorate;
				triggerUpdateLinting();
			}

			if (event.affectsConfiguration(`${extensionName}.highlight`)) {
				debug("Updating highlight configuration");

				const config = getConfig();
				highlight = config.highlight;
				triggerUpdateLinting();
			}
		},
	);

	context.subscriptions.push(
		diagnosticCollection,
		changeConfigurationDisposable,
		changeActiveTextEditorDisposable,
		saveTextDocumentDisposable,
		changeTextDocumentDisposable,
	);
}

export function deactivate(): Thenable<void> | undefined {
	debug("Deactivating extension");

	return undefined;
}
