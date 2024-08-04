// Copyright (c) 2024 saaawdust. All rights reserved.

import { ASTNode } from "../AST/src/compiler/parser";

module.exports = ((MultiLineComment: import("../AST/src/compiler/token").CommentLine, AST: ASTNode[], index: number) => {
    return `--[[${MultiLineComment.value}]]`;
})