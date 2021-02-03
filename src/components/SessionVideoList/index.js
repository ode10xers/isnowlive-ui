import React from 'react';
import classNames from 'classnames';
import ReactHtmlParser from 'react-html-parser';
import { Row, Col, Tabs, Button, Typography, Image, Card, Divider, Space } from 'antd';

import DefaultImage from 'components/Icons/DefaultImage';

import { generateUrlFromUsername } from 'utils/helper';

import styles from './style.module.scss';

const { Title } = Typography;

const SessionVideoList = ({ sessionVideos }) => {
  const showPurchaseModal = () => {
    console.log('Purchase Modal Here');
  };

  const redirectToVideoPreview = (video) => {
    if (video.username) {
      const baseUrl = generateUrlFromUsername(video.username || 'app');
      window.open(`${baseUrl}/v/${video.id}`);
    }
  };

  const renderVideoItem = (videoDetails) => (
    <div key={videoDetails.id}>
      <Col xs={24}>
        <Card
          className={styles.videoCard}
          hoverable={true}
          bordered={false}
          onClick={() => redirectToVideoPreview(videoDetails)}
          cover={
            <Image
              className={styles.videoThumbnail}
              src={videoDetails.thumbnail_url || 'error'}
              alt={videoDetails.title}
              fallback={DefaultImage()}
            />
          }
        >
          <Row gutter={[16, 16]} justify="space-between">
            <Col xs={24} md={16} xl={20}>
              <Row gutter={[8, 8]} justify="space-around">
                <Col xs={24}>
                  <Title level={4} className={styles.textAlignLeft}>
                    {videoDetails.title}
                  </Title>
                </Col>
                <Col xs={24}>
                  <Space size="large" split={<Divider type="vertical" />}>
                    <Title level={5} className={classNames(styles.textAlignCenter, styles.blueText)}>
                      Validity
                    </Title>
                    <Title level={5} className={classNames(styles.textAlignCenter, styles.blueText)}>
                      {videoDetails.validity || 0} hours
                    </Title>
                  </Space>
                </Col>
                <Col xs={24}>
                  <div className={styles.videoDesc}>{ReactHtmlParser(videoDetails.description)}</div>
                </Col>
              </Row>
            </Col>
            <Col xs={24} md={8} xl={4}>
              <div className={styles.flexColumn}>
                <div className={classNames(styles.flexVerticalRow, styles.flexGrow)}>
                  <Title level={4} className={classNames(styles.priceText, styles.textAlignCenter)}>
                    {videoDetails.price} {videoDetails.currency.toUpperCase()}
                  </Title>
                </div>
                <div className={styles.flexVerticalRow}>
                  <Button type="primary" size="large" block onClick={() => showPurchaseModal()}>
                    Buy
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </div>
  );

  return (
    <div className={styles.box}>
      <Tabs size="large" defaultActiveKey="Buy" activeKey="Buy">
        <Tabs.TabPane key="Buy" tab="Buy Recorded Videos" className={styles.videoListContainer}>
          <Row gutter={[8, 20]}>{sessionVideos.length > 0 && sessionVideos.map(renderVideoItem)}</Row>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default SessionVideoList;
