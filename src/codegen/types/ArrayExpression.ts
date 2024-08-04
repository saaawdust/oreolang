// Copyright (c) 2024 saaawdust. All rights reserved.

import { arrayExpression } from "../../AST/src/compiler/shared";

module.exports = ((ArrayExpression: arrayExpression) => {
    let elements = "";
    let elementSeperator = ", ";

    for (let i = 0; i < ArrayExpression.elements.length; i++) {
        if (i == ArrayExpression.elements.length - 1) elementSeperator = "";
        elements += require(`./${ArrayExpression.elements[i].type}`)(ArrayExpression.elements[i]) + elementSeperator
    }
    
    return `{${elements}}`;
})