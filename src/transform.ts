// Copyright (c) 2024 saaawdust. All rights reserved.

import { ASTNode } from './AST/src/compiler/parser';

let STORED_DATA = {
    edits: []
}

// Transform AST
export function transformAST(includeHeader = true, AST: ASTNode[]) {
    let src = "--Generated with rbx-oreo\n--!strict\n"
    if (!includeHeader) src = "";

    for (let i = 0; i < AST.length; i++) {
        let token = AST[i];
        let module = require(`./codegen/${token.type}`)(
            token, AST, i
        );

        src += `\n${module}`;
    }

    return src;
}

export function getStoredData(): any {
    return STORED_DATA;
}

export function setStoredData(newData: any) {
    return STORED_DATA = newData;
}