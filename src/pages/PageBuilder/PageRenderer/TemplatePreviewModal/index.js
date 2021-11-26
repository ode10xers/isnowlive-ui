import React, { useState, useEffect } from 'react';
import ReactHtmlParser from 'react-html-parser';
import JsxParser from 'react-jsx-parser';

import { Modal } from 'antd';

import PassionCourseList from 'components/PageEditorPassionComponents/CourseList';
import PassionPassList from 'components/PageEditorPassionComponents/PassList';
import PassionSubscriptionList from 'components/PageEditorPassionComponents/SubscriptionList';
import PassionVideoList from 'components/PageEditorPassionComponents/VideoList';
import PassionSessionList from 'components/PageEditorPassionComponents/SessionList';

import styles from './styles.module.scss';
import { resetBodyStyle } from 'components/Modals/modals';

const TemplatePreviewModal = ({ visible, closeModal, templateData = null }) => {
  const [pageStyles, setPageStyles] = useState(null);
  const [pageContent, setPageContent] = useState(null);

  useEffect(() => {
    if (templateData) {
      // setPageContent(templateData.content?.html ?? '');
      setPageContent(`
        ${templateData.content?.html}
        ${templateData.content?.html}
        ${templateData.content?.html}
        ${templateData.content?.html}
        ${templateData.content?.html}
      `);
      setPageStyles(`<style>${templateData.content?.css ?? ''}</style>`);
    }
  }, [templateData]);

  return (
    <Modal
      title="Template Preview"
      visible={visible}
      centered={true}
      width={1200}
      onCancel={closeModal}
      footer={null}
      afterClose={resetBodyStyle}
    >
      <div className={styles.previewContainer}>
        {pageStyles && ReactHtmlParser(pageStyles)}
        {pageContent && (
          <JsxParser
            showWarnings={true}
            allowUnknownElements={false}
            components={{
              PassionCourseList,
              PassionPassList,
              PassionSessionList,
              PassionSubscriptionList,
              PassionVideoList,
            }}
            jsx={pageContent}
          />
        )}
      </div>
    </Modal>
  );
};

export default TemplatePreviewModal;
