import React from 'react';
import classNames from 'classnames';
import ReactHtmlParser from 'react-html-parser';

import { Row, Col, Card, Button, Typography, Image, Space, Divider } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { generateUrlFromUsername } from 'utils/helper';

import styles from './styles.module.scss';

import DefaultImage from 'components/Icons/DefaultImage';

const { Title, Text } = Typography;

const {
  formatDate: { toLongDateWithDayTime },
} = dateUtil;

const noop = () => {};

// This card will be used for 3 purposes
// 1) Becomes a buyable card so the user can directly buy by clicking this card (buyable = true, also pass showPurchaseModal)
// 2) Becomes a simple display card where the user cannot buy (buyable = false, can show details button or desc if needed)
// 3) Used in attendee dashboard as video player and also show order details (showOrderDetails = true and send orderDetails)
const VideoCard = ({
  cover = null,
  video,
  buyable = false,
  hoverable = true,
  showOrderDetails = false,
  orderDetails = null,
  onCardClick = noop,
  showPurchaseModal = noop,
  showDesc = false,
  showDetailsBtn = true,
}) => {
  const redirectToVideoDetails = () => {
    if (video?.external_id) {
      const username = window.location.hostname.split('.')[0];

      const baseUrl = generateUrlFromUsername(video?.username || username || 'app');
      window.open(`${baseUrl}/v/${video?.external_id}`);
    }
  };

  const renderVideoOrderDetails = () => {
    if (isMobileDevice) {
      return (
        <Space size={1} align="center" direction="vertical" className={styles.orderDetailsWrapper}>
          <Text strong className={styles.blueText}>
            Available Till : {toLongDateWithDayTime(orderDetails.expiry)}
          </Text>
          <Divider className={classNames(styles.divider, styles.horizontal)} />
          <Text strong className={styles.blueText}>
            Allowed Watches : {orderDetails.watch_limit}
          </Text>
          <Divider className={classNames(styles.divider, styles.horizontal)} />
          <Text strong className={styles.blueText}>
            You have watched {orderDetails.num_views} times
          </Text>
        </Space>
      );
    }

    return (
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
    );
  };

  return (
    <Card
      className={styles.videoCard}
      hoverable={hoverable}
      bordered={false}
      footer={null}
      onClick={() => onCardClick(video)}
      bodyStyle={{ padding: '10px 20px' }}
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
      <Row gutter={[16, 16]} justify="center">
        {(!showOrderDetails || !orderDetails) && (
          <Col span={24} className={styles.playIconWrapper}>
            <PlayCircleOutlined className={styles.playIcon} size={40} />
          </Col>
        )}
        <Col span={24} className={classNames(styles.mt10, styles.textWrapper)}>
          <Row gutter={[8, 8]} justify="start">
            <Col xs={24} className={styles.titleWrapper}>
              <Title level={5} className={styles.textAlignLeft}>
                {video.title}
              </Title>
            </Col>
            <Col xs={24} className={styles.detailsWrapper}>
              {showOrderDetails && orderDetails ? (
                <div className={styles.highlightedBox}>{renderVideoOrderDetails()}</div>
              ) : (
                <Row gutter={16} justify="space-evenly">
                  <Col span={14} className={styles.textAlignLeft}>
                    <Text strong className={styles.validityText}>
                      Viewable for : {video?.validity} days
                    </Text>
                  </Col>
                  <Col span={10} className={styles.textAlignRight}>
                    <Text strong className={styles.priceText}>
                      Price : {video?.price === 0 ? 'Free' : `${video?.currency.toUpperCase()} ${video?.price}`}
                    </Text>
                  </Col>
                </Row>
              )}
            </Col>
            {showDesc && (
              <Col xs={24} className={styles.descWrapper}>
                <div className={styles.videoDesc}>{ReactHtmlParser(video.description)}</div>
              </Col>
            )}
            {!showOrderDetails && (showDetailsBtn || buyable) && (
              <Col span={24} className={styles.buttonWrapper}>
                <Row gutter={16} justify="space-around">
                  {showDetailsBtn && (
                    <Col xs={12}>
                      <Button
                        className={styles.detailBtn}
                        block
                        type="link"
                        onClick={(e) => {
                          e.stopPropagation();
                          redirectToVideoDetails(video);
                        }}
                      >
                        Details
                      </Button>
                    </Col>
                  )}
                  {buyable && (
                    <Col xs={12}>
                      <Button
                        block
                        type="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          showPurchaseModal(video);
                        }}
                      >
                        {video?.price === 0 ? 'Get' : 'Buy'}
                      </Button>
                    </Col>
                  )}
                </Row>
              </Col>
            )}
          </Row>
        </Col>
      </Row>
    </Card>
  );
};

export default VideoCard;
