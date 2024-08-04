// Copyright (c) 2024 saaawdust. All rights reserved.

import { ASTNode } from "../AST/src/compiler/parser";
import { whileStatement } from "../AST/src/compiler/shared";
import { transformAST } from "../transform";

function whileStatement(WhileStatement: whileStatement, AST: ASTNode[], index: number) {
    let body = "";

    if (WhileStatement.consequent.type == "BlockStatement") {
        body = transformAST(false, WhileStatement.consequent.body);
    } else {
        body = require(`./${WhileStatement.consequent.type}`)(WhileStatement.consequent)
    }

    return `while ${require(`./types/${WhileStatement.test.type}`)(WhileStatement.test)} do\n${body.trim().replace(/^/gm, '\t')}\nend`
}

module.exports = whileStatement