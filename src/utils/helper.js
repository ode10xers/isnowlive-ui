const appendScript = (src, charset) => {
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  if (charset) {
    script.charset = charset;
  }
  if (document.querySelectorAll(`script[src="${src}"]`).length !== 0) {
    document.querySelectorAll(`script[src="${src}"]`)[0].remove();
  }
  document.body.appendChild(script);
};

export const parseEmbedCode = (parsedItem) => {
  if (Array.isArray(parsedItem)) {
    return parsedItem?.map((el) => {
      if (el.type === 'script') {
        appendScript(el.props.src, el.props.charset);
        return null;
      }
      return el;
    });
  } else {
    return parsedItem;
  }
};
