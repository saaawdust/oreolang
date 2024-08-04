// Copyright (c) 2024 saaawdust. All rights reserved.

import { NumberLiteral } from "../../AST/src/compiler/token";

module.exports = ((Number: NumberLiteral) => {
    return Number.value;
})