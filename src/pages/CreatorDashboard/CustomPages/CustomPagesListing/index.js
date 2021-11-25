import React, { useState, useEffect, useCallback } from 'react';
import { generatePath } from 'react-router-dom';

import { Spin, Row, Col, Button, Typography, Table, Empty, Modal, message } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import { resetBodyStyle, showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import { generateUrlFromUsername } from 'utils/url';
import { pageTypes, websiteComponentTypes } from 'utils/constants';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const { Text, Title } = Typography;

const CustomPagesListing = ({ match, history }) => {
  const {
    state: { userDetails },
  } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(true);
  const [creatorPages, setCreatorPages] = useState([]);
  const [creatorHeader, setCreatorHeader] = useState(null);
  // eslint-disable-next-line
  const [creatorFooter, setCreatorFooter] = useState(null);

  const fetchCreatorCustomPages = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.custom_pages.getAllPages();

      if (isAPISuccess(status) && data) {
        // This is to move the homepage to first
        const homepageIndex = data.findIndex((page) => page.type === pageTypes.HOME);

        if (homepageIndex > 0) {
          data.unshift(data.splice(homepageIndex, 1)[0]);
        }

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

  const fetchCreatorHeaderComponent = useCallback(async () => {
    try {
      const { status, data } = await apis.custom_pages.getWebsiteComponent(websiteComponentTypes.HEADER);

      if (isAPISuccess(status) && data) {
        setCreatorHeader(data);
      }
    } catch (error) {
      console.log('Failed fetching creator header component!');
      console.error(error);
    }
  }, []);

  const fetchCreatorFooterComponent = useCallback(async () => {
    try {
      const { status, data } = await apis.custom_pages.getWebsiteComponent(websiteComponentTypes.FOOTER);

      if (isAPISuccess(status) && data) {
        setCreatorFooter(data);
      }
    } catch (error) {
      console.log('Failed fetching creator header component!');
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchCreatorCustomPages();
    fetchCreatorHeaderComponent();
    fetchCreatorFooterComponent();
  }, [fetchCreatorCustomPages, fetchCreatorHeaderComponent, fetchCreatorFooterComponent]);

  const navigateWithUsernameUrl = (targetPath) => {
    window.location.href = `${generateUrlFromUsername(userDetails.username)}${targetPath}`;
  };

  const handleCreateNewPage = () =>
    history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.customPages.create, {
      isHome: creatorPages.every((page) => page.type !== pageTypes.HOME),
    });

  const handleEditHeader = () => navigateWithUsernameUrl(Routes.creatorDashboard.customPages.headerEditor);

  // const handleEditFooter = () => navigateWithUsernameUrl(Routes.creatorDashboard.customPages.footerEditor);

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

  const handleEditPageContent = (pageInfo) =>
    navigateWithUsernameUrl(
      generatePath(Routes.creatorDashboard.customPages.simpleEditor, { page_id: pageInfo.external_id })
    );

  const handleDeletePage = async (pageInfo, modalRef) => {
    setIsLoading(true);

    try {
      const { status } = await apis.custom_pages.deletePage(pageInfo.external_id);

      if (isAPISuccess(status)) {
        message.success('Page has been removed!');
        await fetchCreatorCustomPages();
        modalRef.destroy();
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
          <Col xs={24} md={8} lg={6}>
            <Title level={4}>Custom Pages</Title>
          </Col>
          <Col xs={24} md={16} lg={18}>
            <Row gutter={[8, 8]} justify="end">
              {creatorHeader && (
                <Col flex="0 0 33%">
                  <Button ghost block type="primary" onClick={handleEditHeader}>
                    Edit Header
                  </Button>
                </Col>
              )}
              {/* {creatorFooter && (
                <Col flex="0 0 33%">
                  <Button ghost block type="primary" onClick={handleEditFooter}>
                    Edit Footer
                  </Button>
                </Col>
              )} */}
              <Col flex="0 0 33%">
                <Button block type="primary" onClick={handleCreateNewPage}>
                  Create New Page
                </Button>
              </Col>
            </Row>
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
