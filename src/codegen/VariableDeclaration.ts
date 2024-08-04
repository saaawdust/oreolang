// Copyright (c) 2024 saaawdust. All rights reserved.

import { ASTNode } from "../AST/src/compiler/parser";

module.exports = ((VariableDeclaration: import("../AST/src/compiler/shared").variableDeclaration, AST: ASTNode[], index: number) => {
    let value = ""

    if (VariableDeclaration.value) {
        value = ` = ${require('./types/' + VariableDeclaration.value.type)(VariableDeclaration.value)}`
    }

    return `local ${VariableDeclaration.identifier.value}${value}`
})