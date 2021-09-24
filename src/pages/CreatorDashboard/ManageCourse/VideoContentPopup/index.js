import React, { useState, useCallback, useEffect } from 'react';

import { Row, Col, Button, Space, Divider, Image, Typography, Modal, Collapse, Spin } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import DefaultImage from 'components/Icons/DefaultImage';
import { showErrorModal, resetBodyStyle } from 'components/Modals/modals';

import { isAPISuccess, preventDefaults, videoSourceType } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const VideoContentPopup = ({ visible, closeModal, addContentMethod = null, excludedVideos = [] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [selectedVideoPopupContent, setSelectedVideoPopupContent] = useState([]);

  const fetchVideosForCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.videos.getCreatorVideos();

      if (isAPISuccess(status) && data) {
        setVideos(data);
        // setVideos(data.filter((data) => !excludedVideos.includes(data.external_id)));
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to fetch videos', error?.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (visible) {
      fetchVideosForCreator();
    }
  }, [visible, fetchVideosForCreator]);

  //#region Start of Button Handlers

  const handleMarkVideoAsSelected = (videoId) => {
    setIsLoading(true);
    setSelectedVideoPopupContent([...new Set([...selectedVideoPopupContent, videoId])]);
    setIsLoading(false);
  };

  const handleUnmarkVideoAsSelected = (videoId) => {
    setIsLoading(true);
    setSelectedVideoPopupContent(selectedVideoPopupContent.filter((val) => val !== videoId));
    setIsLoading(false);
  };

  const handleCreateNewVideoClicked = (e) => {
    preventDefaults(e);

    closeModal();

    window.open(
      `${window.location.origin}${Routes.creatorDashboard.rootPath}${Routes.creatorDashboard.videos}`,
      '_blank'
    );
  };

  //#endregion End of Button Handlers

  //#region Start of Business Logic

  const addVideosToContent = (e) => {
    preventDefaults(e);

    if (addContentMethod) {
      setIsLoading(true);

      videos
        .filter((video) => selectedVideoPopupContent.includes(video.external_id))
        .forEach((video) => {
          addContentMethod({
            name: video.title,
            product_id: video.external_id,
            product_type: 'VIDEO',
          });
        });

      setIsLoading(false);
      setSelectedVideoPopupContent([]);
      closeModal();
    }
  };

  //#endregion End of Business Logic

  //#region Start of Render Methods

  const renderVideoContentItems = (video) => (
    <Col xs={24} key={video.external_id}>
      <Row gutter={[12, 12]} className={styles.contentPopupItem}>
        <Col xs={24} md={10}>
          <Image
            src={video.thumbnail_url || 'error'}
            alt={video.title}
            fallback={DefaultImage()}
            className={styles.videoContentPopupImage}
            preview={false}
          />
        </Col>
        <Col xs={24} md={14}>
          <Space size="small" direction="vertical">
            <Text strong>{video.title}</Text>
            <Space split={<Divider type="vertical" />}>
              <Text type="secondary">
                {video?.pay_what_you_want
                  ? 'Flexible'
                  : video?.price > 0
                  ? `${video?.currency?.toUpperCase()} ${video?.price}`
                  : 'Free'}
              </Text>
              {video.source === videoSourceType.YOUTUBE ? (
                <Text type="secondary"> Video </Text>
              ) : (
                <Text type="secondary">{Math.floor((video?.duration ?? 0) / 60)} mins</Text>
              )}
            </Space>
            {selectedVideoPopupContent.includes(video.external_id) ? (
              <Button
                ghost
                type="primary"
                icon={<CheckCircleFilled className={styles.blueText} />}
                onClick={() => handleUnmarkVideoAsSelected(video.external_id)}
              >
                Selected
              </Button>
            ) : (
              <Button ghost type="primary" onClick={() => handleMarkVideoAsSelected(video.external_id)}>
                Select this video
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </Col>
  );

  //#endregion End of Render Methods

  return (
    <Modal
      visible={visible}
      centered={true}
      width={820}
      onCancel={closeModal}
      afterClose={resetBodyStyle}
      title={<Title level={5}> Add Videos to Module </Title>}
      footer={
        <Button
          type="primary"
          size="large"
          onClick={addVideosToContent}
          loading={isLoading}
          disabled={selectedVideoPopupContent.length <= 0}
        >
          Add Selected Videos to Module
        </Button>
      }
      bodyStyle={{
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'scroll',
      }}
    >
      <Spin spinning={isLoading} tip="Processing">
        <Row gutter={[12, 12]} justify="center" align="middle">
          <Col xs={24}>
            <Text type="danger">Your videos already added to this course will not show up here.</Text>
          </Col>
          {videos.length > 0 ? (
            <Col xs={24}>
              <Collapse defaultActiveKey="published">
                <Panel header={<Title level={5}> Published </Title>} key="published">
                  <Row gutter={[12, 12]}>
                    {videos.filter((video) => video.is_published).length > 0 ? (
                      videos.filter((video) => video.is_published).map(renderVideoContentItems)
                    ) : (
                      <Col xs={24}>
                        <Text className={styles.textAlignCenter}>
                          Either you don’t have a video or have added all the published videos to this course already
                        </Text>
                      </Col>
                    )}
                  </Row>
                </Panel>
                <Panel header={<Title level={5}> Unpublished </Title>} key="unpublished">
                  <Row gutter={[12, 12]}>
                    {videos.filter((video) => !video.is_published).length > 0 ? (
                      videos.filter((video) => !video.is_published).map(renderVideoContentItems)
                    ) : (
                      <Col xs={24}>
                        <Text className={styles.textAlignCenter}>
                          Either you don’t have a video or have added all the unpublished videos to this course already
                        </Text>
                      </Col>
                    )}
                  </Row>
                </Panel>
              </Collapse>
            </Col>
          ) : (
            <Col xs={24}>
              <Row justify="center">
                <Col>
                  <Button type="primary" size="large" onClick={handleCreateNewVideoClicked}>
                    Create New Video
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

export default VideoContentPopup;
