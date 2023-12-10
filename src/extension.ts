import {
	DiagnosticCollection,
	ExtensionContext,
	languages,
	window,
	workspace,
} from "vscode";
import { getConfig } from "./config";
import { lint } from "./lint";
import { extensionName } from "./utils";

let diagnosticCollection: DiagnosticCollection;

export function activate(context: ExtensionContext) {
	let { enable, decorate, run } = getConfig();

	let timeout: NodeJS.Timeout | undefined = undefined;
	let activeEditor = window.activeTextEditor;

	diagnosticCollection =
		languages.createDiagnosticCollection("unsafe-typescript");

	function updateLinting() {
		if (!activeEditor) {
			return;
		}

		const sourceCode = activeEditor.document.getText();
		const fileName = activeEditor.document.fileName;
		diagnosticCollection.clear();
		const diagnosticArray = lint(fileName, sourceCode, decorate);
		diagnosticCollection.set(activeEditor.document.uri, diagnosticArray);
	}

	function triggerUpdateLinting(throttle = false) {
		if (!enable) {
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
				const config = getConfig();
				enable = config.enable;
				if (enable) {
					triggerUpdateLinting();
				} else {
					diagnosticCollection.clear();
				}
			}

			if (event.affectsConfiguration(`${extensionName}.run`)) {
				const config = getConfig();
				run = config.run;
			}

			if (event.affectsConfiguration(`${extensionName}.decorate`)) {
				const config = getConfig();
				decorate = config.decorate;
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
	return undefined;
}
