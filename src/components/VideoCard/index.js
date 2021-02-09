import React from 'react';
import classNames from 'classnames';
import ReactHtmlParser from 'react-html-parser';

import { Row, Col, Card, Button, Typography, Image, Space, Divider } from 'antd';

import dateUtil from 'utils/date';

import styles from './styles.module.scss';

import DefaultImage from 'components/Icons/DefaultImage';

const { Title } = Typography;

const {
  formatDate: { toLongDateWithDayTime },
} = dateUtil;

const noop = () => {};

const VideoCard = ({
  cover = null,
  video,
  buyable = false,
  hoverable = true,
  showOrderDetails = false,
  orderDetails = null,
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
              {showOrderDetails && orderDetails ? (
                <div className={styles.highlightedBox}>
                  <Space size="middle" align="center" split={<Divider className={styles.divider} type="vertical" />}>
                    <Title level={5} className={styles.blueText}>
                      Available Till : {toLongDateWithDayTime(orderDetails.expiry)}
                    </Title>
                    <Title level={5} className={styles.blueText}>
                      Allowed Watches : {orderDetails.watch_limit}
                    </Title>
                    <Title level={5} className={styles.blueText}>
                      You have watched {orderDetails.num_views} times
                    </Title>
                  </Space>
                </div>
              ) : (
                <Title level={5} className={classNames(styles.textAlignLeft, styles.blueText)}>
                  Validity : {video.validity || 0} hours
                </Title>
              )}
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
                  {video.price === 0 ? 'Get' : 'Buy'}
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
