// Copyright (c) 2024 saaawdust. All rights reserved.

import { copyFileSync, existsSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "fs";
import { getStoredData, transformAST } from "../transform"
import { Parser, Lexer } from "../AST/src/index"
import { basename, dirname, extname, join } from "path";
import chalk from "chalk";
import { DEBUG, INFO, WARN } from "./log";
import { writeError } from "./cli"

function findFileWithBaseName(dirPath: string, baseName: string): string | null {
    const normalizedBaseName = basename(baseName);
    const files = readdirSync(dirPath);

    for (const file of files) {
        const fileBaseName = basename(file, extname(file));

        if (fileBaseName === normalizedBaseName) {
            return join(dirPath, file);
        }
    }

    return null;
}

export function buildFile(input: string, output: string, silent = false) {
    let inputFile = readFileSync(input).toString();
    let config = {
        fileName: basename(input)
    };

    if (!silent) {
        console.log(
            chalk.bold(chalk.hex("#23D18B")("Compiling ")) + `"${config.fileName}"`
        )
    }

    if (!extname(output)) {
        output += ".luau";
        INFO("No file format was provided. Defaulting to '.luau'");
    }

    let storedData = getStoredData();
    storedData.edits.push(output);

    DEBUG(`Pushed '${output}' to the data stack`);

    let source = transformAST(true, new Parser(
        new Lexer(inputFile, config).tokenize(), config
    ).parse());


    writeFileSync(output, source);

    INFO("Linking libraries");
    if (storedData[output] && storedData[output]["imports"]) {
        for (let i = 0; i < storedData[output].imports.length; i++) {
            let importedObj = storedData[output]["imports"][i];
            DEBUG(`Linking ${importedObj}`);

            if (!existsSync(String(findFileWithBaseName(dirname(input), importedObj)))) {
                WARN(`Attempt to import non-existant module at '${importedObj}' in file '${basename(output)}'. This module will not be imported.`)
            } else if (!existsSync(join(output, importedObj))) {
                let destpath = join(dirname(output), basename(String(findFileWithBaseName(dirname(input), importedObj))));
                copyFileSync(String(findFileWithBaseName(dirname(input), importedObj)), destpath);
                
                buildFile(destpath, join(dirname(output), basename(destpath, extname(destpath))), silent)
                unlinkSync(destpath);
            }
        };
    }

    storedData.edits.pop()
    delete storedData[output];

    DEBUG(`Removed ${output} from the stack`);

    if (!silent) {
        console.log(
            chalk.bold(chalk.hex("#23D18B")("Finished ")) + `dev [unoptimized] "${config.fileName}" -> "${basename(output)}"`
        );
    }
}

export function buildProject(input: string) {
    let projFile = join(input, "project.json");
    if (!existsSync(projFile)) {
        writeError(`Project '${basename(input)}' does not contain a 'project.json'`);
    }

    let projectData: any = JSON.parse(readFileSync(projFile).toString());
    if (!projectData["main"]) writeError(`Project file in project '${basename(input)}' does not contain a reference to a 'main' file.`);
    if (!projectData["out"]) {
        WARN(`Project file in project '${basename(input)}' does not contain a reference to an 'out' directory. Defaulting to cwd.`);
        projectData["out"] = process.cwd();
    }

    let mainFile = join(input, projectData["main"]);

    if (!existsSync(mainFile)) writeError(`Project file in project '${basename(input)}' references the 'main' file to a non-existant path.\nAre you sure your 'main' exists?`);
    if (!statSync(mainFile).isFile()) writeError(`Project file in project '${basename(input)}' references the 'main' file to a non-file path.\nAre you sure your 'main' is a file?`);
    if (!existsSync(join(input, projectData["out"]))) writeError(`Project file in project '${basename(input)}' references the 'out' directory to a non-existant path.\nAre you sure your 'out' exists?`);

    console.log(
        chalk.bold(chalk.hex("#23D18B")("Compiling project ")) + `"${basename(input)}"`
    );

    buildFile(mainFile, join(join(input, projectData["out"]), basename(mainFile, extname(mainFile))), true);

    console.log(
        chalk.bold(chalk.hex("#23D18B")("Finished ")) + `dev [unoptimized] "${basename(input)}" -> "${basename(projectData["out"])}"`
    );
}