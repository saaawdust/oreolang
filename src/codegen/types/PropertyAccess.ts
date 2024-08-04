// Copyright (c) 2024 saaawdust. All rights reserved.

import { ASTNode } from "../../AST/src/compiler/parser";

module.exports = ((PropertyAccess: import("../../AST/src/compiler/shared").propertyAccess, AST: ASTNode[], index: number) => {
    return `${PropertyAccess.identifier.value}[${require(`./${PropertyAccess.index.type}`)(PropertyAccess.index)}]`;
})