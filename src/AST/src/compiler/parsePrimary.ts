import chalk from "chalk";
import parseExpr from "./parseExpr";
import { Parser } from "./parser";
import parseStmt, { expectType, expectValue, parseIdentifier } from "./parseStmt";
import { expression } from "./shared";
import { error_lint, error_lint_constructLines } from "../errors/error";
import { loc, Token } from "./token";
import parseBlock from "./parseBlock";

export default ((parser: Parser) => {
    let token = parser.peek()
    if (!token) token = { type: "Punctuation", loc: parser.previous().loc, value: "" };
    switch (token.type) {

        // For now, just return it back.
        case "Punctuation":
            if (token.value == '(') {
                parser.next(); // consume '('

                if (parser.eof()) {
                    error_lint(7, `Expected closing parenthesis ")" when parsing parenthesis, got 'nothing'\n${chalk.blue(`--> ${parser.options.fileName}:${token.loc.line}:${token.loc.column}:`)}\n${error_lint_constructLines(
                        loc(
                            token.loc.line,
                            token.loc.line,
                            token.loc.line,
                            token.loc.line
                        ),
                        {
                            [token.loc.line]: "(..."
                        },
                        {
                            [token.loc.line]: "~".repeat(4) + "^"
                        }
                    )}\n\nIncomplete statement: '(...'.\nExpected ')' to close '(' at ${token.loc.line}:${token.loc.start + 1}.`)
                } else if (parser.peek().value == ')') {
                    return undefined;
                }

                const expr = parseExpr(parser);
                const nextToken = parser.peek_future(1);

                parser.backtrack();

                expectValue(parser, ")", 7, `Expected closing parenthesis ")" when parsing parenthesis, got '${nextToken != undefined && nextToken.value || "nothing"}'\n${chalk.blue(`--> ${parser.options.fileName}:${nextToken != undefined && nextToken.loc.line || token.loc.line}:${nextToken != undefined && nextToken.loc.column || token.loc.start}:`)}\n${error_lint_constructLines(
                    loc(
                        token.loc.line,
                        token.loc.line,
                        token.loc.line,
                        token.loc.line
                    ),
                    {
                        [token.loc.line]: "(..."
                    },
                    {
                        [token.loc.line]: "~".repeat(4) + "^"
                    }
                )}\n\nIncomplete statement: '(...'.\nExpected ')' to close '(' at ${token.loc.line}:${token.loc.start}.`)

                return expr;
            } else if (token.value == '[') {
                let bracketLevel = 1;
                let args: Token[] = [];

                parser.next();

                let endToken;

                while (!parser.eof() && bracketLevel != 0) {
                    let token = parser.peek();

                    if (token.value == "]") {
                        bracketLevel--;
                        if (bracketLevel == 0) endToken = token;
                        parser.next();
                        continue;
                    }

                    if (token.value == "[") {
                        bracketLevel++;

                        parser.next();
                        continue;
                    }

                    if (token.value == ",") {
                        parser.next();
                        continue;
                    } else if (token.value == ",") {
                        error_lint(4, `Unexpected character found while parsing array:\n${chalk.blue(`--> ${parser.options.fileName}:${token.loc.line}:${token.loc.column}:`)}\n${error_lint_constructLines(
                            loc(
                                token.loc.line,
                                token.loc.line,
                                token.loc.line,
                                token.loc.line,
                            ),

                            { [token.loc.line]: "[..." },
                            {
                                [token.loc.line]: "~".repeat(4) + "^"
                            }
                        )}\n\nGot token: ','.\nExpected an expression or value.\nDid you accidentally misplace a ","?`)
                    };

                    args.push(parseExpr(parser));

                    if (parser.peek().value != "[" && parser.peek().value != "]") {
                        parser.next();
                    }
                }



                if (parser.eof() && bracketLevel != 0) {
                    error_lint(4, `Unexpected character found while parsing array:\n${chalk.blue(`--> ${parser.options.fileName}:${token.loc.line}:${token.loc.column}:`)}\n${error_lint_constructLines(
                        loc(
                            token.loc.line,
                            token.loc.line,
                            token.loc.line,
                            token.loc.line,
                        ),

                        { [token.loc.line]: "[..." },
                        {
                            [token.loc.line]: "~".repeat(4) + "^"
                        }
                    )}\n\nFound 'end of file' while parsing array.\nExpected ']' to close array.`)
                }

                return {
                    type: "ArrayExpression",
                    loc: loc(
                        token.loc.start,
                        (endToken as expression).loc.end,
                        token.loc.line,
                        token.loc.column
                    ),
                    elements: args
                }
            } else if (token.value == '{') {
                parser.next();

                let bracketLevel = 1;
                let args: any = [];
                let endToken;

                while (!parser.eof() && bracketLevel > 0) {
                    let token = parser.peek();

                    if (token.value == "}") {
                        bracketLevel--;
                        if (bracketLevel == 0) endToken = token;
                        parser.next();
                        continue;
                    }

                    if (token.value == "{") {
                        bracketLevel++;

                        parser.next();
                        continue;
                    }

                    if (token.value != "[") {
                        error_lint(4, `Unexpected character found while parsing object:\n${chalk.blue(`--> ${parser.options.fileName}:${token.loc.line}:${token.loc.column}:`)}\n${error_lint_constructLines(
                            loc(
                                token.loc.line,
                                token.loc.line,
                                token.loc.line,
                                token.loc.line,
                            ),

                            { [token.loc.line]: "{..." },
                            {
                                [token.loc.line]: "~".repeat(4) + "^"
                            }
                        )}\n\nGot token: ','.\nExpected an expression or value.\nDid you accidentally misplace a ","?`)
                    }

                    parser.next();

                    let tokenName = parseExpr(parser);
                    let tokenValue = null;

                    parser.next();

                    if (!parser.eof() && parser.peek_is("Punctuation", "=")) {
                        parser.next(); // Skip "="
                        tokenValue = parseExpr(parser);
                    }

                    args.push({
                        identifier: tokenName,
                        isArrayObject: tokenValue == null,
                        value: tokenValue
                    })

                    if (parser.peek().value != "{" && parser.peek().value != "}") {
                        parser.next();
                    }
                }

                if (parser.eof() && bracketLevel != 0) {
                    error_lint(4, `Unexpected character found while parsing object:\n${chalk.blue(`--> ${parser.options.fileName}:${token.loc.line}:${token.loc.column}:`)}\n${error_lint_constructLines(
                        loc(
                            token.loc.line,
                            token.loc.line,
                            token.loc.line,
                            token.loc.line,
                        ),

                        { [token.loc.line]: "{..." },
                        {
                            [token.loc.line]: "~".repeat(4) + "^"
                        }
                    )}\n\nFound 'end of file' while parsing object.\nExpected '}' to close array.`)
                }

                parser.backtrack();

                return {
                    type: "ObjectLiteralExpression",
                    loc: loc(
                        token.loc.start,
                        (endToken as expression).loc.end,
                        token.loc.line,
                        token.loc.column
                    ),
                    objects: args
                }
            } else if (token.value == '!') {
                if (!parser.peek_future()) {
                    error_lint(6, `Expected identifier or expression after '!':\n${chalk.blue(`--> ${parser.options.fileName}:${token.loc.line}:${token.loc.column}:`)}\n${error_lint_constructLines(
                        loc(
                            token.loc.line,
                            token.loc.line,
                            token.loc.line,
                            token.loc.line,
                        ),

                        { [token.loc.line]: "!" },
                        {
                            [token.loc.line]: "~^"
                        }
                    )}\n\nGot 'end of file'.\nExpected an expression or value.\nDid you forget to add an expression?`)
                }

                parser.next();
                let expr = parseExpr(parser);

                return {
                    type: "UnaryExpression",
                    loc: loc(
                        token.loc.start,
                        expr.loc.end,
                        token.loc.line,
                        token.loc.column
                    ),
                    expression: expr
                }
            } else {
                if (token.value == "")
                    error_lint(5, `Unexpected token:\n${chalk.blue(`--> ${parser.options.fileName}:${token.loc.line}:${token.loc.column}:`)}\n${error_lint_constructLines(
                        loc(
                            token.loc.line,
                            token.loc.line,
                            token.loc.line,
                            token.loc.line,
                        ),

                        { [token.loc.line]: String(token.value) },
                        {
                            [token.loc.line]: "^".repeat(String(token.value).length)
                        }
                    )}\n\nUnexpected token: '${token.value != "" ? String(token.value) : "end of file"}'.\nAn expression was expected.`)
            }
            break;


        case "Identifier":
            return parseIdentifier(parser, false);

        case "Keyword":
            if (token.value == "fn") {
                
                let startToken = parser.peek();
                let idenToken: any = parser.peek_future(1);

                parser.skip(2); // walk past "fn"


                let args: Token[] = [];
                let bracketLevel = 1;

                while (!parser.eof() && bracketLevel > 0) {
                    let token = parser.peek();

                    if (token.value == ")") {
                        bracketLevel--;

                        parser.next();
                        continue;
                    }

                    if (token.value == "(") {
                        bracketLevel++;

                        parser.next();
                        continue;
                    }

                    if (token.value == ",") {
                        parser.next();
                        continue;
                    } else if (token.value == ",") {
                        error_lint(4, `Unexpected character found while parsing arguments:\n${chalk.blue(`--> ${parser.options.fileName}:${token.loc.line}:${token.loc.column}:`)}\n${error_lint_constructLines(
                            loc(
                                token.loc.line,
                                token.loc.line,
                                token.loc.line,
                                token.loc.line,
                            ),

                            { [token.loc.line]: idenToken.value + "(...," },
                            {
                                [token.loc.line]: "~".repeat((String(idenToken.value) + "(...").length) + "^"
                            }
                        )}\n\nGot token: ','.\nExpected an expression or value.\nDid you accidentally misplace a ","?`)
                    };

                    args.push(parseExpr(parser));
                    parser.backtrack()

                    if (!parser.eof() && parser.peek().value != "(" && parser.peek().value != ")") {
                        parser.next();
                    }
                }

                if (parser.eof() && bracketLevel != 0) {
                    error_lint(4, `Unexpected character found while parsing arguments:\n${chalk.blue(`--> ${parser.options.fileName}:${idenToken.loc.line}:${idenToken.loc.column}:`)}\n${error_lint_constructLines(
                        loc(
                            idenToken.loc.line,
                            idenToken.loc.line,
                            idenToken.loc.line,
                            idenToken.loc.line,
                        ),

                        { [idenToken.loc.line]: idenToken.value + "(..." },
                        {
                            [idenToken.loc.line]: "~".repeat((idenToken.value + "(...").length) + "^"
                        }
                    )}\n\nFound 'end of file' while parsing function.\nExpected ')' to close function argument.`)
                }

                idenToken = null;


                let body;
                if (parser.peek_is("Punctuation", "{")) {
                    body = parseBlock(parser);
                } else {
                    body = parseStmt(parser);
                }

                parser.backtrack();

                return {
                    type: "AnonymousFunctionDeclaration",
                    loc: loc(
                        startToken.loc.start,
                        (body as expression).loc.end,
                        startToken.loc.line,
                        startToken.loc.column
                    ),

                    identifier: idenToken as any,
                    arguments: args,
                    body: body as any
                }
            }
        default:
            return token;
    }
})

