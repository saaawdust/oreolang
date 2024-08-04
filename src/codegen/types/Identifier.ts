// Copyright (c) 2024 saaawdust. All rights reserved.

import { Identifier } from "../../AST/src/compiler/token";

module.exports = ((Identifier: Identifier) => {
    return Identifier.value;
})