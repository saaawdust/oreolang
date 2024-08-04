// Copyright (c) 2024 saaawdust. All rights reserved.

import { ASTNode } from "../AST/src/compiler/parser";
import { forStatement, binaryExpression } from "../AST/src/compiler/shared";
import { transformAST } from "../transform";

function forStatement(ForStatement: forStatement, AST: ASTNode[], index: number) {
    let condition = require(`./types/${ForStatement.test.type}`)(ForStatement.test);
    let update = require(`./types/${ForStatement.update.type}`)(ForStatement.update);

    let body = "";
    if (ForStatement.body.type == "BlockStatement") {
        body = transformAST(false, ForStatement.body.body);
    } else {
        body = require(`./${ForStatement.body.type}`)(ForStatement.body)
    }

    if (ForStatement.test.type == "BinaryExpression" && (ForStatement.test as binaryExpression).left.type == "Identifier" && (ForStatement.test as binaryExpression).operator == "<" && (ForStatement.test as binaryExpression).right.type == "NumberLiteral" && ForStatement.init.type == "VariableDeclaration") {
        return `for ${ForStatement.init.identifier.value} = ${require('./types/' + ForStatement.init.value.type)(ForStatement.init.value)}, ${(ForStatement.test as binaryExpression).right.value - 1} do\n${body}\nend`
    } else {
        let init = ""
        if (ForStatement.init.type != "VariableDeclaration") {
            let luaStartValue = require('./types/' + ForStatement.init.value.type)(ForStatement.init.value);
            init = "local _ = " + luaStartValue;
        } else {
            init = require('./VariableDeclaration')(ForStatement.init, AST, index)
        }

        let code = "_should_increment_" + String.fromCharCode(Math.floor(Math.random() * 26) + 65) + Array.from({ length: 4 }, () => Math.random().toString(36)[2]).join('').toUpperCase();
        return `do\n${(`${init}\nlocal ${code} = false\nwhile true do\n${(`if ${code} then\n${update.replace(/^/gm, '\t')}\nelse\n${code} = true\nend\nif not (${condition}) then\n\tbreak\nend\n${body}`).replace(/^/gm, '\t')}\nend`).trim().replace(/^/gm, '\t')}\nend`
    }

    //return `do\n${(`${init}\nwhile ${condition} do\n${(`\n${update}\n${body}`).replace(/^/gm, '\t')}\nend`).trim().replace(/^/gm, '\t')}\nend`;
}

module.exports = forStatement