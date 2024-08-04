// Copyright (c) 2024 saaawdust. All rights reserved.

import { ASTNode } from "../../AST/src/compiler/parser";
import { functionDeclaration } from "../../AST/src/compiler/shared";
import { transformAST } from "../../transform";

function functionDeclaration(FunctionDeclaration: functionDeclaration, AST: ASTNode[], index: number) {
    let body = "";

    if (FunctionDeclaration.body.type == "BlockStatement") {
        body = transformAST(false, FunctionDeclaration.body.body);
    } else {
        body = require(`./${FunctionDeclaration.body.type}`)(FunctionDeclaration.body)
    }


    let args = "";
    let argumentSeperator = ", ";

    for (let i = 0; i < FunctionDeclaration.arguments.length; i++) {
        if (i == FunctionDeclaration.arguments.length - 1) argumentSeperator = "";
        args += FunctionDeclaration.arguments[i].value + argumentSeperator
    }

    return `function (${args})\n${body.trim().replace(/^/gm, '\t')}\nend`
}

module.exports = functionDeclaration