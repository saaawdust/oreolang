// Copyright (c) 2024 saaawdust. All rights reserved.

import { ASTNode } from "../AST/src/compiler/parser";
import { ifStatement } from "../AST/src/compiler/shared";
import { transformAST } from "../transform";

function ifStatement(IfStatement: ifStatement, AST: ASTNode[], index: number) {
    let body = "";
    let elseif = "";

    if (IfStatement.consequent.type == "BlockStatement") {
        body = transformAST(false, IfStatement.consequent.body);
    } else {
        body = require(`./${IfStatement.consequent.type}`)(IfStatement.consequent)
    }

    if (IfStatement.alternate) {
        if (IfStatement.alternate.type == "BlockStatement") {
            elseif = `else ${transformAST(false, IfStatement.alternate.body).replace(/^/gm, '\t')}`
        } else {
            elseif = "else" + `${ifStatement((IfStatement.alternate as ifStatement), AST, index)}`.slice(0, -3).replace(/^/gm, '\t').trim()
        }
    }

    return `if ${require(`./types/${IfStatement.test.type}`)(IfStatement.test)} then ${body.replace(/^/gm, '\t')}\n${elseif}\nend`
}

module.exports = ifStatement