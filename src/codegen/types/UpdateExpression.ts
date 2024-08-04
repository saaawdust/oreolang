// Copyright (c) 2024 saaawdust. All rights reserved.

import { updateExpression } from "../../AST/src/compiler/shared";

module.exports = ((UpdateExpression: updateExpression) => {
    if (UpdateExpression.update == "++") {
        return UpdateExpression.identifier + " += 1"
    } else {
        return UpdateExpression.identifier + " -= 1"
    }
})