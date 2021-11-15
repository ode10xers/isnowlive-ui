import { googleFonts } from 'utils/constants.js';

export const customEditorInitializationLogic = (editor) => {
  const editorCanvas = editor.Canvas;

  // Loading external script and running certain logic
  // inside iframe. In this case it's loading the fonts
  // using WebFontLoader so the fonts are also visible
  // inside the iframes
  const iframeHead = editorCanvas.getDocument().head;
  const libScript = document.createElement('script');
  libScript.innerHTML = `
      WebFontConfig = {
        google: {
          families: ${JSON.stringify(Object.values(googleFonts))},
        }
      };

      (function(d) {
        var wf = d.createElement('script'), s = d.scripts[0];
        wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js';
        wf.async = true;
        s.parentNode.insertBefore(wf, s);
      })(document);
    `;
  iframeHead.appendChild(libScript);

  // Hacky way of copying styles to the iframe inside
  // Not sure if this will work dynamically or not
  const iframeEl = editorCanvas.getWindow();
  const styleEls = iframeEl.parent.document.querySelectorAll("[type='text/css'], [rel='stylesheet']");
  styleEls.forEach((el) => {
    iframeEl.document.head.appendChild(el.cloneNode(true));
  });
};
