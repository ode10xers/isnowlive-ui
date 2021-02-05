import React, { useState } from 'react';

import { Row, Col, Typography, Image, Modal } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

import VideoCard from 'components/VideoCard';
import DefaultImage from 'components/Icons/DefaultImage';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const PublicVideoList = ({ videos }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoDetailModal, setShowVideoDetailModal] = useState(false);

  const handleSelectVideo = (video) => {
    if (video) {
      setSelectedVideo(video);
      setShowVideoDetailModal(true);
    }
  };

  const hideVideoDetailModal = () => {
    setShowVideoDetailModal(false);
    setSelectedVideo(null);
  };

  const showPurchaseModal = () => {
    console.log('Show Purchase Modal');
  };

  //TODO: Add both the details modal (containing VideoCard) and PurchaseModal here
  return (
    <div className={styles.box}>
      <Modal
        visible={selectedVideo && showVideoDetailModal}
        onCancel={hideVideoDetailModal}
        centered={true}
        footer={null}
        width={720}
      >
        {selectedVideo && (
          <div className={styles.mt20}>
            <VideoCard video={selectedVideo} buyable={true} hoverable={false} showPurchaseModal={showPurchaseModal} />
          </div>
        )}
      </Modal>
      <Row justify="start" gutter={[20, 20]}>
        {videos.map((video) => (
          <Col xs={24} md={12} xl={8}>
            <div
              key={video.video_id || video.external_id}
              className={styles.cleanCard}
              onClick={() => handleSelectVideo(video)}
            >
              <Row gutter={[8, 8]} justify="center">
                <Col span={24} className={styles.imageWrapper}>
                  <div className={styles.thumbnailImage}>
                    <Image
                      src={video.thumbnail_url || 'error'}
                      alt={video.title}
                      fallback={DefaultImage()}
                      preview={false}
                    />
                  </div>
                  <div className={styles.playIconWrapper}>
                    <PlayCircleOutlined className={styles.playIcon} />
                  </div>
                </Col>
                <Col span={24} className={styles.textWrapper}>
                  <Row gutter={8} justify="start">
                    <Col flex="1 0 auto">
                      <Title className={styles.textAlignLeft} level={5}>
                        {video.title}
                      </Title>
                    </Col>
                    <Col flex="0 0 auto">
                      <Text>
                        {video.price} {video.currency.toUpperCase()}
                      </Text>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default PublicVideoList;
