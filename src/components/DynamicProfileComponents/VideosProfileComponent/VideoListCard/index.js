import React from 'react';

import { Card, Typography, Image, Row, Space, Col } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

import dateUtil from 'utils/date';
import { videoSourceType } from 'utils/constants';
import { redirectToVideosPage } from 'utils/redirect';
import { isValidFile, preventDefaults } from 'utils/helper';

import styles from './style.module.scss';

const DefaultImage = require('assets/images/greybg.jpg');

const { Title, Text } = Typography;

const {
  formatDate: { getVideoDuration },
} = dateUtil;

const VideoListCard = ({ video, handleClick = null }) => {
  const videoDuration = (
    <Space size={4} align="middle">
      <PlayCircleOutlined className={styles.textIcons} />
      {video.source === videoSourceType.CLOUDFLARE ? (
        <Text className={styles.videoDuration}> {getVideoDuration(video?.duration)} </Text>
      ) : null}
    </Space>
  );

  const videoImage = (
    <div className={styles.videoCoverContainer}>
      <div className={styles.videoImageContainer}>
        <Image
          loading="lazy"
          preview={false}
          className={
            video?.thumbnail_url?.endsWith('.gif')
              ? styles.videoThumbnail
              : video?.thumbnail_url?.includes('img.youtube.com')
              ? styles.youtubeThumbnail
              : styles.videoStaticImage
          }
          src={isValidFile(video?.thumbnail_url) ? video?.thumbnail_url : DefaultImage}
        />
      </div>
      <div className={styles.videoDurationContainer}>{videoDuration}</div>
    </div>
  );

  const videoTitle = (
    <Title level={4} className={styles.videoTitle}>
      {video?.title}
    </Title>
  );

  // const renderVideoPrice = () => {
  //   if (video?.pay_what_you_want) {
  //     return 'Flexible';
  //   } else if (video?.total_price === 0 || video?.currency === '') {
  //     return 'Free';
  //   } else {
  //     return `${video?.currency?.toUpperCase()} ${video?.total_price}`;
  //   }
  // };

  // const bottomCardBar = (
  //   <Row className={styles.cardFooter}>
  //     {/* <Col xs={14} className={styles.videoValidity}>
  //       VALIDITY : {video?.validity} DAY{video?.validity > 1 ? 'S' : ''}
  //     </Col> */}
  //     <Col xs={10} className={styles.priceText}>
  //       {renderVideoPrice()}
  //     </Col>
  //   </Row>
  // );

  const handleCardClicked = (e) => {
    preventDefaults(e);
    redirectToVideosPage(video);
  };

  return (
    <Card
      bordered={false}
      className={styles.videoListCard}
      cover={videoImage}
      bodyStyle={{ padding: 0 }}
      onClick={handleClick ?? handleCardClicked}
    >
      <Row>
        <Col xs={24}>{videoTitle}</Col>
        {/* <Col xs={24}>{bottomCardBar}</Col> */}
      </Row>
    </Card>
  );
};

export default VideoListCard;
