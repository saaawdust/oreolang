// Copyright (c) 2024 saaawdust. All rights reserved.

import { ASTNode } from "../AST/src/compiler/parser";

module.exports = ((PropertyAssignment: import("../AST/src/compiler/shared").propertyAssignment, AST: ASTNode[], index: number) => {
    return `${PropertyAssignment.identifier.value}[${require(`./types/${PropertyAssignment.index.type}`)(PropertyAssignment.index)}] = ${require(`./types/${PropertyAssignment.value.type}`)(PropertyAssignment.value)}`;
})