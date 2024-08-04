// Copyright (c) 2024 saaawdust. All rights reserved.

import { objectLiteralExpression } from "../../AST/src/compiler/shared";

module.exports = ((ObjectLiteralExpression: objectLiteralExpression) => {
    let elements = "";
    let elementSeperator = ", ";

    for (let i = 0; i < ObjectLiteralExpression.objects.length; i++) {
        let obj = ObjectLiteralExpression.objects[i];

        if (i == ObjectLiteralExpression.objects.length - 1) elementSeperator = "";
        if (!obj.isArrayObject) {
            elements += `[${require(`./${obj.identifier.type}`)(obj.identifier)}] = ${require(`./${obj.value.type}`)(obj.value)}`
        } else {
            elements += require(`./${obj.identifier.type}`)(obj.identifier)
        }
    }
    
    return `{${elements}}`;
})