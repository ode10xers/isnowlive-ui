import React from 'react';
import classNames from 'classnames';
import ReactHtmlParser from 'react-html-parser';

import { Row, Col, Card, Button, Typography, Image } from 'antd';

import styles from './styles.module.scss';

import DefaultImage from 'components/Icons/DefaultImage';

const { Title } = Typography;

const noop = () => {};

const VideoCard = ({
  cover = null,
  video,
  buyable = false,
  hoverable = true,
  onCardClick = noop,
  showPurchaseModal = noop,
}) => {
  return (
    <Card
      className={styles.videoCard}
      hoverable={hoverable}
      bordered={false}
      footer={null}
      onClick={() => onCardClick(video)}
      cover={
        cover || (
          <Image
            className={styles.videoThumbnail}
            src={video.thumbnail_url || 'error'}
            alt={video.title}
            fallback={DefaultImage()}
          />
        )
      }
    >
      <Row gutter={[16, 16]} justify="space-between">
        <Col xs={24} md={buyable ? 16 : 24} xl={buyable ? 20 : 24}>
          <Row gutter={[8, 8]} justify="space-around">
            <Col xs={24}>
              <Title level={4} className={styles.textAlignLeft}>
                {video.title}
              </Title>
            </Col>
            <Col xs={24}>
              <Title level={5} className={classNames(styles.textAlignLeft, styles.blueText)}>
                Validity : {video.validity || 0} hours
              </Title>
            </Col>
            <Col xs={24}>
              <div className={styles.videoDesc}>{ReactHtmlParser(video.description)}</div>
            </Col>
          </Row>
        </Col>
        {buyable && (
          <Col xs={24} md={8} xl={4}>
            <div className={styles.flexColumn}>
              <div className={classNames(styles.flexVerticalRow, styles.flexGrow)}>
                <Title level={4} className={classNames(styles.priceText, styles.textAlignCenter)}>
                  {video.price} {video.currency.toUpperCase()}
                </Title>
              </div>
              <div className={styles.flexVerticalRow}>
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={(e) => {
                    e.stopPropagation();
                    showPurchaseModal(video);
                  }}
                >
                  Buy
                </Button>
              </div>
            </div>
          </Col>
        )}
      </Row>
    </Card>
  );
};

export default VideoCard;
