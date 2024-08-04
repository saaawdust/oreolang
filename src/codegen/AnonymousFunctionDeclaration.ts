// Copyright (c) 2024 saaawdust. All rights reserved.

import chalk from "chalk";
import { functionDeclaration } from "../AST/src/compiler/shared";

module.exports = ((FunctionDeclaration: functionDeclaration) => {
    console.error(`${chalk.red("Luau runtime error")}: function():${FunctionDeclaration.loc.line}:Expected identifier when parsing function name, got '('`)
    process.exit(1);
})