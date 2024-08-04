// Copyright (c) 2024 saaawdust. All rights reserved.

import chalk from "chalk";
import { propertyAccess } from "../AST/src/compiler/shared";

module.exports = ((PropertyAccess: propertyAccess) => {
    console.error(`${chalk.red("Luau runtime error")}: ${require('./types/PropertyAccess')(PropertyAccess)}:${PropertyAccess.loc.line}:Incomplete statement: expected assignment or a function call`)
    process.exit(1);
})