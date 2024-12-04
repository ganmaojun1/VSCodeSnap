import { $, $$, setVar, calcTextWidth } from './util.js';

const snippetNode = $('#snippet');

const setupLines = (node, config) => {
  $$(':scope > br', node).forEach((row) => (row.outerHTML = '<div>&nbsp;</div>'));

  const rows = $$(':scope > div', node);
  setVar('line-number-width', calcTextWidth(rows.length + config.startLine));

  rows.forEach((row, idx) => {
    const newRow = document.createElement('div');
    newRow.classList.add('line');
    row.replaceWith(newRow);

    if (config.showLineNumbers) {
      const lineNum = document.createElement('div');
      lineNum.classList.add('line-number');
      lineNum.textContent = idx + 1 + config.startLine;
      newRow.appendChild(lineNum);
    }

    const lineCodeDiv = document.createElement('div');
    lineCodeDiv.classList.add('line-code');

    if (row.innerHTML.trim()) {
      const lineCode = document.createElement('span');
      lineCode.innerHTML = row.innerHTML;
      lineCodeDiv.appendChild(lineCode);
      lineCode.addEventListener("click", toggleLineHighlight);
    } else {
      const lineCode = document.createElement('span');
      lineCode.innerHTML = '&nbsp;';
      lineCodeDiv.appendChild(lineCode);
    }

    newRow.appendChild(lineCodeDiv);
  });
};

const stripInitialIndent = (node) => {
  const regIndent = /^(\s+)/u;
  const initialSpans = $$(':scope > div', node);
  const indents = initialSpans
    .map(span => {
      const match = span.innerHTML.match(regIndent);
      return match ? match[1].length : 0;
    })
    .filter(len => len > 0);

  if (indents.length === 0) return;

  const minIndent = Math.min(...indents);
  if (minIndent === 0) return;

  initialSpans.forEach(span => {
    const match = span.innerHTML.match(regIndent);
    if (match && match[1].length >= minIndent) {
      span.innerHTML = span.innerHTML.slice(minIndent);
    }
  });
};

const isEmptyLine = (node) => node.innerText.match(/^\s*$/);

const trimEmptyLines = (node, config) => {
  while(isEmptyLine(node.firstChild)) {
    node.removeChild(node.firstChild);
    if(config.realLineNumbers) config.startLine++;
  }
  while(isEmptyLine(node.lastChild)) node.removeChild(node.lastChild);
}

const getClipboardHtml = (clip) => {
  const html = clip.getData('text/html');
  if (html) return html;
  const text = clip
    .getData('text/plain')
    .split('\n')
    .map((line) => `<div>${line}</div>`)
    .join('');
  return `<div>${text}</div>`;
};

export const pasteCode = (config, clipboard) => {
  snippetNode.innerHTML = getClipboardHtml(clipboard);
  const code = $('div', snippetNode);
  snippetNode.style.fontSize = code.style.fontSize;
  snippetNode.style.lineHeight = code.style.lineHeight;
  snippetNode.innerHTML = code.innerHTML;
  stripInitialIndent(snippetNode);
  if(config.trimEmptyLines) trimEmptyLines(snippetNode, config);
  setupLines(snippetNode, config);
};


function toggleLineHighlight(e) {
  if(this.parentNode.parentNode.classList.contains("line-highlight")) {
    this.parentNode.parentNode.classList.remove("line-highlight");
    this.parentNode.parentNode.classList.add("line-highlight-git-add");
    this.parentNode.parentNode.firstChild.classList.add('line-number-highlight')
  } else if (this.parentNode.parentNode.classList.contains("line-highlight-git-add")) {
    this.parentNode.parentNode.classList.remove("line-highlight-git-add");
    this.parentNode.parentNode.classList.add("line-highlight-git-remove");
    this.parentNode.parentNode.firstChild.classList.add('line-number-highlight')
  } else if (this.parentNode.parentNode.classList.contains("line-highlight-git-remove")) {
    this.parentNode.parentNode.classList.remove("line-highlight");
    this.parentNode.parentNode.classList.remove("line-highlight-git-add");
    this.parentNode.parentNode.classList.remove("line-highlight-git-remove");
    this.parentNode.parentNode.firstChild.classList.remove('line-number-highlight')
  } else {
    this.parentNode.parentNode.classList.add("line-highlight");
    this.parentNode.parentNode.classList.remove("line-highlight-git-add");
    this.parentNode.parentNode.classList.remove("line-highlight-git-remove");
    this.parentNode.parentNode.firstChild.classList.add('line-number-highlight')
  }
};