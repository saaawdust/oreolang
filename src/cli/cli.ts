// Copyright (c) 2024 saaawdust. All rights reserved.

import chalk from 'chalk';
import { existsSync, readFileSync, statSync } from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { buildFile, buildProject } from './compile';
import { setVerboseLevel } from './log';
import { join } from 'path';
import { initProject } from './init';

export function writeError(string: string) {
    console.error(`${chalk.red("error")}: ${string}`);
    process.exit(1);
}

const version = JSON.parse(readFileSync('./package.json').toString()).version

const argv: any = yargs(hideBin(process.argv))
    .scriptName("oreo")
    .version(version)
    .command(
        "compile <input> [output]",
        "Compiles a '.or' file or project to the given output or cwd.",
        (yargs: any) => {
            yargs
                .positional('input', {
                    describe: 'Path to the input file, or project',
                    type: 'string',
                    demandOption: true
                })
                .positional('output', {
                    describe: 'Path to the build directory',
                    type: 'string',
                });
        },

        (argv: any) => {
            setVerboseLevel(argv.verbose);
            if (!argv["output"]) argv["output"] = join(process.cwd(), "a.luau");
            if (!existsSync(argv["input"])) {
                writeError(`No such file or directory found, '${argv["input"]}'`);
            }

            if (statSync(argv["input"]).isFile()) {
                return buildFile(argv["input"], argv["output"]);
            } else {
                return buildProject(argv["input"]);
            }
        }
    )
    .command(
        "init <name> [directory]",
        "Creates a new project.",
        (yargs: any) => {
            yargs
                .positional('name', {
                    describe: 'The name of the project',
                    type: 'string',
                    demandOption: true
                })
                .positional('directory', {
                    describe: 'The directory of where the project should be instantiated',
                    type: 'string',
                });
        },

        (argv: any) => {
            setVerboseLevel(argv.verbose);
            if (!argv["directory"]) argv["directory"] = process.cwd();
            if (!existsSync(argv["directory"])) {
                writeError(`No such file or directory found, '${argv["directory"]}'`);
            }

            return initProject(argv["name"], argv["directory"]);
        }
    )
    .count('verbose')
    .alias('v', 'verbose')
    .help()
    .argv;

if (argv._.length == 0) {
    console.log(`Oreo version ${version}`);
    process.exit(0);
}