console.log('hello world')
// index.js
function getLocalHtml(src) {
  const anchor = document.currentScript; // the inline <script> calling this

  return fetch(src)
    .then((response) => response.text())
    .then((html) => {
      anchor.insertAdjacentHTML("beforebegin", html);
      anchor.remove(); // remove the script tag after inserting
    });
}
