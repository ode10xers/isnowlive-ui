import React, { useState, useEffect, useCallback } from 'react';

import { Spin, Row, Col, Button, Typography, Table, Empty, Modal, message } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import { resetBodyStyle, showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import { pageTypes } from 'utils/constants';

const { Text, Title } = Typography;

const CustomPages = ({ match, history }) => {
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

  const handleEditPageDetails = (pageInfo) => {
    console.log('Again, probably show a modal');
  };

  const handleEditPageContent = (pageInfo) => {
    // TODO: Replace this with actual route for page editor
    history.push('/test-editor');
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
          {record.name} {record.type === pageTypes.HOME ? <HomeOutlined /> : null}
        </Text>
      ),
    },
    {
      title: 'Page Link',
      dataIndex: 'slug',
      key: 'slug',
      render: (text, record) => <Text>/{record.slug}</Text>,
    },
    {
      title: 'Actions',
      render: (text, record) => (
        <Row gutter={[8, 8]} align="middle" justify="end">
          <Col xs={8}>
            <Button type="primary" onClick={() => handleEditPageDetails(record)}>
              Edit Page Details
            </Button>
          </Col>
          <Col xs={8}>
            <Button type="link" onClick={() => handleEditPageContent(record)}>
              Edit Page UI
            </Button>
          </Col>
          {record.type !== pageTypes.HOME && (
            <Col xs={8}>
              <Button danger type="text" onClick={() => handleDeletePageClicked(record)}>
                Remove page
              </Button>
            </Col>
          )}
        </Row>
      ),
    },
  ];

  const handleCreateNewPage = () => {
    console.log('Probably show modal here');
  };

  return (
    <div>
      <Spin spinning={isLoading} tip="Fetching custom pages...">
        <Row gutter={[8, 8]}>
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
                size="small"
                data={creatorPages}
                columns={pageTableColumns}
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

export default CustomPages;
