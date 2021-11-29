# Code Editor and Interpreter

Many Code 4 Community Modules need a solution to create a simple custom programming language that interfaces with Phaser or another JS package along with an editor that can be inserted into HTML.  This project intends to standardize this project and make creating a simple language and editor easy.  This project can be used with both Phaser and non-Phaser projects as seen in the examples directory.

## Using this library
1.  Install this library in your project. You can do that from github or from a local directory. For local development, the directory is best. These exact commands may not work.

        npm install --save code4community/code-editor-and-interpreter
        
    OR
    
        npm install --save file://$HOME/school/c4c-club/code-editor-and-interpreter/

2.  Import this library where you need it.

        import C4C from 'c4c-editor-and-interpreter';

3.  Create the editor.

    ```javascript
    // Create the C4C editor, inside the given element.
    C4C.editor.create(document.body);
    ```
    
4.  Create some javascript functions you would like to expose to the this library's language. For our example, the javascript function just creates an alert.

    ```javascript
    // Define new function and store it in the symbol "alert-hello". This
    // function can now be called from our little language.
    C4C.interpreter.define("alert-hello", () => {
      alert("hello");
    });
    ```

5.  Expose some way for your user to run the interpreter. For our example, the user can just on click a sprite.

    ```javascript
    // Create some interface to running the interpreter.
    const logo = this.add.image(400, 150, 'logo');

    logo.setInteractive();
    logo.on("pointerdown", () => {
      const programText = C4C.editor.getText();
      // HERE'S THE IMPORTANT PART!!
      C4C.interpreter.run(programText);
    });
    ```

See more in our [example project](https://github.com/Code4Community/phaser3-language-example).

## Development Notes
### Helpful Links
- [CodeMirror 6](https://codemirror.net/6/)
- [Lezer](https://lezer.codemirror.net/)
- [CodeMirror 6 Bundling](https://codemirror.net/6/examples/bundle/)
- [CodeMirror 6 Styling](https://codemirror.net/6/examples/styling/)
- [Connecting Lezer to CodeMirror](https://github.com/codemirror/lang-example)
### Helpful Commands
- Bundling editor.js: `npm run bundle`

## Possible Feature
- Init command to setup project with CodeMirror, sample programming language, and sample phaser program.
- Init command to setup a project with CodeMirorr and sample programming language, but no Phaser.
- Could this be an NPM package?
- Lot of customization
    - Turn on/off for loops, while loops, if statements, elif statements, etc.
    - Specify custom statements and call backs
    - Change colors and fonts of editor
    - Change dimensions of editor

