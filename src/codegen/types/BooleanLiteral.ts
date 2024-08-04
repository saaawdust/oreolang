// Copyright (c) 2024 saaawdust. All rights reserved.

import { Booleanliteral } from "../../AST/src/compiler/token";

module.exports = ((Bool: Booleanliteral) => {
    return Bool.value;
})