import {
	DiagnosticCollection,
	ExtensionContext,
	languages,
	window,
	workspace,
} from "vscode";
import { lint } from "./lint";

let diagnosticCollection: DiagnosticCollection;

export function activate(context: ExtensionContext) {
	let timeout: NodeJS.Timeout | undefined = undefined;
	let activeEditor = window.activeTextEditor;

	diagnosticCollection =
		languages.createDiagnosticCollection("unsafe-typescript");
	context.subscriptions.push(diagnosticCollection);

	function updateLinting() {
		if (!activeEditor) {
			return;
		}

		const sourceCode = activeEditor.document.getText();
		const fileName = activeEditor.document.fileName;
		diagnosticCollection.clear();
		const diagnosticArray = lint(fileName, sourceCode);
		diagnosticCollection.set(activeEditor.document.uri, diagnosticArray);
	}

	function triggerUpdateLinting(throttle = false) {
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

	window.onDidChangeActiveTextEditor(
		(editor) => {
			activeEditor = editor;
			if (editor) {
				triggerUpdateLinting();
			}
		},
		null,
		context.subscriptions,
	);

	workspace.onDidChangeTextDocument(
		(event) => {
			if (activeEditor && event.document === activeEditor.document) {
				triggerUpdateLinting(true);
			}
		},
		null,
		context.subscriptions,
	);
}

export function deactivate(): Thenable<void> | undefined {
	return undefined;
}
