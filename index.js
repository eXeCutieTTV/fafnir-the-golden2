console.log('hello world');
function getLocalHtml(src) {
  const anchor = document.currentScript;

  return fetch(src)
    .then((r) => r.text())
    .then((html) => {
      const tpl = document.createElement("template");
      tpl.innerHTML = html;

      // Recreate script tags so browser executes them
      for (const oldScript of tpl.content.querySelectorAll("script")) {
        const newScript = document.createElement("script");
        for (const { name, value } of oldScript.attributes) {
          newScript.setAttribute(name, value);
        }
        newScript.textContent = oldScript.textContent;
        oldScript.replaceWith(newScript);
      }

      anchor.before(tpl.content);
      anchor.remove();
    });
}


globalThis.getLocalHtml = getLocalHtml;

//load default css vv
const defaultStyle = [
  '/index.css',
  '/css/colors.css',
  '/css/main.css',
  '/css/mixed.css',
  '/css/tables.css',
  '/css/text.css'
];
function loadCSS(href) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}
for (const style of defaultStyle) loadCSS(style);

//load default css ^^