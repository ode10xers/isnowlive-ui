import React, { useEffect, useState, useCallback } from 'react';
import ReactHtmlParser from 'react-html-parser';
import JsxParser from 'react-jsx-parser';
import { Spin } from 'antd';

import apis from 'apis';
import Routes from 'routes';

// These are to be put as part of the config

// THese are to be put in plugins
import elementIds from '../Configs/common/elementIds.js';

// NOTE: While the ones below are React Component Definitions used for parsing
import SignInButton from 'components/PageEditorPassionComponents/SignInButton';
import PassionCourseList from 'components/PageEditorPassionComponents/CourseList';
import PassionPassList from 'components/PageEditorPassionComponents/PassList';
import PassionSubscriptionList from 'components/PageEditorPassionComponents/SubscriptionList';
import PassionVideoList from 'components/PageEditorPassionComponents/VideoList';
import PassionSessionList from 'components/PageEditorPassionComponents/SessionList';
import PassionFooter from 'components/PageEditorPassionComponents/PassionFooter';

import { isAPISuccess } from 'utils/helper.js';

const { PAGE_PORTAL_ID } = elementIds;

// TODO: Currently we're using postMessage to communicate
// See if we actually need that now that we use JsxParser
// inside our page directly
const PageRenderer = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(true);

  const [pageContent, setPageContent] = useState(null);
  const [pageStyles, setPageStyles] = useState(null);

  const fetchAndLoadPage = useCallback(async () => {
    setIsLoading(true);

    try {
      const pageSlug = window.location.pathname.split('/')[1] ?? '';

      const { status, data } =
        pageSlug === ''
          ? await apis.custom_pages.getPublicHomepage()
          : await apis.custom_pages.getPublicPageBySlug(pageSlug);

      if (isAPISuccess(status) && data) {
        document.title = data.page.name;
        setPageContent(`
            ${data.header.html}
            ${data.page.content.html}
            ${data.footer.html}
          `);
        // TODO: There's bound to be duplicate stylings here, see if we can optimize later
        // or if any issues arise here
        setPageStyles(`<style>
            ${data.header.css}
            ${data.page.content.css}
            ${data.footer.css}
          </style>`);
      }
    } catch (error) {
      console.error(error);
      history.push(Routes.root);
    }

    setIsLoading(false);
  }, [history]);

  useEffect(() => {
    fetchAndLoadPage();
  }, [fetchAndLoadPage]);

  return (
    <Spin spinning={isLoading}>
      <div id={PAGE_PORTAL_ID}>
        {pageStyles && ReactHtmlParser(pageStyles)}
        {pageContent && (
          <JsxParser
            showWarnings={true}
            allowUnknownElements={false}
            components={{
              SignInButton, // Used in header
              PassionCourseList,
              PassionPassList,
              PassionSessionList,
              PassionSubscriptionList,
              PassionVideoList,
              PassionFooter, // The footer component
            }}
            jsx={pageContent}
          />
        )}
      </div>
    </Spin>
  );
};

export default PageRenderer;
