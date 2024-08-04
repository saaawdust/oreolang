// Copyright (c) 2024 saaawdust. All rights reserved.

import chalk from "chalk";
import { ASTNode } from "../AST/src/compiler/parser";

function isValidExpr(ObjExpr: any, fromType: boolean) {
    if (fromType) return true;

    if (ObjExpr.property.type == "ObjectExpression") {
        return isValidExpr(ObjExpr.property, fromType);
    } else {
        return ObjExpr.property.type != "PropertyAccess"
    }
}

module.exports = ((ObjectExpression: import("../AST/src/compiler/shared").objectExpression, AST: ASTNode[], index: number, fromType = false) => {
    if (isValidExpr(ObjectExpression, fromType)) {
        return `${require(`./types/${ObjectExpression.object.type}`)(ObjectExpression.object)}${ObjectExpression.expressionType}${require(`./types/${ObjectExpression.property.type}`)(ObjectExpression.property)}`
    } else {
        console.error(`${chalk.red("Luau runtime error")}: ${require('./types/ObjectExpression')(ObjectExpression, AST, index)}:${ObjectExpression.loc.line}:Incomplete statement: expected assignment or a function call`)
        process.exit(1);
    }
})