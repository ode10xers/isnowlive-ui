import React, { useState } from 'react';

import { Row, Col, Button, Space, Divider, Image, Typography, Modal } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';

import DefaultImage from 'components/Icons/DefaultImage';
import { resetBodyStyle } from 'components/Modals/modals';

import { preventDefaults } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const VideoContentPopup = ({ visible, closeModal, videos = [], addContentMethod = null }) => {
  const [selectedVideoPopupContent, setSelectedVideoPopupContent] = useState([]);

  const handleMarkVideoAsSelected = (videoId) => {
    setSelectedVideoPopupContent([...new Set([...selectedVideoPopupContent, videoId])]);
  };

  const handleUnmarkVideoAsSelected = (videoId) => {
    setSelectedVideoPopupContent(selectedVideoPopupContent.filter((val) => val !== videoId));
  };

  const addVideosToContent = (e) => {
    preventDefaults(e);

    if (addContentMethod) {
      videos
        .filter((video) => selectedVideoPopupContent.includes(video.external_id))
        .forEach((video) => {
          addContentMethod({
            name: video.title,
            product_id: video.external_id,
            product_type: 'VIDEO',
          });
        });

      setSelectedVideoPopupContent([]);
      closeModal();
    }
  };

  const renderVideoContentItems = (video) => (
    <Col xs={24} key={video.external_id}>
      <Row gutter={[12, 12]} className={styles.contentPopupItem}>
        <Col xs={24} md={10}>
          <Image
            src={video.thumbnail_url || 'error'}
            alt={video.title}
            fallback={DefaultImage()}
            className={styles.videoContentPopupImage}
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
              <Text type="secondary">{Math.floor((video?.duration ?? 0) / 60)} mins</Text>
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

  return (
    <Modal
      visible={visible}
      centered={true}
      width={820}
      onCancel={closeModal}
      afterClose={resetBodyStyle}
      title={<Title level={5}> Add Videos to Module </Title>}
      footer={
        <Button type="primary" size="large" onClick={addVideosToContent}>
          Add Selected Videos to Module
        </Button>
      }
    >
      <Row gutter={[12, 12]} justify="center" align="middle">
        {videos.map(renderVideoContentItems)}
      </Row>
    </Modal>
  );
};

export default VideoContentPopup;
