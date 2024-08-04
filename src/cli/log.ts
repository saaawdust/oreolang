// Copyright (c) 2024 saaawdust. All rights reserved.

import chalk from "chalk";

let VERBOSE_LEVEL = 0;

export function setVerboseLevel(lvl: number) { VERBOSE_LEVEL = lvl };
export function WARN(args: string) { VERBOSE_LEVEL >= 0 && console.log(chalk.bold(chalk.hex("#F79A06")("Warn ")) + args); }
export function INFO(args: string) { VERBOSE_LEVEL >= 1 && console.log(chalk.bold(chalk.hex("#00BFFF")("Info ")) + args); }
export function DEBUG(args: string) { VERBOSE_LEVEL >= 2 && console.log(chalk.bold(chalk.hex("#4c3cde")("Debug ")) + args); }

