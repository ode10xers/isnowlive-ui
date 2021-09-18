import React, { useState, useCallback, useEffect } from 'react';

import { Modal, Button, Select, Row, Col, Switch, Space, Spin, Typography } from 'antd';

import apis from 'apis';
import Routes from 'routes';

import { resetBodyStyle, showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Paragraph, Text } = Typography;

const FileContentPopup = ({ visible, closeModal, addContentMethod = null, excludedDocumentIds = [] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);

  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [isDownloadable, setIsDownloadable] = useState(false);

  const fetchDocumentsForCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.documents.getCreatorDocuments();

      if (isAPISuccess(status) && data) {
        const documentsArr = data.data ?? [];
        setDocuments(documentsArr.filter((data) => !excludedDocumentIds.includes(data.id)));
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to fetch documents', error?.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  }, [excludedDocumentIds]);

  const resetModalState = useCallback(() => {
    setSelectedDocuments([]);
    setIsDownloadable(false);
  }, []);

  useEffect(() => {
    if (visible) {
      fetchDocumentsForCreator();
    } else {
      resetModalState();
    }
  }, [visible, fetchDocumentsForCreator, resetModalState]);

  //#region Start of Button Handlers

  //#endregion End of Button Handlers

  const handleManageMyFilesClicked = () => {
    closeModal();

    window.open(
      `${window.location.origin}${Routes.creatorDashboard.rootPath}${Routes.creatorDashboard.documents}`,
      '_blank'
    );
  };

  const handleAddDocumentsToCourse = () => {
    if (addContentMethod) {
      setIsLoading(true);

      documents
        .filter((document) => selectedDocuments.includes(document.id))
        .forEach((document) => {
          addContentMethod({
            name: document.name,
            product_id: document.id,
            product_type: 'DOCUMENT',
            is_downloadable: isDownloadable,
          });
        });

      setIsLoading(false);
      resetModalState();
      closeModal();
    }
  };

  return (
    <Modal
      visible={visible}
      centered={true}
      onCancel={closeModal}
      afterClose={resetBodyStyle}
      title={<Title level={5}>Add Files to Module</Title>}
      footer={
        <Button
          disabled={!selectedDocuments.length}
          loading={isLoading}
          type="primary"
          size="large"
          onClick={handleAddDocumentsToCourse}
        >
          Add Selected Files to Module
        </Button>
      }
    >
      <Spin spinning={isLoading} tip="Processing...">
        <Row gutter={[12, 12]} justify="center" align="middle">
          {documents.length > 0 ? (
            <>
              <Col xs={24}>
                <Paragraph>
                  You can select the files you want to add as module contents here. Each file will be added as 1 module
                  content.
                </Paragraph>
                <Paragraph strong>
                  The downloadable settings will apply to all the files you select here. If you want a different setting
                  for different file, please add them separately with the said setting.
                </Paragraph>
              </Col>
              <Col xs={24}>
                {/* Show input and toggle */}
                <Row gutter={[12, 8]} align="middle">
                  <Col xs={24} md={10} className={styles.formLabelWrapper}>
                    <Text> Documents: </Text>
                  </Col>
                  <Col xs={24} md={14} className={styles.formContentWrapper}>
                    <Select
                      className={styles.w100}
                      mode="multiple"
                      placeholder="Select files to attach"
                      maxTagCount={3}
                      value={selectedDocuments}
                      onChange={setSelectedDocuments}
                      options={documents.map((document) => ({
                        label: document.name,
                        value: document.id,
                      }))}
                    />
                  </Col>
                  <Col xs={24} md={10} className={styles.formLabelWrapper}>
                    <Text> Downloadable by buyers: </Text>
                  </Col>
                  <Col xs={24} md={14} className={styles.formContentWrapper}>
                    <Space>
                      <Text> No </Text>
                      <Switch checked={isDownloadable} onChange={setIsDownloadable} />
                      <Text> Yes </Text>
                    </Space>
                  </Col>
                </Row>
              </Col>
            </>
          ) : (
            <Col xs={24}>
              <Paragraph>You don't have any other files you can embed. Click the button below to add more.</Paragraph>
              {/* Redirect them to Document Drive Section */}
              <Row justify="center">
                <Col>
                  <Button type="primary" size="large" onClick={handleManageMyFilesClicked}>
                    Manage my files
                  </Button>
                </Col>
              </Row>
            </Col>
          )}
        </Row>
      </Spin>
    </Modal>
  );
};

export default FileContentPopup;
