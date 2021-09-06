import React, { useEffect, useState, useCallback } from 'react';

import { Row, Col, Button, Typography, Tooltip, Card, Empty } from 'antd';
import { DownloadOutlined, EditOutlined, PlusCircleOutlined } from '@ant-design/icons';

import apis from 'apis';

import Loader from 'components/Loader';
import Table from 'components/Table';
import CreateDocumentModal from 'components/CreateDocumentModal';
import { showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import { isMobileDevice } from 'utils/device';

import styles from './styles.module.scss';

const { Title } = Typography;

const Documents = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [createDocumentModalVisible, setCreateDocumentModalVisible] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState(null);

  const getCreatorDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.documents.getCreatorDocuments();

      if (isAPISuccess(status) && data) {
        setDocuments(data.data);
      }
    } catch (error) {
      showErrorModal('Failed to fetch user documents', error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getCreatorDocuments();
  }, [getCreatorDocuments]);

  const showCreateDocumentModal = () => {
    setCreateDocumentModalVisible(true);
  };

  const hideCreateDocumentModal = (shouldRefresh = false) => {
    setCreateDocumentModalVisible(false);

    if (shouldRefresh) {
      getCreatorDocuments();
    }
  };

  const handleEditDocument = (document) => {
    setSelectedDocument(document);
    showCreateDocumentModal();
  };

  // TODO: Add other buttons/columns as necessary
  const documentsColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '80%',
    },
    {
      title: 'Actions',
      width: '20%',
      render: (record) => (
        <Row gutter={[8, 8]} justify="end">
          <Col xs={12}>
            <Tooltip title="Download document">
              <Button type="link" icon={<DownloadOutlined />} onClick={() => window.open(record.url)} />
            </Tooltip>
          </Col>
          <Col xs={12}>
            <Tooltip title="Edit document">
              <Button
                className={styles.editButton}
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEditDocument(record)}
              />
            </Tooltip>
          </Col>
        </Row>
      ),
    },
  ];

  const renderMobileDocumentItems = (document) => {
    return (
      <Col xs={24} key={document.id}>
        <Card
          bodyStyle={{ padding: 10 }}
          actions={[
            <Tooltip title="Download document">
              <Button type="link" icon={<DownloadOutlined />} onClick={() => window.open(document.url)} />
            </Tooltip>,
            <Tooltip title="Edit document">
              <Button
                className={styles.editButton}
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEditDocument(document)}
              />
            </Tooltip>,
          ]}
        >
          <Title level={5}> {document.name} </Title>
        </Card>
      </Col>
    );
  };

  return (
    <div className={styles.box}>
      <CreateDocumentModal
        selectedDocument={selectedDocument}
        visible={createDocumentModalVisible}
        closeModal={hideCreateDocumentModal}
      />
      <Row gutter={[8, 16]}>
        <Col xs={24} md={12} lg={16}>
          <Title level={4}> Documents </Title>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Button block type="primary" onClick={() => showCreateDocumentModal()} icon={<PlusCircleOutlined />}>
            Upload new document
          </Button>
        </Col>
        <Col xs={24}>
          {isMobileDevice ? (
            documents.length > 0 ? (
              <Loader loading={isLoading} text="Fetching document details...">
                <Row gutter={[16, 16]} justify="center">
                  {documents.map(renderMobileDocumentItems)}
                </Row>
              </Loader>
            ) : (
              <Empty description="No documents found" />
            )
          ) : (
            <Table columns={documentsColumns} data={documents} rowKey={(record) => record.id} loading={isLoading} />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Documents;
