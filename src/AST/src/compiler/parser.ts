// Copyright (c) 2024 saaawdust. All rights reserved.

import chalk from "chalk";
import { error_lint, error_lint_constructLines } from "../errors/error";
import parseStmt from "./parseStmt";
import { expression, options } from "./shared";
import { loc, Token } from "./token";

export interface ASTNode {
    type: string;
    value?: expression | any;
    loc: loc
    [key: string]: any;
}

export class Parser {
    tokens: Token[];
    options: options
    position: number;

    constructor(Tokens: Token[], options: options) {
        this.tokens = Tokens;
        this.options = options;
        this.position = 0;
    }

    peek(): Token {
        return this.tokens[this.position];
    }

    peek_is(type: string, value: any): boolean {
        let peek = this.peek();
        return peek.type == type && peek.value == value;
    }

    previous(): Token {
        return this.tokens[this.position - 1];
    }

    peek_future(steps: number = 1): Token {
        return this.tokens[this.position + steps];
    }

    next(): Token {
        return this.tokens[this.position++];
    }

    backtrack(): Token {
        return this.tokens[this.position--];
    }

    skip(number: number): void {
        for (let i = 1; i <= number; i++) {
            this.next();
        }
    }

    eof(): boolean {
        return this.position >= this.tokens.length;
    }

    parse(): ASTNode[] {
        const statements: ASTNode[] = [];

        while (!this.eof()) {
            // JS automatically makes the reference for us :D
            let statement: ASTNode | undefined = parseStmt(this);
            if (statement != undefined) { // makes ts shut up
                statements.push(statement)
            };

            if (!this.eof() && this.peek().type === 'Punctuation' && this.peek().value == ';') {
                this.next(); // consume ';' at end of line.
            }
        }

        for (let i = 0; i < statements.length; i++) {
            let startToken = statements[i];
            if (statements[i].type == "CaseStatement") {

                error_lint(8, `'case' was found out of a switch statement. Did you mismatch a '{ }' pair?\n${chalk.blue(`--> ${this.options.fileName}:${startToken.loc.line}:${startToken.loc.column}:`)}\n${error_lint_constructLines(
                    loc(
                        startToken.loc.line,
                        startToken.loc.line,
                        startToken.loc.line,
                        startToken.loc.line
                    ),
                    {
                        [startToken.loc.line]: `case ${startToken.identifier.value}`
                    },
                    {
                        [startToken.loc.line]: "~~~~~" + "^".repeat(startToken.identifier.value.length)
                    }
                )}\n\nGot: 'case ${startToken.identifier.value}'.\nDid you mismatch a '{ }' pair?`)
            }
        }

        return statements;
    }
}