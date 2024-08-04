<div align="center"> 

# `✨ oreo 🍪`

**A language for luau developers <3**
*~ saaawdust*
</div>

Oreo is a basic programming language that builds on the syntax of Luau, with the eventual goal of evolving it while still retaining familiarity for those who use luau.

# Design

- Easy to learn syntax
- Learning should be easy
- Should somewhat resemble luau

# Example code

The following example code creates a class.

```js
// "class.oreo"

let class = {};
class.__index = class;

fn class.new(value) {
    let self = { ["value"] = value };
    return setmetatable(self, class);
}

fn class:myMethod() {
    print(self.value);
}

return class;

// main.oreo

let myClass = import("./class");

myClass.new("Hello, World!"):myMethod();
```

# Differences

- JavaScript-like syntax
- More control flow, such as do-while loops, better for-loops
- No types (yet!)

# Drawbacks

- No types nor generics
- "Semi" - unstable transpiler (stupid errors)

<div align="center"> 

# ` ⚠️ Oreo is a work in progress! ⚠️`
</div>

