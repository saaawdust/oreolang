// Copyright (c) 2024 saaawdust. All rights reserved.

import { ASTNode } from "../AST/src/compiler/parser";
import { transformAST } from "../transform";

function doWhile(DoWhileStatement: import("../AST/src/compiler/shared").doWhileStatement, AST: ASTNode[], index: number) {
    let body = "";

    if (DoWhileStatement.body.type == "BlockStatement") {
        body = transformAST(false, DoWhileStatement.body.body);
    } else {
        body = require(`./${DoWhileStatement.body.type}`)(DoWhileStatement.body)
    }
    
    return `repeat \n${body.trim().replace(/^/gm, '\t')}\nuntil ${require(`./types/${DoWhileStatement.test.type}`)(DoWhileStatement.test)}`
}

module.exports = doWhile