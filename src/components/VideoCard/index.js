import React from 'react';
import classNames from 'classnames';
import ReactHtmlParser from 'react-html-parser';

import { Row, Col, Card, Button, Typography, Image, Space, Grid, Divider } from 'antd';
import { PlayCircleOutlined, BookTwoTone } from '@ant-design/icons';

import DefaultImage from 'components/Icons/DefaultImage';

import dateUtil from 'utils/date';
import { videoSourceType } from 'utils/constants';
import { redirectToVideosPage } from 'utils/redirect';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const {
  formatDate: { toShortDateWithYear },
} = dateUtil;

const noop = () => {};

// This card will be used for 3 purposes
// 1) Becomes a buyable card so the user can directly buy by clicking this card (buyable = true, also pass showAuthModal)
// 2) Becomes a simple display card where the user cannot buy (buyable = false, can show details button or desc if needed)
// 3) Used in attendee dashboard as video player and also show order details (showOrderDetails = true and send orderDetails)
const VideoCard = ({
  cover = null,
  video,
  buyable = false,
  hoverable = true,
  showOrderDetails = false,
  orderDetails = null,
  onCardClick = redirectToVideosPage,
  showAuthModal = noop,
  showDesc = false,
  showDetailsBtn = true,
}) => {
  const { lg } = useBreakpoint();

  const renderVideoOrderDetails = () => {
    if (!lg) {
      return video.source === videoSourceType.CLOUDFLARE ? (
        <Space size={1} align="center" direction="vertical" className={styles.orderDetailsWrapper}>
          <Text strong className={styles.blueText}>
            Available From : {toShortDateWithYear(orderDetails.beginning)} - {toShortDateWithYear(orderDetails.expiry)}
          </Text>
          <Divider className={classNames(styles.divider, styles.horizontal)} />
          <Text strong className={styles.blueText}>
            Allowed Watches : {orderDetails.watch_limit}
          </Text>
          <Divider className={classNames(styles.divider, styles.horizontal)} />
          <Text strong className={styles.blueText}>
            You've watched {orderDetails.num_views} times
          </Text>
        </Space>
      ) : (
        <Space size={1} align="center" direction="vertical" className={styles.orderDetailsWrapper}>
          <Text strong className={styles.blueText}>
            Available From : {toShortDateWithYear(orderDetails.beginning)} - {toShortDateWithYear(orderDetails.expiry)}
          </Text>
        </Space>
      );
    }

    return video.source === videoSourceType.CLOUDFLARE ? (
      <Space size="middle" align="center" split={<Divider className={styles.divider} type="vertical" />}>
        <Title level={5} className={styles.blueText}>
          Available From : {toShortDateWithYear(orderDetails.beginning)} - {toShortDateWithYear(orderDetails.expiry)}
        </Title>
        <Title level={5} className={styles.blueText}>
          Allowed Watches : {orderDetails.watch_limit}
        </Title>
        <Title level={5} className={styles.blueText}>
          You've watched {orderDetails.num_views} times
        </Title>
      </Space>
    ) : (
      <Space size="middle" align="center" split={<Divider className={styles.divider} type="vertical" />}>
        <Title level={5} className={styles.blueText}>
          Available From : {toShortDateWithYear(orderDetails.beginning)} - {toShortDateWithYear(orderDetails.expiry)}
        </Title>
      </Space>
    );
  };

  const videoThumbnailUrl = video?.thumbnail_url || orderDetails?.thumbnail_url || 'error';

  return (
    <Card
      className={styles.videoCard}
      hoverable={hoverable}
      bordered={false}
      footer={null}
      onClick={() => onCardClick(video)}
      bodyStyle={{ padding: '10px 20px', backgroundColor: 'var(--video-card-background-color)' }}
      cover={
        cover || (
          <Image
            loading="lazy"
            className={videoThumbnailUrl.endsWith('.gif') ? styles.videoThumbnail : styles.staticVideoThumbnail}
            src={videoThumbnailUrl}
            alt={video?.title || orderDetails?.title}
            fallback={DefaultImage()}
            preview={false}
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
                {video?.title || orderDetails?.title} {video?.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null}
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
                      Price :{' '}
                      {video.pay_what_you_want
                        ? 'Flexible'
                        : video.total_price > 0
                        ? `${video.currency?.toUpperCase()} ${video.total_price}`
                        : 'Free'}
                    </Text>
                  </Col>
                </Row>
              )}
            </Col>
            {showDesc && (
              <>
                <Col xs={24} className={styles.descWrapper}>
                  <Title level={5}> Description </Title>
                  <div className={styles.videoDesc}>
                    {ReactHtmlParser((video?.description || orderDetails?.description)?.split('!~!~!~')[0] ?? '')}
                  </div>
                </Col>
              </>
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
                          redirectToVideosPage(video);
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
                        className={styles.buyBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          showAuthModal(video);
                        }}
                      >
                        {video?.total_price === 0 ? 'Get' : 'Buy'}
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
