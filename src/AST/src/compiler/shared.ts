// Copyright (c) 2024 saaawdust. All rights reserved.

import { ASTNode } from "./parser"
import { Identifier, Token } from "./token"

export interface options {
    fileName: string
}

export interface variableDeclaration extends ASTNode {
    identifier: Identifier,
}

export interface ifStatement extends ASTNode {
    test: expression | binaryExpression,
    consequent: blockStatement | ASTNode,
    alternate: blockStatement | ifStatement | ASTNode |  null
}

export interface whileStatement extends ASTNode {
    test: expression | binaryExpression,
    consequent: blockStatement | ASTNode,
}

export interface forStatement extends ASTNode {
    init: ASTNode,
    test: expression | binaryExpression,
    update: expression | binaryExpression,
    body: blockStatement | ASTNode,
}

export interface doWhileStatement extends ASTNode {
    test: expression | binaryExpression,
    body: blockStatement | ASTNode,
}

export interface caseStatement extends ASTNode {
    caseType: string,
    identifier: Identifier | Identifier[] | null,
    body: blockStatement | ASTNode
}

export interface switchStatement extends ASTNode {
    identifier: Identifier,
    body: blockStatement<caseStatement>
}

export interface functionDeclaration extends ASTNode {
    identifier: Identifier | objectExpression,
    arguments: Token[],
    body: blockStatement<caseStatement>,
}

export interface functionCall extends ASTNode {
    identifier: Identifier,
    arguments: Token[],
}

export interface arrayExpression extends ASTNode {
    elements: Token[] 
}

export interface objectLiteralExpression extends ASTNode {
    objects: { identifier: Token, isArrayObject: boolean, value: Token | expression }[] 
}

export interface updateExpression extends ASTNode {
    identifier: string,
    update: string,
}

export interface assignmentExpression extends ASTNode {
    identifier: Identifier,
    operator: string
    value: ASTNode,
}

export interface objectExpression extends ASTNode {
    object: Identifier | functionCall,
    property: Identifier | functionCall,
    expressionType: "." | ":"
}


export interface blockStatement<t = ASTNode> extends ASTNode {
    body: t[]
}

export interface unaryExpression extends ASTNode {
    expression: expression | binaryExpression
}

export interface returnStatement extends ASTNode {
    statement: expression | binaryExpression
}

export interface propertyAccess extends ASTNode {
    identifier: expression | binaryExpression,
    index: expression | binaryExpression,
}

export interface propertyAssignment extends ASTNode {
    identifier: expression | binaryExpression,
    index: expression | binaryExpression,
    value: expression | binaryExpression | ASTNode,
}

export interface binaryExpression extends ASTNode {
    left: expression | binaryExpression,
    operator: string,
    right: expression | binaryExpression
}

export interface expression extends Token {}