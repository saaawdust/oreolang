// Copyright (c) 2024 saaawdust. All rights reserved.

import { ASTNode } from "../AST/src/compiler/parser";

module.exports = ((ReturnStatement: import("../AST/src/compiler/shared").returnStatement, AST: ASTNode[], index: number) => {
    return `return ${require(`./types/${ReturnStatement.statement.type}`)(ReturnStatement.statement)}`;
})