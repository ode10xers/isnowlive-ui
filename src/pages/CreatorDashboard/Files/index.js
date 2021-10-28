import React, { useEffect, useState, useCallback } from 'react';

import { Row, Col, Button, Typography, Tooltip, Card, Empty, Grid, Popconfirm } from 'antd';
import { DeleteOutlined, DownloadOutlined, EditOutlined, PlusCircleOutlined } from '@ant-design/icons';

import apis from 'apis';

import Loader from 'components/Loader';
import Table from 'components/Table';
import CreateFileObjectModal from 'components/CreateFileObjectModal';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { Title } = Typography;
const { useBreakpoint } = Grid;

const Files = () => {
  const { lg } = useBreakpoint();

  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createFileModalVisible, setCreateFileModalVisible] = useState(false);

  const [selectedFileObject, setSelectedFileObject] = useState(null);

  const getCreatorFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.documents.getCreatorDocuments();

      if (isAPISuccess(status) && data) {
        setFiles(data.data);
      }
    } catch (error) {
      showErrorModal('Failed to fetch user files', error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getCreatorFiles();
  }, [getCreatorFiles]);

  const showCreateFileObjectModal = () => {
    setCreateFileModalVisible(true);
  };

  const hideCreateFileObjectModal = (shouldRefresh = false) => {
    setCreateFileModalVisible(false);
    setSelectedFileObject(null);

    if (shouldRefresh) {
      getCreatorFiles();
    }
  };

  const handleEditFileObj = (fileObj) => {
    setSelectedFileObject(fileObj);
    showCreateFileObjectModal();
  };

  const handleDeleteFileObj = async (fileObj) => {
    setIsLoading(true);

    try {
      const { status } = await apis.documents.deleteDocument(fileObj.id);

      if (isAPISuccess(status)) {
        showSuccessModal('File removed successfully!');
        getCreatorFiles();
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to delete file', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  const filesColumns = [
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
          <Col xs={8}>
            <Tooltip title="Download file">
              <Button type="link" icon={<DownloadOutlined />} onClick={() => window.open(record.url)} />
            </Tooltip>
          </Col>
          <Col xs={8}>
            <Tooltip title="Edit file">
              <Button
                className={styles.editButton}
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEditFileObj(record)}
              />
            </Tooltip>
          </Col>
          <Col xs={8}>
            <Popconfirm
              arrowPointAtCenter
              title="Are you sure you want to remove this file?"
              onConfirm={() => handleDeleteFileObj(record)}
              okText="Yes, remove file"
              okButtonProps={{ danger: true, type: 'primary' }}
              cancelText="No"
            >
              <Button danger type="link" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Col>
        </Row>
      ),
    },
  ];

  const renderMobileFileItems = (fileObj) => {
    return (
      <Col xs={24} key={fileObj.id}>
        <Card
          bodyStyle={{ padding: 10 }}
          actions={[
            <Tooltip title="Download file">
              <Button type="link" icon={<DownloadOutlined />} onClick={() => window.open(fileObj.url)} />
            </Tooltip>,
            <Tooltip title="Edit file">
              <Button
                className={styles.editButton}
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEditFileObj(fileObj)}
              />
            </Tooltip>,
            <Popconfirm
              title="Are you sure you want to remove this file?"
              onConfirm={() => handleDeleteFileObj(fileObj)}
              okText="Yes, I'm sure"
              okButtonProps={{ danger: true, type: 'primary' }}
              cancelText="No"
            >
              <Button danger type="link" icon={<DeleteOutlined />} />
            </Popconfirm>,
          ]}
        >
          <Title level={5}> {fileObj.name} </Title>
        </Card>
      </Col>
    );
  };

  return (
    <div className={styles.box}>
      <CreateFileObjectModal
        selectedFileObject={selectedFileObject}
        visible={createFileModalVisible}
        closeModal={hideCreateFileObjectModal}
      />
      <Row gutter={[8, 16]}>
        <Col xs={24} md={12} lg={16}>
          <Title level={4}> Files </Title>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Button block type="primary" onClick={() => showCreateFileObjectModal()} icon={<PlusCircleOutlined />}>
            Upload new file
          </Button>
        </Col>
        <Col xs={24}>
          {!lg ? (
            files.length > 0 ? (
              <Loader loading={isLoading} text="Fetching files details...">
                <Row gutter={[16, 16]} justify="center">
                  {files.map(renderMobileFileItems)}
                </Row>
              </Loader>
            ) : (
              <Empty description="No files found" />
            )
          ) : (
            <Table columns={filesColumns} data={files} rowKey={(record) => record.id} loading={isLoading} />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Files;
