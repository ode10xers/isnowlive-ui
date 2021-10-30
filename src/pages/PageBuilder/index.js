import React, { useEffect, useState, useCallback } from 'react';

// NOTE : We can also take the scss approach, we'll see
import 'grapesjs/dist/css/grapes.min.css';
import grapesjs from 'grapesjs';

import definedBlocks from './blocks.js';
import stylePanelSectors from './style_panel.js';

//eslint-disable-next-line
import styles from './style.module.scss';

const PageBuilder = ({ match, history }) => {
  const [gjsEditor, setGjsEditor] = useState(null);

  const initializeGrapesJSEditor = useCallback(() => {
    // NOTE: Configuration object examples can be seen here
    // https://github.com/artf/grapesjs/blob/master/src/dom_components/model/Component.js

    const editor = grapesjs.init({
      // Indicate where to init the editor. You can also pass an HTMLElement
      container: '#builder-editor',
      // Get the content for the canvas directly from the element
      // As an alternative we could use: `components: '<h1>Hello World Component!</h1>'`,
      fromElement: true,
      // Size of the editor
      height: '100vh',
      width: 'auto',
      // Disable the storage manager for the moment
      storageManager: false,
      keepUnusedStyles: false,
      // Avoid any default panel
      // panels: { defaults: [] },
      // Built-in props for styles
      // https://grapesjs.com/docs/modules/Style-manager.html#built-in-properties
      styleManager: {
        sectors: stylePanelSectors,
      },
      blockManager: {
        blocks: definedBlocks,
      },
    });

    // editor.Panels.addPanel({
    //   id: 'panel-top',
    //   el: '.panel__top',
    // });
    // editor.Panels.addPanel({
    //   id: 'basic-actions',
    //   el: '.panel__basic-actions',
    //   buttons: [
    //     {
    //       id: 'visibility',
    //       active: true, // active by default
    //       className: 'btn-toggle-borders',
    //       label: '<u>B</u>',
    //       command: 'sw-visibility', // Built-in command
    //     },
    //     {
    //       id: 'export',
    //       className: 'btn-open-export',
    //       label: 'Exp',
    //       command: 'export-template',
    //       context: 'export-template', // For grouping context of buttons from the same panel
    //     },
    //     {
    //       id: 'show-json',
    //       className: 'btn-show-json',
    //       label: 'JSON',
    //       context: 'show-json',
    //       command(editorInstance) {
    //         editorInstance.Modal.setTitle('Components JSON')
    //           .setContent(
    //             `<textarea style="width:100%; height: 250px;">
    //             ${JSON.stringify(editor.getComponents())}
    //           </textarea>`
    //           )
    //           .open();
    //       },
    //     },
    //     {
    //       id: 'export-html',
    //       className: 'btn-export-html',
    //       label: 'HTML',
    //       context: 'export-html',
    //       command(editorInstance) {
    //         console.log(editorInstance.getHtml());
    //       },
    //     },
    //   ],
    // });

    setGjsEditor(editor);
  }, []);

  useEffect(() => {
    initializeGrapesJSEditor();
  }, [initializeGrapesJSEditor]);

  return (
    <div id="builder-page">
      <div className="panel__top">
        <div className="panel__basic-actions"></div>
      </div>
      <div id="builder-editor">
        <h1> Hello World Component Here </h1>
        <p> This is the default template for the editor canvas </p>
      </div>
      <div id="builder-blocks"></div>
    </div>
  );
};

export default PageBuilder;
