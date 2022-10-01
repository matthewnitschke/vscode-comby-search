import * as vscode from 'vscode';

import { extname } from 'path';

export function getCombyLanguage() {
    let currentFileName = vscode.window.activeTextEditor?.document.fileName;
    if (currentFileName == null) return '.generic';

    let currentExt = extname(currentFileName);

    let knownCombyLanguages = ['.s', '.sh', '.c', '.cs', '.clj', '.css', '.dart', '.elm', '.erl', '.ex', '.html', '.hs', '.go', '.java', '.js', '.json', '.jl', '.tex', '.ml', '.php', '.py', '.re', '.rb', '.rs', '.scala', '.sql', '.swift', '.xml', '.txt']
    
    if (knownCombyLanguages.includes(currentExt)) {
        return currentExt;
    }
    
    return '.generic';
}