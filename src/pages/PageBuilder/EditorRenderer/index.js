import React from 'react';
import { createPortal } from 'react-dom';

import ReactHtmlParser from 'react-html-parser';
import JsxParser from 'react-jsx-parser';

const EditorRenderer = ({ css = '', html = '', container = null, componentList = {} }) => {
  if (!container) {
    return null;
  }

  return createPortal(
    <>
      {ReactHtmlParser(`<style>${css}</style>`)}
      <JsxParser showWarnings={true} allowUnknown={false} jsx={html} components={componentList} />
    </>,
    container
  );
};

export default EditorRenderer;
