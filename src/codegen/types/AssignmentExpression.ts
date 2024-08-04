// Copyright (c) 2024 saaawdust. All rights reserved.

import { assignmentExpression } from "../../AST/src/compiler/shared";

module.exports = ((AssignmentExpression: assignmentExpression) => {
    let op = "="

    if (AssignmentExpression.operator == "=") op = ""
    
    return `${AssignmentExpression.identifier.value} ${AssignmentExpression.operator}${op} ${require('./' + AssignmentExpression.value.type)(AssignmentExpression.value)}`
})