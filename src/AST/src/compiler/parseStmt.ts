// Copyright (c) 2024 saaawdust. All rights reserved.

import chalk from "chalk";
import { ASTNode, Parser } from "./parser";
import { error_lint, error_lint_constructLines } from "../errors/error";
import Constants, { loc, Token } from "./token";
import { blockStatement, caseStatement, doWhileStatement, expression, forStatement, functionDeclaration, ifStatement, returnStatement, switchStatement, variableDeclaration, whileStatement } from "./shared";
import parseExpr from "./parseExpr";
import parseBlock from "./parseBlock";

export function expectType(parser: Parser, expectedType: string, errorCode: number, errorCatch: string) {
    const token = parser.next();

    if (token && token.type != expectedType) {
        error_lint(errorCode, errorCatch);
    }

    return token;
}

export function expectValue(parser: Parser, expectedValue: string, errorCode: number, errorCatch: string) {
    parser.next()

    const token = parser.peek();

    if ((token && token.value != expectedValue) == true || (token && token.value != expectedValue) == undefined) {
        error_lint(errorCode, errorCatch);
    }

    return token;
}

function parseDeclaration(parser: Parser): variableDeclaration {
    let startToken = parser.peek();
    let idenToken = parser.peek_future(1);

    parser.next();

    const identifierName = expectType(parser, "Identifier", 6, `Expected identifier when parsing variable name, got '${idenToken != undefined && idenToken.value || "nothing"}'\n${chalk.blue(`--> ${parser.options.fileName}:${idenToken != undefined && idenToken.loc.line || startToken.loc.line}:${idenToken != undefined && idenToken.loc.column || startToken.loc.start}:`)}\n${error_lint_constructLines(
        startToken.loc,
        {
            [startToken.loc.line]: String(startToken.value) + " " + (idenToken != undefined && idenToken.value || "")
        },
        {
            [startToken.loc.line]: "~".repeat(4) + "^".repeat(Math.max(1, (idenToken != undefined && String(idenToken.value) || "").length))
        }
    )}\n\nIncomplete statement: '${String(startToken.value) + " " + (idenToken != undefined && idenToken.value || "")}'.\nExpected variable name as an identifier.`)

    if (!parser.eof() && parser.peek().value == "=") {
        parser.next(); // skip current and "="
        const value = parseExpr(parser);

        return { type: "VariableDeclaration", loc: loc(startToken.loc.start, value?.loc.end || startToken.loc.end, startToken.loc.line, startToken.loc.column), identifier: identifierName, value }
    } else {
        return { type: "VariableDeclaration", loc: loc(startToken.loc.start, idenToken.loc.end, startToken.loc.line, startToken.loc.column), identifier: identifierName, value: undefined }
    }
}

function parseIf(parser: Parser): ifStatement {
    let ifData = parser.peek();
    parser.next(); // Skip "if"

    let condition = parseExpr(parser) as expression;

    if (parser.peek_is("Punctuation", "{")) {
        let parsedBlock = parseBlock(parser);
        let alternate: blockStatement | ifStatement | null = null;

        if (!parser.eof() && parser.peek_is("Keyword", "else")) {
            parser.next(); // Skip "else"
            alternate = parseBlock(parser);
        } else if (!parser.eof() && parser.peek_is("Keyword", "elseif")) {
            let ifData = parseIf(parser); // We don't care about if it's "if" or "elseif". It still parses it.
            alternate = ifData
        };

        return { type: "IfStatement", loc: loc(ifData.loc.start, parsedBlock.loc.end, ifData.loc.line, ifData.loc.column), test: condition, consequent: parsedBlock, alternate: alternate }
    } else {
        let body = parseStmt(parser);
        return { type: "IfStatement", loc: loc(ifData.loc.start, body && body.loc.end || ifData.loc.end, ifData.loc.line, ifData.loc.column), test: condition, consequent: body as any, alternate: null }
    }
}

function parseWhile(parser: Parser): whileStatement {
    let whileData = parser.peek();
    parser.next(); // Skip "while"
    let condition = parseExpr(parser) as expression;

    // So we can do: while x {let y;}; and while x let y;
    if (parser.peek_is("Punctuation", "{")) {
        let parsedBlock = parseBlock(parser);
        return { type: "WhileStatement", loc: loc(whileData.loc.start, parsedBlock.loc.end, whileData.loc.line, whileData.loc.column), test: condition, consequent: parsedBlock }
    } else {
        let statement = parseStmt(parser) as ASTNode;
        return { type: "WhileStatement", loc: loc(whileData.loc.start, statement.loc.end, whileData.loc.line, whileData.loc.column), test: condition, consequent: statement }
    }
}

function parseDoWhile(parser: Parser): doWhileStatement {
    // Skip "do"
    let doWhileData = parser.peek();
    parser.next();

    if (parser.peek_is("Punctuation", "{")) {
        let body = parseBlock(parser);
        let whileToken = parser.peek();
        parser.backtrack();

        expectValue(parser, "while", 6, `Expected 'while' when parsing 'do while', got '${whileToken != undefined && whileToken.value || "nothing"}'\n${chalk.blue(`--> ${parser.options.fileName}:${whileToken != undefined && whileToken.loc.line || doWhileData.loc.line}:${whileToken != undefined && whileToken.loc.column || doWhileData.loc.end}:`)}\n${error_lint_constructLines(
            doWhileData.loc,
            {
                [doWhileData.loc.line]: "do {...} "
            },
            {
                [doWhileData.loc.line]: "~".repeat(10) + "^".repeat(Math.max(1, (whileToken != undefined && String(whileToken.value) || "").length))
            }
        )}\n\nIncomplete statement: 'do {...} '.\nExpected 'while' to finish 'do-while' statement.\nDid you forget to include the condition?\nErroneous example: do {};\nValid example: do {} while x == 1;`)

        parser.next();

        let condition = parseExpr(parser);

        return { type: "DoWhileStatement", loc: loc(doWhileData.loc.start, body.loc.end, doWhileData.loc.line, doWhileData.loc.column), test: condition as any, body }
    } else {
        let body = parseStmt(parser) as expression;
        let whileToken = parser.peek();
        parser.backtrack();

        expectValue(parser, "while", 6, `Expected 'while' when parsing 'do while', got '${whileToken != undefined && whileToken.value || "nothing"}'\n${chalk.blue(`--> ${parser.options.fileName}:${whileToken != undefined && whileToken.loc.line || doWhileData.loc.line}:${whileToken != undefined && whileToken.loc.column || doWhileData.loc.end}:`)}\n${error_lint_constructLines(
            doWhileData.loc,
            {
                [doWhileData.loc.line]: "do ... "
            },
            {
                [doWhileData.loc.line]: "~".repeat(10) + "^".repeat(Math.max(1, (whileToken != undefined && String(whileToken.value) || "").length))
            }
        )}\n\nIncomplete statement: 'do ... '.\nExpected 'while' to finish 'do-while' statement.\nDid you forget to include the condition?\nErroneous example: do let x = 3;\nValid example: do { let x = 3; } while x == 1;`)

        parser.next();

        let condition = parseExpr(parser);

        return { type: "DoWhileStatement", loc: loc(doWhileData.loc.start, body.loc.end, doWhileData.loc.line, doWhileData.loc.column), test: condition as any, body }
    }
}

function parseFor(parser: Parser): forStatement {
    let startData = parser.peek();
    parser.next(); // "For"

    let init = parseStmt(parser);
    let comma = parser.peek();

    if (parser.eof() || !parser.peek_is("Punctuation", ",")) {
        error_lint(6, `Expected 'comma' when parsing for loop, got '${comma != undefined && comma.value || "nothing"}'\n${chalk.blue(`--> ${parser.options.fileName}:${comma != undefined && comma.loc.line || startData.loc.line}:${comma != undefined && comma.loc.column || startData.loc.start}:`)}\n${error_lint_constructLines(
            loc(
                startData.loc.line,
                startData.loc.line,
                startData.loc.line,
                startData.loc.line,
            ),
            {
                [startData.loc.line]: "for ... "
            },
            {
                [startData.loc.line]: "~".repeat(7) + "^".repeat(Math.max(1, (comma != undefined && String(comma.value) || "").length))
            }
        )}\n\nIncomplete statement: 'for ... '.\nExpected 'comma' in for loop.`);
    }

    parser.next();

    let test = parseExpr(parser);

    comma = parser.peek();
    if (parser.eof()) {
        error_lint(6, `Expected 'comma' when parsing for loop, got '${comma != undefined && comma.value || "nothing"}'\n${chalk.blue(`--> ${parser.options.fileName}:${comma != undefined && comma.loc.line || startData.loc.line}:${comma != undefined && comma.loc.column || startData.loc.start}:`)}\n${error_lint_constructLines(
            loc(
                startData.loc.line,
                startData.loc.line,
                startData.loc.line,
                startData.loc.line,
            ),
            {
                [startData.loc.line]: "for ... "
            },
            {
                [startData.loc.line]: "~".repeat(7) + "^".repeat(Math.max(1, (comma != undefined && String(comma.value) || "").length))
            }
        )}\n\nIncomplete statement: 'for ... '.\nExpected 'comma' in for loop.`);
    }

    let update;
    if (parser.peek_is("Punctuation", ",")) {
        parser.next();
        update = parseStmt(parser);
    } else {

        update = {
            type: "UpdateExpression",
            loc: parser.peek().loc,
            identifier: (init as variableDeclaration).identifier.value,
            update: "++"
        }
    }

    let body;
    if (!parser.eof() && parser.peek_is("Punctuation", "{")) {
        body = parseBlock(parser);
    } else {
        body = parseStmt(parser);
    }

    return { type: "ForStatement", loc: loc(startData.loc.start, (body as expression).loc.end, startData.loc.start, startData.loc.column), init: init as any, test: test as any, update: update as any, body: body as any }
}

function parseSwitch(parser: Parser): switchStatement {
    let switchData = parser.peek(); parser.next();
    let identifier = parseExpr(parser);

    let body = parseBlock(parser);
    for (let i = 0; i < body.body.length; i++) {
        let item = body.body[i];
        if (item.type != "CaseStatement") {
            error_lint(9, `Found a 'non-case' object in a switch statement. Only case statements are allowed.\n${chalk.blue(`--> ${parser.options.fileName}:${item.loc.line}:${item.loc.column}:`)}\n${error_lint_constructLines(
                loc(
                    switchData.loc.line,
                    switchData.loc.line,
                    switchData.loc.line,
                    switchData.loc.line,
                ),
                {
                    [switchData.loc.line]: `switch ${identifier.value} {...}`
                },
                {
                    [switchData.loc.line]: "~~~~~~~" + "~".repeat(identifier.value.length) + "~" + "^^^^^"
                }
            )}\n\nOnly case statements are allowed in a switch statement.`)
        }
    }

    return { type: "SwitchStatement", loc: loc(switchData.loc.start, body.loc.end, switchData.loc.line, switchData.loc.column), identifier: identifier as any, body: body as any };
}

function parseCase(parser: Parser): caseStatement {

    let caseData = parser.peek(); parser.next();
    let idenName: any[] = [];

    if (caseData.value != "default") {
        idenName = parseExpr(parser);

        if (!parser.eof() && parser.peek().value == "|") {
            idenName = [idenName];
        }

        while (!parser.eof() && parser.peek().value == "|") {
            parser.next();
            idenName.push(parseExpr(parser));
        }
    }

    let body;
    if (!parser.eof() && parser.peek_is("Punctuation", "{")) {
        body = parseBlock(parser);
    } else if (parser.peek_is("Punctuation", ":")) {
        parser.next();
        body = parseStmt(parser);
    } else {
        let currentTokenValue = parser.peek() && String(parser.peek().value) || "nothing"
        const errorMessage = `Unexpected character:\n${chalk.blue(`--> ${parser.options.fileName}:${caseData.loc.line}:${caseData.loc.column}:`)}\n${error_lint_constructLines(
            loc(
                caseData.loc.line,
                caseData.loc.line,
                caseData.loc.line,
                caseData.loc.line,
            ),

            { [caseData.loc.line]: String(caseData.value) + currentTokenValue },
            {
                [caseData.loc.line]: "~".repeat(String(caseData.value).length) + "^".repeat(currentTokenValue.length)
            }
        )}\n\nUnknown or Incomplete statement: '${currentTokenValue != "" ? currentTokenValue : "end of file"}'.\nExpected an expression or statement.`;

        error_lint(4, errorMessage);
    }

    return { type: "CaseStatement", loc: loc(caseData.loc.start, (body as expression).loc.end, caseData.loc.line, caseData.loc.column), caseType: caseData.value as string, identifier: idenName, body: body as any }
}

function parseFunctionDeclaration(parser: Parser): functionDeclaration {
    let startToken = parser.peek();
    let idenToken: any = parser.peek_future(1);

    let fnType = "FunctionDeclaration";

    parser.next(); // walk past "fn"


    let args: Token[] = [];

    // Generics go here in the future
    if (parser.peek().value != "(") {
        expectType(parser, "Identifier", 6, `Expected identifier when parsing function name, got '${idenToken != undefined && idenToken.value || "nothing"}'\n${chalk.blue(`--> ${parser.options.fileName}:${idenToken != undefined && idenToken.loc.line || startToken.loc.line}:${idenToken != undefined && idenToken.loc.column || startToken.loc.start}:`)}\n${error_lint_constructLines(
            startToken.loc,
            {
                [startToken.loc.line]: "fn " + (idenToken == undefined ? "" : String(idenToken.value))
            },
            {
                [startToken.loc.line]: "~".repeat(3) + "^".repeat(Math.max(1, (idenToken == undefined ? "" : String(idenToken.value)).length))
            }
        )}\n\nIncomplete statement: '${"fn " + (idenToken == undefined ? "" : String(idenToken.value))}'.\nExpected function name as an identifier.`)

        parser.backtrack(); // Because we're already on the next token
        
        idenToken = parseIdentifier(parser, false) || parser.peek_future(1);

        if (idenToken.type == "FunctionCall") {
            args = (idenToken as any).arguments;
            idenToken = (idenToken as any).identifier;
        } else {
            function recursiveSearch(ObjExpr: any) {
                if (ObjExpr.property.type != "FunctionCall") {
                    return recursiveSearch(ObjExpr.property);
                } else {
                    return ObjExpr.property;
                }
            }

            args = recursiveSearch(idenToken).arguments;
        }
    } else {
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
        fnType = "AnonymousFunctionDeclaration";
    }

    let body;
    if (parser.peek_is("Punctuation", "{")) {
        body = parseBlock(parser);
    } else {
        body = parseStmt(parser);
    }

    return {
        type: fnType,
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

function parseReturn(parser: Parser): returnStatement {
    let startToken = parser.next(); // Walk past "return"
    let stmt = parseExpr(parser);

    return {
        type: "ReturnStatement",
        loc: loc(
            startToken.loc.start,
            (stmt as expression).loc.end,
            startToken.loc.line,
            startToken.loc.column
        ),
        statement: stmt,
    }
}

export function parseIdentifier(parser: Parser, expectAssignment = true): any {

    let idenToken = parser.peek();
    let nextToken = parser.peek_future(1);
    if (!nextToken && expectAssignment) {

        error_lint(7, `Expected assignment after identifier '${idenToken.value}', got nothing.\n${chalk.blue(`--> ${parser.options.fileName}:${idenToken.loc.line}:${idenToken.loc.column}:`)}\n${error_lint_constructLines(
            loc(
                idenToken.loc.line,
                idenToken.loc.line,
                idenToken.loc.line,
                idenToken.loc.line,
            ),
            {
                [idenToken.loc.line]: String(idenToken.value)
            },
            {
                [idenToken.loc.line]: "~".repeat(String(idenToken.value).length) + "^"
            }
        )}\n\nIncomplete statement: '${String(idenToken.value)}'.\nExpected 'assignment' after variable name.\nDid you forget to assign a value?\nErroneous example: x;\nValid example: x = 3;`)
    } else if (!nextToken) {
        return idenToken;
    };

    let finalToken = parser.peek_future(2);

    switch (nextToken.value) {
        case "+":
            switch (finalToken.value) {
                case "+": {
                    parser.skip(3);
                    return {
                        type: "UpdateExpression",
                        loc: loc(
                            idenToken.loc.start,
                            finalToken.loc.end,
                            idenToken.loc.line,
                            idenToken.loc.column,
                        ),
                        identifier: idenToken,
                        update: "++"
                    }
                }

                case "=": {

                    parser.skip(3);
                    return {
                        type: "AssignmentExpression",
                        loc: loc(
                            idenToken.loc.start,
                            finalToken.loc.end,
                            idenToken.loc.line,
                            idenToken.loc.column,
                        ),
                        identifier: idenToken,
                        operator: "+",
                        value: parseExpr(parser),
                    }
                }

                default: return idenToken

            };
        case "-":
            switch (finalToken.value) {
                case "-": {
                    parser.skip(3);
                    return {
                        type: "UpdateExpression",
                        loc: loc(
                            idenToken.loc.start,
                            finalToken.loc.end,
                            idenToken.loc.line,
                            idenToken.loc.column,
                        ),
                        identifier: idenToken,
                        update: "--"
                    }
                }

                case "=": {
                    parser.skip(3);
                    return {
                        type: "AssignmentExpression",
                        loc: loc(
                            idenToken.loc.start,
                            finalToken.loc.end,
                            idenToken.loc.line,
                            idenToken.loc.column,
                        ),
                        identifier: idenToken,
                        operator: "-",
                        value: parseExpr(parser),
                    }
                }

                default: return idenToken
            };

        case "*":
            // Switch for overflow
            switch (finalToken.value) {
                case "=":
                    parser.skip(3);
                    return {
                        type: "AssignmentExpression",
                        loc: loc(
                            idenToken.loc.start,
                            finalToken.loc.end,
                            idenToken.loc.line,
                            idenToken.loc.column,
                        ),
                        identifier: idenToken,
                        operator: "*",
                        value: parseExpr(parser),
                    }
                default: return idenToken
            }

        case "/":
            // Switch for overflow
            switch (finalToken.value) {
                case "=":
                    parser.skip(3);
                    return {
                        type: "AssignmentExpression",
                        loc: loc(
                            idenToken.loc.start,
                            finalToken.loc.end,
                            idenToken.loc.line,
                            idenToken.loc.column,
                        ),
                        identifier: idenToken,
                        operator: "/",
                        value: parseExpr(parser),
                    }
                default: return idenToken
            }

        case "=":
            parser.skip(2);

            return {
                type: "AssignmentExpression",
                loc: loc(
                    idenToken.loc.start,
                    finalToken.loc.end,
                    idenToken.loc.line,
                    idenToken.loc.column,
                ),
                identifier: idenToken,
                operator: "=",
                value: parseExpr(parser),
            }
        case "(":
            // This is a function call
            let bracketLevel = 1;
            let args: Token[] = [];

            parser.skip(2);

            let endToken;

            while (!parser.eof() && bracketLevel > 0) {
                let token = parser.peek();

                if (token.value == ")") {
                    bracketLevel--;
                    if (bracketLevel == 0) {
                        endToken = parser.peek();
                    };

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

            if (!parser.eof() && (parser.peek_is("Punctuation", ".") || parser.peek_is("Punctuation", ":"))) {
                let exprValue = parser.peek().value;
                parser.next();

                let prop: any = parseIdentifier(parser);

                parser.next();
                return {
                    type: "ObjectExpression",
                    loc: loc(
                        idenToken.loc.start,
                        !parser.eof() && parser.peek().loc.end || nextToken.loc.end,
                        idenToken.loc.line,
                        idenToken.loc.column
                    ),
                    object: {
                        type: "FunctionCall",
                        loc: loc(
                            idenToken.loc.start,
                            (endToken as expression).loc.end,
                            idenToken.loc.line,
                            idenToken.loc.line
                        ),
                        identifier: idenToken,
                        arguments: args
                    },
                    property: prop,
                    expressionType: exprValue
                }
            }

            if (!parser.eof() && parser.peek_is("Punctuation", ".")) {
                parser.next();

                let prop: any = parseIdentifier(parser);

                parser.next();
                return {
                    type: "ObjectExpression",
                    loc: loc(
                        idenToken.loc.start,
                        !parser.eof() && parser.peek().loc.end || nextToken.loc.end,
                        idenToken.loc.line,
                        idenToken.loc.column
                    ),
                    object: {
                        type: "FunctionCall",
                        loc: loc(
                            idenToken.loc.start,
                            (endToken as expression).loc.end,
                            idenToken.loc.line,
                            idenToken.loc.line
                        ),
                        identifier: idenToken,
                        arguments: args
                    },
                    property: prop
                }
            }

            return {
                type: "FunctionCall",
                loc: loc(
                    idenToken.loc.start,
                    (endToken as expression).loc.end,
                    idenToken.loc.line,
                    idenToken.loc.line
                ),
                identifier: idenToken,
                arguments: args
            }

        case ":":
        case ".": {
            // Object expressions. Oh boy.
            // These bad boys are gonna be kinda
            // Important for arrays and stuff!

            parser.skip(2);
            let prop: any = parseIdentifier(parser);

            return {
                type: "ObjectExpression",
                loc: loc(
                    idenToken.loc.start,
                    !parser.eof() && parser.peek().loc.end || nextToken.loc.end,
                    idenToken.loc.line,
                    idenToken.loc.column
                ),
                object: idenToken,
                property: prop,
                expressionType: nextToken.value
            }
        }

        case "[":
            // We're basically indexing an item
            // into an array or object here!

            parser.skip(2);
            let identifier = parseExpr(parser);
            parser.next();

            if (!parser.eof() && parser.peek().value == "=") {
                parser.next();
                let value = parseExpr(parser);
                let previousToken = parser.previous();

                return {
                    type: "PropertyAssignment",
                    loc: loc(
                        idenToken.loc.start,
                        previousToken.loc.end,
                        idenToken.loc.line,
                        idenToken.loc.column
                    ),
                    identifier: idenToken,
                    index: identifier,
                    value: value
                }
            } else {
                let previousToken = parser.previous();
                parser.backtrack();

                if (parser.peek_future(1).value == "(") {
                    let bracketLevel = 1;
                    let args: Token[] = [];

                    parser.skip(2);

                    let endToken;
                    while (!parser.eof() && bracketLevel > 0) {
                        let token = parser.peek();

                        if (token.value == ")") {
                            bracketLevel--;
                            if (bracketLevel == 0) {
                                endToken = parser.peek();
                            };

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

                    let fnCall = {
                        type: "FunctionCall",
                        loc: loc(
                            idenToken.loc.start,
                            (endToken as expression).loc.end,
                            idenToken.loc.line,
                            idenToken.loc.line
                        ),
                        identifier: {
                            type: "PropertyAccess",
                            loc: loc(
                                idenToken.loc.start,
                                previousToken.loc.end,
                                idenToken.loc.line,
                                idenToken.loc.column
                            ),
                            identifier: idenToken,
                            index: identifier,
                        },
                        arguments: args
                    };

                    if (!parser.eof() && (parser.peek_is("Punctuation", ".") || parser.peek_is("Punctuation", ":"))) {
                        let exprType = parser.peek().value;
                        parser.next();

                        let prop: any = parseIdentifier(parser);


                        parser.next();
                        return {
                            type: "ObjectExpression",
                            loc: loc(
                                idenToken.loc.start,
                                !parser.eof() && parser.peek().loc.end || nextToken.loc.end,
                                idenToken.loc.line,
                                idenToken.loc.column
                            ),
                            object: fnCall,
                            property: prop,
                            expressionType: exprType
                        }
                    }

                    return fnCall
                }

                return {
                    type: "PropertyAccess",
                    loc: loc(
                        idenToken.loc.start,
                        previousToken.loc.end,
                        idenToken.loc.line,
                        idenToken.loc.column
                    ),
                    identifier: idenToken,
                    index: identifier,
                }
            }

        default:
            return idenToken
        // if (nextToken && (nextToken.value == ";" || Constants.OPERATORS.includes(String(nextToken.value)) || Constants.OPERATORS.includes(String(nextToken.value)))) return idenToken;
        // error_lint(7, `Expected valid operator after identifier '${idenToken.value}', got '${nextToken.value}'.\n${chalk.blue(`--> ${parser.options.fileName}:${idenToken.loc.line}:${idenToken.loc.column}:`)}\n${error_lint_constructLines(
        //     idenToken.loc,
        //     {
        //         [idenToken.loc.line]: String(idenToken.value) + nextToken.value + (finalToken ? String(finalToken.value) : "")
        //     },
        //     {
        //         [idenToken.loc.line]: "~".repeat(String(idenToken.value).length) + "^".repeat(String(nextToken.value).length + (finalToken ? String(finalToken.value) : "").length)
        //     }
        // )}\n\nInvalid statement: '${String(idenToken.value) + nextToken.value + (finalToken ? String(finalToken.value) : "")}'.\nExpected valid operator after identifier.\nDid you forget to pass a valid operator?\nErroneous example: x+;\nValid example: x++;`)
    };
}

function parseStmt(parser: Parser): ASTNode | undefined {
    let currentToken = parser.peek();
    if (!currentToken) currentToken = { type: "unknown", loc: parser.previous() && parser.previous().loc || loc(0, 0, 0, 0), value: "" }

    switch (currentToken.type) {
        case 'Keyword':
            switch (currentToken.value) {
                case 'let':
                case 'var':
                    return parseDeclaration(parser);

                case 'if':
                    return parseIf(parser);

                case 'while':
                    return parseWhile(parser);

                case 'do':
                    return parseDoWhile(parser);

                case 'for':
                    return parseFor(parser);

                case 'switch':
                    return parseSwitch(parser);

                case 'case':
                case 'default':
                    return parseCase(parser);

                case 'fn':
                    return parseFunctionDeclaration(parser);

                case 'return':
                    return parseReturn(parser);

                default:
                    const errorMessage = `Unexpected keyword:\n${chalk.blue(`--> ${parser.options.fileName}:${currentToken.loc.line}:${currentToken.loc.column}:`)}\n${error_lint_constructLines(
                        loc(
                            currentToken.loc.line,
                            currentToken.loc.line,
                            currentToken.loc.line,
                            currentToken.loc.line
                        ),

                        { [currentToken.loc.line]: String(currentToken.value) },
                        {
                            [currentToken.loc.line]: "^"
                        }
                    )}\n\nUnknown or Incomplete statement: '${currentToken.value}'.\nExpected an expression or statement.`;

                    error_lint(5, errorMessage);
                    break;
            }
        case 'Identifier':
            return parseIdentifier(parser);
        // case 'NumberLiteral':
        // case 'StringLiteral':
        // case 'punc':
        //     return this.parseExpression();
        case 'MultiLineComment':
        case 'CommentLine':
            let comment = parser.peek();
            parser.next();

            return comment;
        default:
            const errorMessage = `Unexpected character:\n${chalk.blue(`--> ${parser.options.fileName}:${currentToken.loc.line}:${currentToken.loc.column}:`)}\n${error_lint_constructLines(
                loc(
                    currentToken.loc.line,
                    currentToken.loc.line,
                    currentToken.loc.line,
                    currentToken.loc.line,
                ),

                { [currentToken.loc.line]: String(currentToken.value) },
                {
                    [currentToken.loc.line]: "^".repeat(String(currentToken.value).length)
                }
            )}\n\nUnknown or Incomplete statement: '${currentToken.value != "" ? currentToken.value : "end of file"}'.\nExpected an expression or statement.`;

            error_lint(4, errorMessage);
            break;
    }
}

export default parseStmt;