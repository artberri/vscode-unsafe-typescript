import * as ts from "typescript";
import { Diagnostic, DiagnosticSeverity, Position, Range } from "vscode";

export function lint(
	fileName: string,
	sourceCode: string,
	decorate: "keyword" | "expression",
	languageId: string,
): Diagnostic[] {
	let code = sourceCode;
	let baseLineNumber = 0;

	if (languageId === "vue" || languageId === "svelte") {
		const scriptBlock = extractScriptBlock(sourceCode);
		if (scriptBlock[0]) {
			code = scriptBlock[0];
			baseLineNumber = scriptBlock[1];
		} else {
			return [];
		}
	}

	const sourceFile = ts.createSourceFile(
		fileName,
		code,
		ts.ScriptTarget.Latest,
		/*setParentNodes */ true,
	);

	const diagnosticArray: Diagnostic[] = [];

	lintNode(sourceFile);

	return diagnosticArray;

	function lintNode(node: ts.Node) {
		switch (node.kind) {
			case ts.SyntaxKind.NonNullExpression: {
				const exclamationToken = node
					.getChildren()
					.find((child) => child.kind === ts.SyntaxKind.ExclamationToken);
				report(
					decorate === "keyword" && exclamationToken ? exclamationToken : node,
					`Unsafe TypeScript assertion: '${node.getText()}'.

TypeScript's ! non-null assertion operator asserts to the type system that an expression is non-nullable, as in not null or undefined. Using assertions to tell the type system new information is often a sign that code is not fully type-safe. It's generally better to structure program logic so that TypeScript understands when values may be nullable.`,
				);
				break;
			}

			case ts.SyntaxKind.AsExpression: {
				const children = node.getChildren();
				const typeAnnotation = children[children.length - 1];

				if (typeAnnotation && isSafeTypeAnnotation(typeAnnotation)) {
					break;
				}

				const asKeyword = node
					.getChildren()
					.find((child) => child.kind === ts.SyntaxKind.AsKeyword);
				report(
					decorate === "keyword" && asKeyword ? asKeyword : node,
					`Unsafe TypeScript assertion: '${node.getText()}'.

Type assertions in TypeScript are technically slightly different from what is meant by type casting in other languages. Type assertions are a way of saying to the compiler "I know better than you, it's actually this other type!" Use them sparingly, and use the 'satisfies' operator instead where possible.`,
				);
				break;
			}

			case ts.SyntaxKind.TypeAssertionExpression: {
				const children = node.getChildren();
				const startIndex = children.findIndex(
					(child) => child.kind === ts.SyntaxKind.LessThanToken,
				);
				const endIndex = children.findIndex(
					(child) => child.kind === ts.SyntaxKind.GreaterThanToken,
				);
				const start = children[startIndex];
				const end = children[endIndex];

				const typeAnnotation = children[startIndex + 1];

				if (typeAnnotation && isSafeTypeAnnotation(typeAnnotation)) {
					break;
				}

				report(
					decorate === "keyword" && start && end ? [start, end] : node,
					`Unsafe TypeScript assertion: '${node.getText()}'.

Type assertions in TypeScript are technically slightly different from what is meant by type casting in other languages. Type assertions are a way of saying to the compiler "I know better than you, it's actually this other type!" Use them sparingly, and use the 'satisfies' operator instead where possible.`,
				);
				break;
			}

			case ts.SyntaxKind.TypePredicate: {
				const isKeyword = node
					.getChildren()
					.find((child) => child.kind === ts.SyntaxKind.IsKeyword);

				report(
					decorate === "keyword" && isKeyword ? isKeyword : node,
					"Unsafe type predicate",
				);
				break;
			}
		}

		ts.forEachChild(node, lintNode);
	}

	function report(node: ts.Node | [ts.Node, ts.Node], message: string) {
		const start = Array.isArray(node) ? node[0].getStart() : node.getStart();
		const end = Array.isArray(node) ? node[1].getEnd() : node.getEnd();
		const { line, character } = sourceFile.getLineAndCharacterOfPosition(start);
		const { line: lineEnd, character: characterEnd } =
			sourceFile.getLineAndCharacterOfPosition(end);

		const range = new Range(
			new Position(line + baseLineNumber, character),
			new Position(lineEnd + baseLineNumber, characterEnd),
		);

		diagnosticArray.push(
			new Diagnostic(range, message, DiagnosticSeverity.Information),
		);
	}
}

const isSafeTypeAnnotation = (type: ts.Node): boolean => {
	// Allow `as unknown`
	if (type.kind === ts.SyntaxKind.UnknownKeyword) {
		return true;
	}

	// Allow `as const`
	if (
		type.kind === ts.SyntaxKind.TypeReference &&
		type.getLastToken()?.kind === ts.SyntaxKind.Identifier &&
		type.getLastToken()?.getText() === "const"
	) {
		return true;
	}

	return false;
};

function extractScriptBlock(source: string): [string | undefined, number] {
	const scriptTagPattern =
		/<script[^>]*lang="(ts|tsx)"[^>]*>(\r\n|\r|\n)([\s\S]*?)<\/script>/;
	const match = source.match(scriptTagPattern);
	if (match) {
		const linesBeforeMatch = source.slice(0, match.index).split("\n").length;
		return [match[3]?.trim(), linesBeforeMatch];
	}
	return [undefined, -1];
}
