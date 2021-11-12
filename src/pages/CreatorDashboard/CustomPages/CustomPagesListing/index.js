import React, { useState, useEffect, useCallback } from 'react';

import { Spin, Row, Col, Button, Typography, Table, Empty, Modal, message } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import { resetBodyStyle, showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import { pageTypes } from 'utils/constants';

import styles from './styles.module.scss';
import { generatePath } from 'react-router-dom';

const { Text, Title } = Typography;

const CustomPagesListing = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [creatorPages, setCreatorPages] = useState([]);

  const fetchCreatorCustomPages = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.custom_pages.getAllPages();

      if (isAPISuccess(status) && data) {
        setCreatorPages(data);
      }
    } catch (error) {
      console.error(error);
      showErrorModal(
        'Failed to fetch creator custom pages!',
        error?.response?.data?.message ?? 'Something went wrong.'
      );
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorCustomPages();
  }, [fetchCreatorCustomPages]);

  const handleCreateNewPage = () =>
    history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.customPages.create, {
      isHome: creatorPages.every((page) => page.type !== pageTypes.HOME),
    });

  const handleEditPageDetails = (pageInfo) => {
    if (pageInfo && pageInfo.external_id) {
      history.push(
        Routes.creatorDashboard.rootPath +
          generatePath(Routes.creatorDashboard.customPages.update, { page_id: pageInfo.external_id })
      );
    } else {
      handleCreateNewPage();
    }
  };

  const handleEditPageContent = (pageInfo) => {
    history.push(generatePath(Routes.creatorDashboard.customPages.editor, { page_id: pageInfo.external_id }));
  };

  const handleDeletePage = async (pageInfo, modalRef) => {
    setIsLoading(true);

    try {
      const { status } = await apis.custom_pages.deletePage(pageInfo.external_id);

      if (isAPISuccess(status)) {
        message.success('Page has been removed!');
        await fetchCreatorCustomPages();
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to remove page!', error?.response?.data?.message ?? 'Something went wrong.');
    }

    setIsLoading(false);
  };

  const handleDeletePageClicked = (pageInfo) => {
    const modalRef = Modal.confirm({
      afterClose: resetBodyStyle,
      centered: true,
      closable: true,
      maskClosable: true,
      title: 'Confirm Delete Page',
      content: 'Are you sure you want to remove this page? This action is irreversible!',
      okButtonProps: {
        danger: true,
      },
      onOk: () => handleDeletePage(pageInfo, modalRef),
      okText: `Yes, I'm sure`,
    });
  };

  const pageTableColumns = [
    {
      title: 'Page Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Text>
          {record.type === pageTypes.HOME ? <HomeOutlined className={styles.blueText} /> : null} {record.name}
        </Text>
      ),
    },
    {
      title: 'Page Link',
      dataIndex: 'slug',
      key: 'slug',
      render: (text, record) => <Text strong>/{record.slug}</Text>,
    },
    {
      title: 'Actions',
      align: 'right',
      render: (text, record) => (
        <Row gutter={[8, 8]} align="middle" justify="end">
          <Col>
            <Button type="primary" onClick={() => handleEditPageDetails(record)}>
              Edit Page Details
            </Button>
          </Col>
          <Col>
            <Button type="link" onClick={() => handleEditPageContent(record)}>
              Edit Page UI
            </Button>
          </Col>
          {record.type !== pageTypes.HOME && (
            <Col>
              <Button danger type="text" onClick={() => handleDeletePageClicked(record)}>
                Remove page
              </Button>
            </Col>
          )}
        </Row>
      ),
    },
  ];

  return (
    <div className={styles.pageListContainer}>
      <Spin spinning={isLoading} tip="Fetching custom pages...">
        <Row gutter={[8, 16]}>
          <Col xs={24} md={16} lg={18}>
            <Title level={4}>Custom Pages</Title>
          </Col>
          <Col xs={24} md={8} lg={6}>
            <Button block type="primary" onClick={handleCreateNewPage}>
              Create New Page
            </Button>
          </Col>
          <Col xs={24}>
            {creatorPages.length > 0 ? (
              <Table
                dataSource={creatorPages}
                columns={pageTableColumns}
                pagination={false}
                rowKey={(record) => record.external_id}
              />
            ) : (
              <Empty description="No custom pages to show" />
            )}
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default CustomPagesListing;
