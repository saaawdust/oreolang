// Copyright (c) 2024 saaawdust. All rights reserved.

import { binaryExpression } from "../../AST/src/compiler/shared";

let opSwitch: {[key: string]: string} = {
    "!=": "~=",
    "||": "or",
    "&&": "and"
}

module.exports = ((BinExpr: binaryExpression) => {
    if (opSwitch[BinExpr.operator]) BinExpr.operator = opSwitch[BinExpr.operator];

    if (BinExpr.left.type == "StringLiteral" && BinExpr.right.type == "StringLiteral") {
        BinExpr.operator = ".."
    }

    return `${require(`./${BinExpr.left.type}`)(BinExpr.left)} ${BinExpr.operator} ${require(`./${BinExpr.right.type}`)(BinExpr.right)}`
})