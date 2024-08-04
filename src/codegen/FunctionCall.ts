// Copyright (c) 2024 saaawdust. All rights reserved.

import { ASTNode } from "../AST/src/compiler/parser";
import { functionCall } from "../AST/src/compiler/shared";
import { getStoredData, setStoredData } from "../transform";

function pathToRoblox(path: string): string {
    let parts = path.split('/').filter(part => part !== '');

    let robloxPath = ['script'];

    for (let part of parts) {
        if (part === '..') {
            robloxPath.push("Parent.Parent")
        } else if (part !== '.') {
            robloxPath.push("Parent");
            robloxPath.push(part);
        }
    }

    return robloxPath.join('.');
}

let specialFn: { [key: string]: any } = {
    "lua": ((FunctionCall: functionCall) => {
        let args = "";

        for (let i = 0; i < FunctionCall.arguments.length; i++) {
            if (FunctionCall.arguments[i].type != "StringLiteral") continue;
            args += FunctionCall.arguments[i].value + "\n";
        }

        return args;
    }),

    "import": ((FunctionCall: functionCall) => {
        let str = "";

        if (FunctionCall.arguments.length > 0 && FunctionCall.arguments[0].type == "StringLiteral") {
            if (String(FunctionCall.arguments[0].value).startsWith("@")) {
                let arg = FunctionCall.arguments[0]; 
                return `game:GetService(${(arg as any).quote}${String(arg.value).substring(1)}${(arg as any).quote})`
            }

            str = pathToRoblox(String(FunctionCall.arguments[0].value) || "");

            let newData = getStoredData();
            if (!newData[newData.edits[newData.edits.length - 1]]) newData[newData.edits[newData.edits.length - 1]] = {};
            if (!newData[newData.edits[newData.edits.length - 1]]["imports"]) newData[newData.edits[newData.edits.length - 1]]["imports"] = [];
            newData[newData.edits[newData.edits.length - 1]]["imports"].push(String(FunctionCall.arguments[0].value) || "");

            setStoredData(newData);

        } else if (FunctionCall.arguments.length > 0) {
            const argType = FunctionCall.arguments[0].type;
            const module = require(`./types/${argType}`);
            str = module(FunctionCall.arguments[0]);
        }

        return `require(${str})`
    })
}

module.exports = ((FunctionCall: functionCall, AST: ASTNode[], index: number) => {
    let args = "";

    if (specialFn[String(FunctionCall.identifier.value)]) {
        const identifier = FunctionCall.identifier.value as string;
        const functionToCall = (specialFn as any)[identifier];

        return functionToCall(FunctionCall);
    }


    let argumentSeperator = ", ";

    for (let i = 0; i < FunctionCall.arguments.length; i++) {
        if (i == FunctionCall.arguments.length - 1) argumentSeperator = "";
        args += require(`./types/${FunctionCall.arguments[i].type}`)(FunctionCall.arguments[i]) + argumentSeperator;
    }

    return `${require('./types/' + FunctionCall.identifier.type)(FunctionCall.identifier)}(${args})`;

})