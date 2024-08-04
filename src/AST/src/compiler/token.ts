// Copyright (c) 2024 saaawdust. All rights reserved.

export interface loc {
    start: number,
    end: number,
    line: number,
    column: number
}

export interface Token {
    type: string,
    loc: loc,
    value: number | string | boolean,
}

export interface StringLiteral extends Token {
    length: number,
    quote: string,
}

export interface NumberLiteral extends Token {
    type: 'NumberLiteral'; 
    value: number; 
}

export interface Punctuation extends Token {
    type: 'Punctuation';
    value: string;
}

export interface Operator extends Token {
    type: 'Operator'; 
    value: string; 
}

export interface Keyword extends Token {
    type: 'Keyword'; 
    value: string; 
}

export interface Booleanliteral extends Token {
    type: "BooleanLiteral",
    value: boolean
}

export interface Identifier extends Token {};

export interface CommentLine extends Token {
    type: 'CommentLine' | "MultiLineComment"; 
    value: string; 
}

export function token<t>(TypeObject: t): t {
    return TypeObject 
}

export function loc(start: number, end: number, line: number, column: number): loc {
    return {
        start,
        end,
        line,
        column
    } 
}

//

const STRING_TERMINATORS = [
    '"',
    "'"
];

const PUNCTUATION = [
    '(',
    ')',
    '{',
    '}',
    '.',
    ',',
    ';',
    ':',
    "[",
    "]",
    "=",
    "|",
    "!"
];

const OPERATORS = [
    "==",
    "!=",
    "&&",
    "+",
    "-",
    "*",
    "/",
    "^",
    "%",
    "<",
    ">",
    "<=",
    ">=",
]

const KEYWORDS = [
    "var",
    "let",

    "if",
    "else",
    "elseif",

    "while",
    "do",

    "for",

    "switch",
    "case",
    "default",

    "fn",
    "return",
];


export default { STRING_TERMINATORS, PUNCTUATION, KEYWORDS, OPERATORS };