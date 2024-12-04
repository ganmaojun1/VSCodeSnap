'use strict';

const vscode = require('vscode');
const path = require('path');
const {
  homedir
} = require('os');
const {
  readHtml,
  writeFile,
  getSettings
} = require('./util');

const getConfig = () => {
  const editorSettings = getSettings('editor', ['fontLigatures', 'tabSize', 'letterSpacing']);
  const editor = vscode.window.activeTextEditor;
  if (editor) editorSettings.tabSize = editor.options.tabSize;

  const extensionSettings = getSettings('vscodesnap', [
    'backgroundPalette',
    'containerBackground',
    'boxShadow',
    'containerPadding',
    'windowBorderRadius',
    'windowControlStyle',
    'showWindowTitle',
    'windowTitleStyle',
    'windowTitleCustomStyle',
    'showLineNumbers',
    'realLineNumbers',
    'transparentBackground',
    'target',
    'trimEmptyLines'
  ]);

  const selection = editor && editor.selection;
  const startLine = extensionSettings.realLineNumbers ? (selection ? selection.start.line : 0) : 0;

  let windowTitle = '';
  if (editor && extensionSettings.showWindowTitle) {
    {
      if(extensionSettings.windowTitleStyle ==="Workspace + Filename")
      {
        const activeFileName = editor.document.uri.path.split('/').pop();
        windowTitle = `${vscode.workspace.name} - ${activeFileName}`;
      }
      if(extensionSettings.windowTitleStyle ==="Filename")
      {
        const activeFileName = editor.document.uri.path.split('/').pop();
        windowTitle = `${activeFileName}`;
      }
      if(extensionSettings.windowTitleStyle ==="Custom")
      {
        windowTitle = extensionSettings.windowTitleCustomStyle;
      }
    }
  }

  applyBackgroundPalettes(extensionSettings);

  return {
    ...editorSettings,
    ...extensionSettings,
    startLine,
    windowTitle
  };
};

const createPanel = async (context) => {
  const panel = vscode.window.createWebviewPanel(
    'VSCodeSnap',
    'VSCodeSnap 📸', {
      viewColumn: vscode.ViewColumn.Beside,
      preserveFocus: true
    }, {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(context.extensionPath)]
    }
  );
  panel.webview.html = await readHtml(
    path.resolve(context.extensionPath, 'webview/index.html'),
    panel
  );

  return panel;
};

let lastUsedImageUri = vscode.Uri.file(path.resolve(homedir(), 'Desktop/code.png'));
const saveImage = async (data) => {
  const uri = await vscode.window.showSaveDialog({
    filters: {
      Images: ['png']
    },
    defaultUri: lastUsedImageUri
  });
  lastUsedImageUri = uri;
  uri && writeFile(uri.fsPath, Buffer.from(data, 'base64'));
};

const hasOneSelection = (selections) =>
  selections && selections.length === 1 && !selections[0].isEmpty;

const runCommand = async (context) => {
  const panel = await createPanel(context);

  const update = async () => {
    await vscode.commands.executeCommand('editor.action.clipboardCopyWithSyntaxHighlightingAction');
    panel.webview.postMessage({
      type: 'update',
      ...getConfig()
    });
  };

  const flash = () => panel.webview.postMessage({
    type: 'flash'
  });

  panel.webview.onDidReceiveMessage(async ({
    type,
    data
  }) => {
    if (type === 'save') {
      flash();
      await saveImage(data);
    } else {
      vscode.window.showErrorMessage(`VSCodeSnap 📸: Unknown shutterAction "${type}"`);
    }
  });

  const selectionHandler = vscode.window.onDidChangeTextEditorSelection(
    (e) => hasOneSelection(e.selections) && update()
  );
  panel.onDidDispose(() => selectionHandler.dispose());

  const editor = vscode.window.activeTextEditor;
  if (editor && hasOneSelection(editor.selections)) update();
};

module.exports.activate = (context) =>
  context.subscriptions.push(
    vscode.commands.registerCommand('vscodesnap.start', () => runCommand(context))
  );

function applyBackgroundPalettes(extensionSettings) {
  switch (extensionSettings.backgroundPalette) {
    case 'magnum':
      extensionSettings.containerBackground = "linear-gradient(140deg, rgb(207, 47, 152), rgb(106, 61, 236))";
      break;
    case 'pinky':
      extensionSettings.containerBackground = "linear-gradient(140deg, rgb(165, 142, 251), rgb(233, 191, 248))";
      break;
    case 'passion':
      extensionSettings.containerBackground = "linear-gradient(140deg, rgb(255, 99, 99), rgb(115, 52, 52))";
      break;
    case 'steel':
      extensionSettings.containerBackground = "linear-gradient(140deg, rgb(189, 227, 236), rgb(54, 54, 84))";
      break;
    case 'tropic':
      extensionSettings.containerBackground = "linear-gradient(140deg, rgb(89, 212, 153), rgb(160, 135, 45))";
      break;
    case 'forest':
      extensionSettings.containerBackground = "linear-gradient(140deg, rgb(76, 200, 200), rgb(32, 32, 51))";
      break;
    case 'blueman':
      extensionSettings.containerBackground = "linear-gradient(140deg, rgb(142, 199, 251), rgb(28, 85, 170))";
      break;
    case 'sand':
      extensionSettings.containerBackground = "linear-gradient(140deg, rgb(255, 207, 115), rgb(255, 122, 47))";
      break;
  }
}
