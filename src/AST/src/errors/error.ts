// Copyright (c) 2024 saaawdust. All rights reserved.

import chalk from "chalk";
import { loc } from "../compiler/token";

export function error_lint(errorCode: number, body: string): void {
    console.error(`${chalk.red("error[")}${errorCode}${chalk.red(`]: `)}${body}`);
    process.exit(1);
}

export function warn_lint(body: string): void {
    console.warn(`${chalk.yellow("warning: ")}${body}`);
    return;
}

export function error_lint_constructLines(loc: loc, Lines: { [key: number]: string }, Seperator: { [key: number]: string }): string {
    let result = '  | \n';

    for (let i = loc.start; i <= loc.end; i++) {

        if (Lines[i] != undefined) {
            result += `${i} | ${Lines[i]}\n`;
            
            if (Seperator[i]) {
                result += `  | ${Seperator[i]}\n`;
            } else {
                 result += "  | ";
            }
        }
    }

    return result;
}