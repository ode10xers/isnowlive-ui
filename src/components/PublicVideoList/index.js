import React, { useEffect, useState } from 'react';

import { Row, Col, Typography, Image, Modal } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

import VideoCard from 'components/VideoCard';
import DefaultImage from 'components/Icons/DefaultImage';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const PublicVideoList = ({ videos }) => {
  //TODO: Add both the details modal (containing VideoCard) and PurchaseModal here
  return (
    <div className={styles.box}>
      <Row justify="start" gutter={[20, 20]}>
        {videos.map((video) => (
          <Col xs={24} md={12} xl={8}>
            <div key={video.video_id || video.external_id} className={styles.cleanCard}>
              <Row gutter={[8, 8]} justify="center">
                <Col span={24} className={styles.imageWrapper}>
                  <div className={styles.thumbnailImage}>
                    <Image src={video.thumbnail_url || 'error'} alt={video.title} fallback={DefaultImage()} />
                  </div>
                  <div className={styles.playIconWrapper}>
                    <PlayCircleOutlined className={styles.playIcon} />
                  </div>
                </Col>
                <Col span={24} className={styles.textWrapper}>
                  <Row gutter={8} justify="start">
                    <Col flex="1 0 auto">
                      <Title className={styles.textAlignLeft} level={5}>
                        {' '}
                        {video.title}{' '}
                      </Title>
                    </Col>
                    <Col flex="0 0 auto">
                      <Text>
                        {' '}
                        {video.price} {video.currency.toUpperCase()}{' '}
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
