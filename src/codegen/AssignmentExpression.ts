// Copyright (c) 2024 saaawdust. All rights reserved.

import { ASTNode } from "../AST/src/compiler/parser";

module.exports = ((AssignmentExpression: import("../AST/src/compiler/shared").assignmentExpression, AST: ASTNode[], index: number) => {
    let value = require('./types/' + AssignmentExpression.value.type)(AssignmentExpression.value);
    let op = "="

    if (AssignmentExpression.operator != "=") {
        op = AssignmentExpression.operator + op;
    }

    if (AssignmentExpression.value.type == "StringLiteral") {
        op = "..=";
    }
   
    return `${AssignmentExpression.identifier.value} ${op} ${value}`
})