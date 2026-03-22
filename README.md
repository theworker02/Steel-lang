Steel is a simple, readable programming language designed to be easy to learn and intuitive to use.

It focuses on clean syntax, minimal complexity, and fast execution through a custom JavaScript interpreter.





 Features:
• 🧠 Human-readable syntax
• ⚡ Lightweight interpreter (Node.js)
• 🧱 Simple variable system
• 🔁 Control flow (if statements, loops)
• 💬 Built-in output (say)
• 🎨 VS Code syntax highlighting support
• 🔧 Easy to extend and modify




Project Structure:

steel-lang/
├── src/ # Language engine
│ ├── lexer.js
│ ├── parser.js
│ ├── interpreter.js
│ ├── environment.js
│ └── index.js
├── examples/ # Example programs
│ ├── hello.steel
│ ├── logic.steel
│ └── variables.steel
├── stl/ # VS Code extension
│ ├── syntaxes/
│ ├── icons/
│ └── package.json
└── README.md





🚀 Getting Started

Clone the repository

1. git clone https://github.com/theworker02/steel-lang.git

2. cd steel-lang



Run a Steel program

3. "node src/index.js examples/hello.steel"


🧪 Example:

set x to 10

if x > 5 then
say "Steel is working!"
end




🧩 VS Code Extension:

Steel includes a custom VS Code extension for syntax highlighting.

Run locally: “cd stl”

Then open the folder in VS code and press: F5


🎯 Goals:

• Keep syntax simple and readable
• Build a fully custom language ecosystem
• Add functions, modules, and advanced features
• Expand tooling (CLI, debugger, autocomplete)



🛠️ Future Plans:

• CLI command (steel run file.steel)
• Error handling improvements
• Function system
• Package manager (maybe 👀)
• Full VS Code integration (IntelliSense)


🤝 Contributing:

Pull requests are welcome. This project is actively evolving and is considered to me still a work in progress. A lot has to be done honestly.

License: MIT License

Author: theworker02

⚙️ Status:

🚧 Early Development/Work in progress, but fully functional

