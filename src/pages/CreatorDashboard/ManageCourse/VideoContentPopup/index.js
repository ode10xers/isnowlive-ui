import React, { useState } from 'react';

import { Row, Col, Button, Space, Divider, Image, Typography, Modal, Spin } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';

import Routes from 'routes';

import DefaultImage from 'components/Icons/DefaultImage';
import { resetBodyStyle } from 'components/Modals/modals';

import { preventDefaults, videoSourceType } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const VideoContentPopup = ({ visible, closeModal, videos = [], addContentMethod = null }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideoPopupContent, setSelectedVideoPopupContent] = useState([]);

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
        overflow: 'scroll',
      }}
    >
      <Spin spinning={isLoading} tip="Processing">
        <Row gutter={[12, 12]} justify="center" align="middle">
          {videos.length > 0 ? (
            videos.map(renderVideoContentItems)
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
