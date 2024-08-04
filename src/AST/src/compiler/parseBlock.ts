// Copyright (c) 2024 saaawdust. All rights reserved.

import chalk from "chalk";
import { ASTNode, Parser } from "./parser";
import parseStmt, { expectValue } from "./parseStmt";
import { blockStatement } from "./shared";
import { loc } from "./token";
import { error_lint_constructLines } from "../errors/error";

export default ((parser: Parser): blockStatement => {
    let statements: ASTNode[] = [];
    let start = parser.position
    let startToken = parser.peek();
    let startPrev = parser.previous();

    parser.backtrack();

    expectValue(parser, "{", 6, `Expected "{" when parsing block, got '${parser.peek().value || "nothing"}'\n${chalk.blue(`--> ${parser.options.fileName}:${startToken && startToken.loc.line || startPrev && startPrev.loc.line || loc(0, 0, 0, 0)}:${startToken && startToken.loc.column || startPrev && startPrev.loc.column || 0}:`)}\n${error_lint_constructLines(
        startToken && loc(
            startToken.loc.line,
            startToken.loc.line,
            startToken.loc.line,
            startToken.loc.line,
        ) || loc(1, 1, 1, 1),
        {
            [startToken && startToken.loc.line || startPrev && startPrev.loc.line || 0]: String(parser.peek().value) || "any"
        },
        {
            [startToken && startToken.loc.line || startPrev && startPrev.loc.line || 0]: "^".repeat(String(parser.peek().value || "any").length)
        }
    )}\n\nGot: '${startToken ? String(parser.peek().value) : "end of file"}'.\nExpected body.\nDid you forget your body?\n\nErroneous example: do let x = 3; while 5 == 2;\nValid example:\ndo {\n\tlet x = 3;\n} while 5 == 2;`)

    parser.next(); // Skip "{"

    while (!parser.eof() && !parser.peek_is("Punctuation", "}")) {
        let stmt = parseStmt(parser) as any;
        if (stmt != undefined) {
            statements.push(stmt);
        }

        if (!parser.eof() && parser.peek_is("Punctuation", ";")) {
            parser.next(); // consume ';' at end of line.
        }
    }

    if (parser.eof()) {
        expectValue(parser, "{", 6, `Expected "}" when parsing block, got 'end of file'\n${chalk.blue(`--> ${parser.options.fileName}:${startToken.loc.line}:${startToken.loc.column}:`)}\n${error_lint_constructLines(
            startToken.loc,
            {
                [startToken.loc.line]: "{ ... "
            },
            {
                [startToken.loc.line]: "~".repeat(6) + "^"
            }
        )}\n\nIncomplete body: '{ ... '.\nExpected end of body.`)
    }

    parser.next();
    let end = parser.position

    return {
        type: "BlockStatement",
        loc: loc(start, end, startToken.loc.line, startToken.loc.column),
        body: statements
    };
})