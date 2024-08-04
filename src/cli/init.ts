// Copyright (c) 2024 saaawdust. All rights reserved.

import { existsSync } from "fs";
import { basename, join } from "path";
import { WARN } from "./log";
import { DirectoryBuffer, FileBuffer } from "./lib/fs"
import { userInfo } from "os";

function isValidDirName(dirName: string) {
    const WINDOWS_INVALID_CHARS = /[\/:*?"<>|\\]/;
    const MAC_INVALID_CHARS = /[/]/; 
    const LINUX_INVALID_CHARS = /[/]/;

    if (WINDOWS_INVALID_CHARS.test(dirName) || MAC_INVALID_CHARS.test(dirName) || LINUX_INVALID_CHARS.test(dirName) || dirName == "CON" || dirName == "nul") {
        return true;
    }

    return false;
}

export function initProject(name: string, dir: string) {
    if (existsSync(join(dir, name))) {
        let newName = name + "-" + String.fromCharCode(Math.floor(Math.random() * 26) + 65) + Array.from({ length: 4 }, () => Math.random().toString(36)[2]).join('').toUpperCase();
        WARN(`A folder already exists in '${basename(dir)}' with the name ${name}. Renaming project to: '${newName}'`);
        name = newName
    }

    if (isValidDirName(name)) {
        WARN(`'${name}' is an invalid directory name. Renaming project to: 'a'`);
        name = "a";
    }

    let currentDate = new Date();

    let project = new DirectoryBuffer(name).Append([
        new DirectoryBuffer("src").Append([
            new FileBuffer("main.oreo", "print('Hello, World!');")
        ]),

        new DirectoryBuffer("build"),
        new FileBuffer("README.md", `//! This is my awesome project!
//!
//! Here goes some other description of what it does that nobody will read!
//!
//! # Example
//! \`\`\`
//! fn sum(int, int2) return int + int2;
//! print(sum(9, 10))
//! \`\`\``),

        new FileBuffer("LICENSE", `Copyright (c) ${currentDate.getFullYear()} ${userInfo().username}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`),

        new FileBuffer("project.json", JSON.stringify({
            name: name,
            version: "0.0.1",
            description: "",
            main: "src/main.oreo",
            out: "build",
            author: userInfo().username,
            license: "MIT"
        }, null, 4))
    ]).Instantiate(dir);
}