import React, { useCallback, useEffect } from 'react';

import EmailEditor from 'react-email-editor';

const emptyTemplate = {
  counters: {
    u_column: 1,
    u_row: 1,
  },
  body: {
    rows: [],
    values: {
      textColor: '#000000',
      backgroundColor: '#ffffff',
      backgroundImage: {
        url: '',
        fullWidth: true,
        repeat: false,
        center: true,
        cover: false,
      },
      contentWidth: '800px',
      contentAlign: 'center',
      fontFamily: {
        label: 'Arial',
        value: 'arial,helvetica,sans-serif',
      },
      preheaderText: '',
      linkStyle: {
        body: true,
        linkColor: '#0000ee',
        linkHoverColor: '#0000ee',
        linkUnderline: true,
        linkHoverUnderline: true,
      },
      _meta: {
        htmlID: 'u_body',
        htmlClassNames: 'u_body',
      },
    },
  },
  schemaVersion: 6,
};

// the Unlayer behaves very weirdly
// For some reason it works if
// 1) onLoad, we load a template (in this case emptyTemplate is used)
// 2) We then reset it into blanks and set the body value using the object below
const initialEditorBodyTemplate = {
  backgroundColor: '#ffffff',
  contentWidth: '800px',
};

// NOTE: When using this, we need to create a ref in the parent component
// Later we can access methods in the Unlayer Editor through that ref
// Also a helper method "resetEditorContent" is added in the ref
// so we can programmatically reset it
// You can see examples of using this ref in SendAudienceEmailModal
const UnlayerEmailEditor = React.forwardRef((props, ref) => {
  const resetEditorContent = useCallback(() => {
    if (ref.current?.editor) {
      ref.current.editor.loadBlank(initialEditorBodyTemplate);
      ref.current.editor.setBodyValues(initialEditorBodyTemplate);
    }
  }, [ref]);

  const adjustEditorIframeMinSize = () => {
    const editorId = ref.current.editorId;
    const editorElement = document.getElementById(editorId);
    // NOTE: the Unlayer iframe has a default min-width value of 1024px
    // We can override it here to squish the iframe so it fits in the modal
    editorElement.querySelector('iframe').style.minWidth = '1024px';
    editorElement.querySelector('iframe').style.minHeight = '700px';
  };

  const handleEditorLoad = () => {
    /*
      TODO: Find better way to solve this
      The problem here is that for some reason, the second time
      this component is mounted, this function is called too fast
      while the ref is not yet set properly

      Currently the solution is to delay the logic in this function
      hoping that by the time it runs, the ref.current value is not null
    */
    setTimeout(() => {
      adjustEditorIframeMinSize();
      // The Unlayer behaves weirdly that we have to loadDesign first
      // Then reset it so that we can "apply" some default body values
      ref.current.editor.loadDesign(emptyTemplate);
      resetEditorContent();
    }, 2000);
  };

  useEffect(() => {
    if (ref.current) {
      ref.current.resetEditorContent = resetEditorContent;
    }
  }, [ref, resetEditorContent]);

  if (!ref) {
    console.error('A ref is required to use this component');
    return null;
  }

  return (
    <EmailEditor
      // Customizing their editor with CSS requires premium
      options={{
        features: {
          textEditor: {
            // Disable clean paste to keep formatting on paste
            cleanPaste: false,
          },
        },
      }}
      appearance={{ theme: 'dark' }}
      safeHtml={true}
      ref={ref}
      onLoad={handleEditorLoad}
    />
  );
});

export default UnlayerEmailEditor;
