// Copyright (c) 2024 saaawdust. All rights reserved.

import { StringLiteral } from "../../AST/src/compiler/token";

module.exports = ((String: StringLiteral) => {
    return `${String.quote}${String.value}${String.quote}`;
})