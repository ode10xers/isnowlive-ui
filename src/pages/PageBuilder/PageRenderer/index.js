import React, { useEffect, useState, useCallback } from 'react';
import ReactHtmlParser from 'react-html-parser';
import JsxParser from 'react-jsx-parser';
import { Spin } from 'antd';

// NOTE : We can also take the scss approach, we'll see
import 'grapesjs/dist/css/grapes.min.css';
// import 'grapesjs-blocks-flexbox';
import grapesjs from 'grapesjs';
import 'grapesjs-preset-webpage';

import apis from 'apis';
import Routes from 'routes';

// These are to be put as part of the config

// THese are to be put in plugins
import elementIds from '../Configs/common/elementIds.js';
import sectionIds from '../Configs/common/sectionIds';
import commonEditorConfig from '../Configs/common/config';

// NOTE: These are component definitions to be used by GrapesJS
import CustomTraits from '../Configs/traits';
import CustomCommands from '../Configs/commands';
import ReactComponentHandler from '../ReactComponentHandler';
import SimpleTextSection from '../CustomComponents/SimpleTextSection.js';
import SimpleTextWithImage from '../CustomComponents/SimpleTextWithImage.js';
import PassionProductsList from '../CustomComponents/PassionProductsList.js';
import EditorLinkButton from '../CustomComponents/LinkButton.js';
import EditorHeader from '../CustomComponents/Header.js';
import EditorFooter from '../CustomComponents/Footer.js';
import EditorContainer from '../CustomComponents/Container.js';
import Testimonials from '../CustomComponents/Testimonials.js';

// NOTE: While the ones below are React Component Definitions used for parsing
import SignInButton from 'components/PageEditorPassionComponents/SignInButton';
import PassionCourseList from 'components/PageEditorPassionComponents/CourseList';
import PassionPassList from 'components/PageEditorPassionComponents/PassList';
import PassionSubscriptionList from 'components/PageEditorPassionComponents/SubscriptionList';
import PassionVideoList from 'components/PageEditorPassionComponents/VideoList';
import PassionSessionList from 'components/PageEditorPassionComponents/SessionList';
import PassionFooter from 'components/PageEditorPassionComponents/PassionFooter';

import { isAPISuccess } from 'utils/helper.js';

import styles from './style.module.scss';

const { BUILDER_CONTAINER_ID, PAGE_PORTAL_ID } = elementIds;

const { EDITOR } = sectionIds;

const PageRenderer = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [gjsEditor, setGjsEditor] = useState(null);

  const [pageContent, setPageContent] = useState(null);
  const [pageStyles, setPageStyles] = useState(null);

  const fetchAndLoadPage = useCallback(
    async (editor) => {
      setIsLoading(true);

      const parseAsArray = (data) => {
        const parsedData = JSON.parse(data);
        return Array.isArray(parsedData) ? parsedData : [parsedData];
      };

      try {
        const pageSlug = window.location.pathname.split('/')[1] ?? '';

        const { status, data } =
          pageSlug === ''
            ? await apis.custom_pages.getPublicHomepage()
            : await apis.custom_pages.getPublicPageBySlug(pageSlug);

        if (isAPISuccess(status) && data) {
          editor.loadData({
            components: [
              ...parseAsArray(data.header.components),
              ...parseAsArray(data.page.content.components),
              ...parseAsArray(data.footer.components),
            ],
            styles: [
              ...parseAsArray(data.header.styles),
              ...parseAsArray(data.page.content.styles),
              ...parseAsArray(data.footer.styles),
            ],
          });

          document.title = data.page.name;
          setGjsEditor(editor);
        }
      } catch (error) {
        console.error(error);
        history.push(Routes.root);
      }

      setIsLoading(false);
    },
    [history]
  );

  // GrapesJS initialization
  const initializeGrapesJSEditor = useCallback(() => {
    // NOTE: Configuration object examples can be seen here
    // https://github.com/artf/grapesjs/blob/master/src/dom_components/model/Component.js

    // TODO: Export this config and separate it into parts
    // Since it's also going to be used in HeaderEditor and FooterEditor
    // When rendering in public [age]
    const editor = grapesjs.init({
      ...commonEditorConfig,
      // Indicate where to init the editor. You can also pass an HTMLElement
      // Get the content for the canvas directly from the element
      // As an alternative we could use: `components: '<h1>Hello World Component!</h1>'`,
      // fromElement: true,
      // Size of the editor
      noticeOnUnload: false,
      wrapperIsBody: false,
      height: '0',
      storageManager: {},
      assetManager: {},
      selectorManager: {},
      styleManager: {},
      traitManager: {},
      layerManager: {},
      blockManager: {},
      deviceManager: {
        devices: [
          {
            name: 'Desktop',
            width: '', // default size
          },
          {
            name: 'Tablet',
            width: '768px', // this value will be used on canvas width
            widthMedia: '768px', // this value will be used in CSS @media
          },
          {
            name: 'Mobile',
            width: '426px', // this value will be used on canvas width
            widthMedia: '576px', // this value will be used in CSS @media
          },
        ],
      },
      plugins: [
        'gjs-preset-webpage',
        ReactComponentHandler,
        CustomTraits,
        CustomCommands,
        EditorContainer,
        PassionProductsList,
        SimpleTextSection,
        SimpleTextWithImage,
        EditorLinkButton,
        // SignInButton,
        EditorHeader,
        EditorFooter,
        Testimonials,
        SimpleTextWithImage,
        SimpleTextSection,
      ],
      pluginsOpts: {
        'gjs-preset-webpage': {
          modalImportLabel: 'This is the data format that will be saved',
          modalImportButton: 'Save',
          modalImportContent: (editor) => {
            return JSON.stringify({
              html: editor.getHtml(),
              css: editor.getCss(),
              components: editor.getComponents(),
              styles: editor.getStyle(),
            });
          },
          blocksBasicOpts: {
            flexGrid: true,
            rowHeight: '120px',
          },
          countdownOpts: 0,
          navbarOpts: 0,
          // customStyleManager: definedStylePanels,
        },
      },
    });

    editor.runCommand('core:preview');

    fetchAndLoadPage(editor);
  }, [fetchAndLoadPage]);

  useEffect(() => {
    initializeGrapesJSEditor();
  }, [initializeGrapesJSEditor]);

  useEffect(() => {
    if (gjsEditor) {
      gjsEditor.onReady(() => {
        // Previously what we do is try to render everything inside the iframe
        // of the editor, but it might cause some issues when integrating
        // Now we instead take the contents of editor after load and put them
        // in the actual app (which is contained in #root)
        const targetContent = `
          ${gjsEditor.getHtml()}
        `;

        setPageContent(targetContent);
        console.log(gjsEditor.getCss());
        setPageStyles(`<style>${gjsEditor.getCss()}</style>`);
        // const iframeElement = gjsEditor.Canvas.getDocument();
        // const editorElements = Array.from(iframeElement.body.children);

        // if (editorElements.length > 0) {
        //   const reactRootElement = document.getElementById('root');
        //   const portalContainer = document.getElementById(PAGE_PORTAL_ID);

        //   // TODO: These things conflict each other, see a better way
        //   // As of now, in order to support our component and flows
        //   // We must not clone node
        //   // This however results in editor events still attached
        //   editorElements.forEach((el) => {
        //     // portalContainer.appendChild(el.cloneNode(true));
        //     portalContainer.appendChild(el);
        //   });

        //   reactRootElement.appendChild(portalContainer);
        // }

        setIsLoading(false);
      });
    }
  }, [gjsEditor]);

  return (
    <Spin spinning={isLoading}>
      <div style={{ display: 'none' }}>
        <div id={EDITOR} className={styles.builderPage}>
          <div className={styles.middleSection}>
            <div id={BUILDER_CONTAINER_ID}></div>
          </div>
        </div>
      </div>
      <div id={PAGE_PORTAL_ID}>
        {pageStyles && ReactHtmlParser(pageStyles)}
        {pageContent && (
          <JsxParser
            showWarnings={true}
            allowUnknownElements={false}
            components={{
              SignInButton,
              PassionCourseList,
              PassionPassList,
              PassionSessionList,
              PassionSubscriptionList,
              PassionVideoList,
              PassionFooter,
            }}
            jsx={pageContent}
          />
        )}
      </div>
    </Spin>
  );
};

export default PageRenderer;
