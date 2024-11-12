(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? (module.exports = factory())
    : typeof define === "function" && define.amd
    ? define(factory)
    : (global.sbn = factory());
})(this, function () {
  "use strict";

  /**
    ## Lexical Analyzer
    Just like we can split English sentence "I have a Tinta" to [I, have, a, Tinta],
    lexical analyzer splits a code string into small meaningful chunks (tokens).
    In this language, each token is delimited by white spaces, a token is either
    `word` or `number`.
  
    ### Parameter
    - code `String`: the sbn code string to analyze
  
    ### Return
    Array of objects.
    ```
    input: "Papel 100"
    output:[{ type: 'word', value: 'Papel' }, { type: "number", value: 100 }]
    ```
  
    ### Notes
    Regex for split
      \s : matches any whitespace character (equal to [\r\n\t\f\v ])
       + : match previous condition for one and unlimited times
  */

  function lexer(code) {
    return code
      .split(/\s+/)
      .filter(function (t) {
        return t.length > 0;
      })
      .map(function (t) {
        return isNaN(t)
          ? { type: "word", value: t }
          : { type: "number", value: t };
      });
  }

  /**
    ## Parser (Syntactical Analyzer)
    Parser go through each tokens, find syntactic information, and builds
    AST (Abstract Syntax Tree). You can think of it as a 🗺 for our code.
    In this language, there is 2 syntax type `NumberLiteral` and `CallExpression`.
  
    `NumberLiteral` means the value is a number. It is used as a parameter
    for CallExpression. In this language, only numbers from 0 to 100 exist.
  
    `CallExpression` is a command to execute action. There are three kinds.
      - `Papel` means "grab a Papel". It takes one NumberLiteral as color
        code of the Papel. (In this language, Papel is always size 100 x 100)
      - `Tinta` is "grab a Tinta". It takes one NumberLiteral as color code of the Tinta.
        (In this language, a Tinta only have a thickness of 1)
      - `Linea` means "draw a line" It takes 4 NumberLiteral as coordinates.
        (First half x and y coordinate of starting point, and second half is x and
        y coordinate of ending point, counting from bottom right corner of a Papel.)
  
    ### Parameter
    - tokens `Array`: sbn code tokenized by lexer function
  
    ### Return
    AST object
    ```
    input: [{ type: "word", value: "Papel" }, { type: "number", value: 100 }]
    output: {
      type: "Drawing",
      "body": [{
        "type": "CallExpression",
        "name": "Papel",
        "arguments": [
          {
            "type": "number",
            "value": "100"
          }
        ]
      }]
    }
    ```
  */

  function checkArgumentType(argument) {
    if (
      argument.type !== "number" ||
      argument.value < 0 ||
      argument.value > 100
    ) {
      throw "Argumento inválido. Debe ser un número entre 0 y 100.";
    }
  }

  function parser(tokens) {
    var AST = {
      type: "Drawing",
      body: [],
    };

    // extract a token at a time as current_token. Loop until we are out of tokens.
    while (tokens.length > 0) {
      var current_token = tokens.shift();

      if (current_token?.type === "number") {
        throw "La entrada necesita un comando para aplicar valores";
      }

      if (current_token?.type === "word") {
        switch (current_token.value) {
          case "Papel":
            var expression = {
              type: "CallExpression",
              name: "Papel",
              arguments: [],
            };
            // if current token is CallExpression of type Papel,
            // next token should be color argument
            var argument = tokens.shift();
            if (argument?.type === "number") {
              checkArgumentType(argument);
              // add argument information to expression object
              expression.arguments.push({
                type: "NumberLiteral",
                value: argument.value,
              });
              // push the expression object to body of our AST
              AST.body.push(expression);
            } else {
              throw "El comando 'Papel' debe ir acompañado de un numero [0-100]";
            }
            break;

          case "Tinta":
            var expression = {
              type: "CallExpression",
              name: "Tinta",
              arguments: [],
            };
            // if current token is CallExpression of type Tinta,
            // next token should be color argument
            var argument = tokens.shift();
            if (argument?.type === "number") {
              checkArgumentType(argument);
              // add argument information to expression object
              expression.arguments.push({
                type: "NumberLiteral",
                value: argument.value,
              });
              // push the expression object to body of our AST
              AST.body.push(expression);
            } else {
              throw "El comando 'Tinta' debe ir acompañado de un numero [0-100]";
            }
            break;

          case "Linea":
            var expression = {
              type: "CallExpression",
              name: "Linea",
              arguments: [],
            };
            // if current token is CallExpression of type Linea,
            // next 4 tokens should be position arguments
            for (var i = 0; i < 4; i++) {
              var argument = tokens.shift();
              if (argument?.type === "number") {
                checkArgumentType(argument);
                // add argument information to expression object
                expression.arguments.push({
                  type: "NumberLiteral",
                  value: argument.value,
                });
              } else {
                throw "El comando 'Linea' debe ir acompañado de cuatro numeros [0-100]";
              }
            }
            // push the expression object to body of our AST
            AST.body.push(expression);
            break;

          default:
            throw "No se reconoce el token " + current_token.value;
            break;
        }
      }
    }
    return AST;
  }

  /**
    ## Transformer
    Parsed sbn AST is good at describing what's hapTintaing in the code,
    but it is not useful yet to create SVG file out of it.
    For example. `Papel` is a concept only exists in sbn paradigm.
    In SVG, we might use <rect> element to represent a Papel. Transformer function
    converts sbn specific AST to SVG friendly AST.
  
    ### Parameter
    - ast `Object`: sbn abstract syntax tree created by parser function.
  
    ### Return
    svg_ast object (another AST suited for SVG format)
    ```
    input: {
      type: "Drawing",
      "body": [{
        "type": "CallExpression",
        "name": "Papel",
        "arguments": [
          {
            "type": "number",
            "value": "100"
          }
        ]
      }]
    }
    output: {
      "tag": "svg",
      "attr": {
        "width": 100,
        "height": 100,
        "viewBox": "0 0 100 100",
        "xmlns": "http://www.w3.org/2000/svg",
        "version": "1.1"
      },
      "body": [{
        "tag": "rect",
        "attr": {
          "x": 0,
          "y": 0,
          "width": 100,
          "height": 100,
          "fill": "rgb(0%, 0%, 0%)"
        }
      }]
    }
    ```
  
    ### Notes
    color code 100 means 100% black === rgb(0%, 0%, 0%)
  */

  function transformer(ast) {
    var svg_ast = {
      tag: "svg",
      attr: {
        width: 100,
        height: 100,
        viewBox: "0 0 100 100",
        xmlns: "http://www.w3.org/2000/svg",
        version: "1.1",
      },
      body: [],
    };

    var Tinta_color = 100; // default Tinta color is black

    // Extract a call expression at a time as `node`.
    // Loop until we are out of expressions in body.
    while (ast.body.length > 0) {
      var node = ast.body.shift();
      switch (node.name) {
        case "Papel":
          var Papel_color = 100 - node.arguments[0].value;
          // add rect element information to svg_ast's body
          svg_ast.body.push({
            tag: "rect",
            attr: {
              x: 0,
              y: 0,
              width: 100,
              height: 100,
              fill:
                "rgb(" +
                Papel_color +
                "%," +
                Papel_color +
                "%," +
                Papel_color +
                "%)",
            },
          });
          break;
        case "Tinta":
          // keep current Tinta color in `Tinta_color` variable
          Tinta_color = 100 - node.arguments[0].value;
          break;
        case "Linea":
          // add line element information to svg_ast's body
          svg_ast.body.push({
            tag: "line",
            attr: {
              x1: node.arguments[0].value,
              y1: node.arguments[1].value,
              x2: node.arguments[2].value,
              y2: node.arguments[3].value,
              "stroke-linecap": "round",
              stroke:
                "rgb(" +
                Tinta_color +
                "%," +
                Tinta_color +
                "%," +
                Tinta_color +
                "%)",
            },
          });
          break;
      }
    }

    return svg_ast;
  }

  /**
    ## Code Generator
    At the final stop of abn to avg compile process, generator function created
    SVG code based on given AST.
  
    ### Parameter
    - svg_ast `Object`: svg abstract syntax tree created by transformer function.
  
    ### Return
    SVG formatted string
    ```
    input: {
      "tag": "svg",
      "attr": {
        "width": 100,
        "height": 100,
        "viewBox": "0 0 100 100",
        "xmlns": "http://www.w3.org/2000/svg",
        "version": "1.1"
      },
      "body": [{
        "tag": "rect",
        "attr": {
          "x": 0,
          "y": 0,
          "width": 100,
          "height": 100,
          "fill": "rgb(0%, 0%, 0%)"
        }
      }]
    }
    output:
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" version="1.1">
      <rect x="0" y="0" width="100" height="100" fill="rgb(0%, 0%, 0%)"></rect>
    </svg>
    ```
  */

  function generator(svg_ast) {
    // create attributes string out of attr object
    // { "width": 100, "height": 100 } becomes 'width="100" height="100"'
    function createAttrString(attr) {
      return Object.keys(attr)
        .map(function (key) {
          return key + '="' + attr[key] + '"';
        })
        .join(" ");
    }

    // top node is always <svg>. Create attributes string for svg tag
    var svg_attr = createAttrString(svg_ast.attr);

    // for each elements in the body of svg_ast, generate svg tag
    var elements = svg_ast.body
      .map(function (node) {
        return (
          "<" +
          node.tag +
          " " +
          createAttrString(node.attr) +
          "></" +
          node.tag +
          ">"
        );
      })
      .join("\n\t");

    // wrap with oTinta and close svg tag to complete SVG code
    return "<svg " + svg_attr + ">\n" + elements + "\n</svg>";
  }

  /**
    ## Compiler
    Create sbn object with lexer, parser, transformer, and generator methods.
    Also add compile method to call all 4 methods in chain.
  */
  var sbn = {};
  sbn.VERSION = "0.0.1";
  sbn.lexer = lexer;
  sbn.parser = parser;
  sbn.transformer = transformer;
  sbn.generator = generator;
  sbn.compile = function (code) {
    return this.generator(this.transformer(this.parser(this.lexer(code))));
  };

  return sbn;
});
