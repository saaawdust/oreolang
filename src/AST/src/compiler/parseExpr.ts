// Copyright (c) 2024 saaawdust. All rights reserved.

import { Parser } from "./parser";
import { binaryExpression, expression } from "./shared";
import { loc } from "./token";
import parsePrimary from "./parsePrimary";

function isBinaryOp(parser: Parser): boolean {
    let future =  parser.peek_future(1);

    return parser.peek() && parser.peek().type == "Operator" && (future && future.type != "Operator");
}


function getPrecedence(op: string): number {
    const precedence: Record<string, number> = {
        '=': 1,
        '||': 2,
        '&&': 3,
        '<': 7, '>': 7, '<=': 7, '>=': 7, '==': 7, '!=': 7,
        '+': 10, '-': 10,
        '^': 15,
        '*': 20, '/': 20, '%': 20,
        '..': 30
    };
    return precedence[op] || 0;
}

function parseBinaryExpression(parser: Parser, left: expression | binaryExpression, precedence: number = 0): any {
    let start = left.loc.start;

    while (true) {
        const op = parser.peek();
        const opPrecedence = getPrecedence(String(op.value));
        if (opPrecedence <= precedence) break;
        parser.next();

        let right: any = parsePrimary(parser);

        while (true) {
            parser.next();
            const nextOp = parser.peek();
            if (!nextOp || nextOp.type !== 'Operator') break;
            
            const nextOpPrecedence = getPrecedence(String(nextOp.value));
          
            // If the precedence of the next operator is higher, parse it recursively
            if (nextOpPrecedence > opPrecedence) {
                
                right = parseBinaryExpression(parser, right, nextOpPrecedence);
            } else {
                break;
            }
        }
        
        
        left = {
            type: 'BinaryExpression',
            operator: String(op.value),
            loc: loc(
                start,
                right && right.loc.end || left.loc.end,
                left.loc.line,
                left.loc.column
            ),
            left,
            right
        };
    }

    return left;
}

export default ((parser: Parser): expression | binaryExpression | undefined | any => {
    const expr = parsePrimary(parser);

    parser.next();

    if (!isBinaryOp(parser)) {
        return expr;
    };

    return parseBinaryExpression(parser, (expr as expression | binaryExpression));
});