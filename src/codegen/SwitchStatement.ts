// Copyright (c) 2024 saaawdust. All rights reserved.

import { ASTNode } from "../AST/src/compiler/parser";
import { switchStatement } from "../AST/src/compiler/shared";
import { transformAST } from "../transform";

function switchStatement(SwitchStatement: switchStatement, AST: ASTNode[], index: number) {
    let cases = SwitchStatement.body.body;
    let casesLua = "";
    let defaultCase: any;
    
    for (let i = 0; i < cases.length; i++) {
        let caseIndex = cases[i];
        if (caseIndex.caseType == "default") {
            defaultCase = caseIndex;
            continue;
        }
        let body
        if (caseIndex.body.type == "BlockStatement") {
            body = transformAST(false, caseIndex.body.body)
        } else {
            body = require(`./${caseIndex.body.type}`)(caseIndex.body)
        }
        
        casesLua += `[${require('./types/' + ((caseIndex.identifier as any).type as any))(caseIndex.identifier)}] = function()\n${body.trim().replace(/^/gm, '\t')}\nend,`
    }

    let code = "_switch_statement_" + String.fromCharCode(Math.floor(Math.random() * 26) + 65) + Array.from({ length: 4 }, () => Math.random().toString(36)[2]).join('').toUpperCase();
    
    let smallIden = `${code}[${require('./types/' + ((SwitchStatement.identifier as any).type as any))(SwitchStatement.identifier)}]`
    let bottomCode = `${smallIden}()`
    if (defaultCase) {
        let body
        if (defaultCase.body.type == "BlockStatement") {
            body = transformAST(false, defaultCase.body.body)
        } else {
            body = require(`./${defaultCase.body.type}`)(defaultCase.body)
        }

        bottomCode = `if ${smallIden} then\n${bottomCode.replace(/^/gm, '\t')}\nelse${body.replace(/^/gm, '\t')}\nend`
    }
    
    return `local ${code} = {\n${casesLua.replace(/^/gm, '\t')}\n}\n${bottomCode}`
}

module.exports = switchStatement