// Copyright (c) 2024 saaawdust. All rights reserved.

import { ASTNode } from "../../AST/src/compiler/parser";

module.exports = ((UnaryExpression: import("../../AST/src/compiler/shared").unaryExpression, AST: ASTNode[], index: number) => {
    return `not (${require(`./${UnaryExpression.expression.type}`)(UnaryExpression.expression)})`
})