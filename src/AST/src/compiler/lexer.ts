// Copyright (c) 2024 saaawdust. All rights reserved.

import constants, { Booleanliteral, CommentLine, Identifier, Keyword, loc, NumberLiteral, Operator, Punctuation, StringLiteral, token, Token } from './token';
import { error_lint, error_lint_constructLines } from '../errors/error';
import chalk from 'chalk';
import { options } from './shared';

export class Lexer {
    source: string;
    position: number;
    setPos: number;
    line: number;
    options: options;

    constructor(lexString: string, lexOptions: options) {
        this.source = lexString;
        this.position = 0;
        this.setPos = 0;
        this.line = 1;

        this.options = lexOptions
    }

    private peek(): string {
        return this.source[this.position];
    }

    private peek_future(steps: number = 1): string {
        return this.source[this.position + steps];
    }

    private next(): string {
        if (this.source[this.position + 1] == "\n") {
            this.line++;
            this.setPos = 0;
        };

        return this.source[this.position++];
    }

    private skip(number: number) {
        for (let i = 1; i <= number; i++) {
            this.next();
        }
    }

    private isAtEnd(): boolean {
        return this.position >= this.source.length;
    }

    private skipWhitespace() {
        while (!this.isAtEnd() && /\s/.test(this.peek())) {
            this.next();
        }
    }

    private isAlpha(char: string): boolean {
        return /[a-zA-Z_]/.test(char);
    }

    private isDigit(char: string): boolean {
        if (/[0-9]/.test(char)) {
            return true;
        }

        if (char === '.') {
            const nextChar = this.peek_future(1);
            return this.isDigit(nextChar);
        }

        return false;
    }

    private isAlphaNumeric(char: string): boolean {
        return this.isAlpha(char) || this.isDigit(char);
    }

    private isBasicOp(char: string): boolean {
        return /[+\-*/<>^%]/g.test(char);
    }

    private isLogicalOp(char: string): boolean {
        return char == "||" || char == "&&" || char == "==" || char == "!="
    }

    private atEnd() {
        return this.position == this.source.length;
    }

    // Lex the string
    private scanString(): StringLiteral {
        let strStarter = this.peek();
        this.next();

        let character = this.peek();
        let string = "";
        let start = this.position;
        let realStart = this.setPos;
        let startLine = this.line;
        let backSlash = false;

        while (true) {
            character = this.peek();

            if (backSlash) {
                if (character === 'n') {
                    string += '\n';
                } else if (character === 't') {
                    string += '\t';
                } else if (character === 'r') {
                    string += '\r';
                } else if (character === '\\') {
                    string += '\\';
                } else if (character === '"' || character === "'") {
                    string += character;
                } else {
                    // Unknown escape sequence
                    string += '\\' + character;
                }
                backSlash = false;
            } else if (character === '\\') {
                backSlash = true;
            } else if (constants.STRING_TERMINATORS.includes(character)) {
                this.next();
                break;
            } else {
                string += character;
            }

            if (this.atEnd()) {

                const trimmedString = strStarter + string.substring(0, string.length - 9).trimEnd();

                // Trim the string
                const displayString = trimmedString.length > 15
                    ? trimmedString.substring(0, 15 - 3) + '...'
                    : trimmedString;

                const errorMessage = `Unterminated string literal:\n${chalk.blue(`--> ${this.options.fileName}:${startLine}:${realStart}:`)}\n${error_lint_constructLines(
                    loc(
                        startLine,
                        startLine,
                        startLine,
                        this.line
                    ),

                    { [startLine]: chalk.green(displayString) },
                    {
                        [startLine]: "-".repeat(displayString.length) + "^"
                    }
                )}\n\nDid you forget to ${chalk.blue("end your string?")}\nErroneous example: ${chalk.green(strStarter + "Hello, World!")}\nValid example: ${chalk.green(strStarter + "Hello, World!" + strStarter)}`;

                error_lint(1, errorMessage);
            }

            this.next();
        }

        let end = this.position;
        let length = (end - 1) - start;

        return token<StringLiteral>({
            type: "StringLiteral",
            loc: loc(start, end, startLine, this.setPos),
            length: length,
            value: string,
            quote: strStarter
        })
    }

    private isValidStartOfString(char: string): boolean {
        return constants.STRING_TERMINATORS.includes(char);
    }

    private scanDigit() {
        if (this.peek() == "0") {
            switch (this.peek_future(1)) {

                // Binary strings
                case "b":
                case "B":
                    this.skip(2);
                    return this.scanBinary();
            }
        }

        return this.scanDecimal();
    }

    private scanDecimal(): NumberLiteral {
        let start = this.position;
        let startLine = this.line;

        while (this.isDigit(this.peek())) {
            this.next();
        }

        const value = this.source.substring(start, this.position);

        return token<NumberLiteral>({
            type: "NumberLiteral",
            loc: loc(
                start,
                this.position,
                startLine,
                this.setPos
            ),
            value: parseFloat(value),
        })
    }

    private scanBinary(): NumberLiteral {
        let binaryString = "";
        let character = this.peek();
        let startLine = this.line;
        let start = this.position - 1; // "0b"
        let realStart = this.setPos

        while (character === '0' || character === '1') {
            binaryString += character;
            this.next();
            character = this.peek();
        }

        if (binaryString.length === 0) {
            const errorMessage = `A binary literal must have atleast 1 valid digit:\n${chalk.blue(`--> ${this.options.fileName}:${startLine}:${realStart}:`)}\n${error_lint_constructLines(
                loc(
                    startLine,
                    startLine,
                    startLine,
                    this.line
                ),

                { [startLine]: chalk.blue("0b") },
                {
                    [startLine]: "--^"
                }
            )}\n\nTry providing a ${chalk.blue("valid binary literal")}.\nErroneous example: '${chalk.blue("0b")}'\nValid example: '${chalk.blue("0b0111010")}'`;

            error_lint(2, errorMessage);
        }

        return token<NumberLiteral>({
            type: "NumberLiteral",
            loc: loc(
                start,
                this.position,
                startLine,
                this.setPos
            ),
            value: parseInt(binaryString, 2),
        })
    }

    private scanPunc(): Punctuation {
        let start = this.position;
        let value = this.peek();
        let startLine = this.line;

        this.next();

        return token<Punctuation>({
            type: "Punctuation",
            loc: loc(
                start,
                start + 1,
                startLine,
                this.setPos
            ),
            value,
        })
    }

    private scanBasicOp(): Operator {
        let start = this.position;
        let value = this.peek();
        let startLine = this.line;

        this.next();

        return token<Operator>({
            type: "Operator",
            loc: loc(
                start,
                start + 1,
                startLine,
                this.setPos
            ),
            value,
        })
    }

    private scanLogicalOp(): Operator {
        let start = this.position;
        let value = this.peek() + this.peek_future(1);
        let startLine = this.line;

        this.skip(2);

        return token<Operator>({
            type: "Operator",
            loc: loc(
                start,
                start + 2,
                startLine,
                this.setPos
            ),
            value,
        })
    }

    private scanKeyword(): Keyword | Identifier {
        let start = this.position;
        let startLine = this.line;

        while (!this.atEnd() && this.isAlphaNumeric(this.peek())) {
            this.next();
        }

        const value = this.source.substring(start, this.position);

        if (constants.KEYWORDS.includes(value)) {
            return token<Keyword>({
                type: "Keyword",
                loc: loc(
                    start,
                    this.position,
                    startLine,
                    this.setPos
                ),
                value
            })
        }
        
        if (value != "true" && value != "false") {
            return token<Identifier>({
                type: "Identifier",
                loc: loc(
                    start,
                    this.position,
                    startLine,
                    this.setPos
                ),
                value
            })
        } else {
            return token<Booleanliteral>({
                type: "BooleanLiteral",
                loc: loc(
                    start,
                    this.position,
                    startLine,
                    this.setPos
                ),
                value: value == "true"
            })
        }
    }

    private scanLineComment(): CommentLine {
        let str = "";
        let start = this.position;
        let startLine = this.line;

        this.skip(2);

        while (!this.atEnd() && this.peek() != "\n") {
            str += this.peek();
            this.next();
        }

        // If we find "\n", walk past it.
        if (this.peek() == "\n") this.next();
        return token<CommentLine>({
            type: "CommentLine",
            loc: loc(
                start,
                this.position,
                startLine,
                this.setPos
            ),

            value: str,
        });
    }

    // Also allows nested comments.
    private scanMultiLineComment(): CommentLine {
        let str = "";
        let start = this.position;
        let startLine = this.line;

        this.skip(2);

        let nesting = 1;
        while (true) {

            switch (this.peek()) {
                case "*":
                    if (this.peek_future(1) == "/") {
                        this.skip(2);
                        nesting--;
                        if (nesting == 0) {
                            return token<CommentLine>({
                                type: "MultiLineComment",
                                loc: loc(
                                    start,
                                    this.position,
                                    startLine,
                                    this.setPos
                                ),

                                value: str,
                            })
                        } else {
                            str += "*/";
                        }
                    } else {
                        str += "*";
                        this.next();
                    }

                    break;

                case "/":
                    if (this.peek_future(1) == "*") {
                        this.skip(2);
                        nesting++;
                        str += "/*";
                        continue;
                    } else {
                        str += "/"
                        this.next();
                    }

                    break;

                default:
                    str += this.peek();
                    this.next();
                    break;
            }
        }
    }

    tokenize() {
        const tokens: Token[] = [];
        while (!this.atEnd()) {
            this.skipWhitespace();

            if (this.atEnd()) break;

            const char = this.peek();
            const doubleChar = char + this.peek_future(1);

            if (this.isAlpha(char)) {
                tokens.push(this.scanKeyword());
            } else if (this.isDigit(char)) {
                tokens.push(this.scanDigit());
            } else if (this.isValidStartOfString(char)) {
                tokens.push(this.scanString());
            } else if (doubleChar == "//") {
                // Remove "tokens.push" and the collection
                // of "str" if you don't want comments to be
                // in the AST.
                tokens.push(this.scanLineComment());
            } else if (doubleChar == "/*") {
                // Same applies here. remove the 
                // addition of the token.

                tokens.push(this.scanMultiLineComment());
            } else if (this.isBasicOp(char)) {
                tokens.push(this.scanBasicOp());
            } else if (this.isLogicalOp(doubleChar)) {
                tokens.push(this.scanLogicalOp());
            } else if (constants.PUNCTUATION.includes(char)) {
                tokens.push(this.scanPunc());
            } else {
                const errorMessage = `Unexpected character:\n${chalk.blue(`--> ${this.options.fileName}:${this.line}:${this.setPos}:`)}\n${error_lint_constructLines(
                    loc(
                        this.line,
                        this.line,
                        this.line,
                        this.line
                    ),

                    { [this.line]: this.peek() },
                    {
                        [this.line]: "^"
                    }
                )}\n\nUnknown character: '${this.peek()}'.\nExpected an expression or statement.`;

                error_lint(3, errorMessage);
            }
        }

        return tokens
    }
}