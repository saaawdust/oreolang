// Copyright (c) 2024 saaawdust. All rights reserved.

import { ASTNode } from "../AST/src/compiler/parser";

module.exports = ((CommentLine: import("../AST/src/compiler/token").CommentLine, AST: ASTNode[], index: number) => {
    return `--${CommentLine.value}`;
})