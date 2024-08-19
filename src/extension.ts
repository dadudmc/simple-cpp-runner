import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    const runCpp = async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }

        const document = editor.document;
        if (document.languageId !== 'cpp') {
            vscode.window.showErrorMessage('The current file is not a C++ file.');
            return;
        }

        const filePath = document.fileName;
        const fileDir = path.dirname(filePath);
        const fileName = path.basename(filePath);
        const fileBaseName = path.parse(fileName).name;

        // Save the document
        if (document.isDirty) {
            try {
                await document.save();
            } catch (error) {
                vscode.window.showErrorMessage('Failed to save the document.');
                return;
            }
        }

        // Create or show the terminal
        const terminal = vscode.window.activeTerminal || vscode.window.createTerminal({
            name: 'C++ Runner',
            shellPath: '/bin/bash',
            shellArgs: ['--login']
        });
        terminal.show();

        // Create a temporary hidden shell script to run the commands
        const scriptPath = path.join(fileDir, `.${fileBaseName}_run.sh`);
        const scriptContent = `
            #!/bin/bash
            clear  # Clear the terminal screen at the start
            cd "${fileDir}"
            if [ -f ${fileBaseName} ]; then
                rm ${fileBaseName}  # Remove the old binary if it exists
            fi
            g++ -o ${fileBaseName} ${fileName}
            if [ $? -eq 0 ]; then
                ./${fileBaseName}
            else
                echo "Compilation failed."
            fi
            echo ""  # Add a newline for better separation
            rm "${scriptPath}"
        `;

        // Write the script to the file system
        fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });

        // Run the script in the terminal
        terminal.sendText(`bash "${scriptPath}"`, true);
    };

    // Register the command
    const disposable = vscode.commands.registerCommand('extension.runCpp', runCpp);
    context.subscriptions.push(disposable);

    // Handle activation events
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && editor.document.languageId === 'cpp') {
            // Update command availability if necessary
        }
    });
}

export function deactivate() {}