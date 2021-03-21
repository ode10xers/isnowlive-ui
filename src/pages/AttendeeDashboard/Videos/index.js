import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Row, Col, Typography, Empty, Image, Collapse } from 'antd';
import apis from 'apis';
import Routes from 'routes';
import Loader from 'components/Loader';
import { showErrorModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const {
  formatDate: { toLongDateWithDayTime },
} = dateUtil;

const Videos = () => {
  const { t: translate } = useTranslation();
  const history = useHistory();
  const [activeVideos, setActiveVideos] = useState([]);
  const [expiredVideos, setExpiredVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getVideosForCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apis.videos.getAttendeeVideos();

      if (data) {
        setActiveVideos(data.active);
        setExpiredVideos(data.expired);
      }
    } catch (error) {
      showErrorModal(
        translate('FAIL_TO_FETCH_VIDEOS'),
        error.response?.data?.message || translate('SOMETHING_WENT_WRONG')
      );
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getVideosForCreator();
    //eslint-disable-next-line
  }, []);

  const renderVideoItem = (video, isExpired) => {
    return (
      <Col
        key={video.video_order_id}
        xs={24}
        lg={12}
        className={styles.videoItem}
        onClick={() =>
          // Sending the video order data, since it's needed in the UI
          history.push(
            Routes.attendeeDashboard.rootPath +
              Routes.attendeeDashboard.videos +
              `/${video.video_id}/${video.video_order_id}`,
            { video_order: { ...video, isExpired } }
          )
        }
      >
        <Row gutter={[10, 10]}>
          <Col xs={24} md={12}>
            <Image height={80} className={styles.coverImage} src={video.thumbnail_url} preview={false} />
          </Col>
          <Col xs={24} md={12}>
            <Row>
              <Col xs={24}>
                <Title level={4}>{video.title}</Title>
              </Col>
              <Col xs={24}>
                {video.price === 0 ? (
                  <Text type="secondary">{translate('FREE_VIDEO')}</Text>
                ) : (
                  <Text type="secondary">
                    {video.currency.toUpperCase()} {video.price}
                  </Text>
                )}
              </Col>
              <Col xs={24}>
                <Text type="secondary" className={styles.expiryText}>
                  {translate('AVAILABLE_TILL')} : {toLongDateWithDayTime(video.expiry)}
                </Text>
              </Col>
            </Row>
          </Col>
        </Row>
      </Col>
    );
  };

  return (
    <div className={styles.box}>
      <Row gutter={[8, 24]}>
        <Col xs={12} md={10} lg={14}>
          <Title level={4}> {translate('VIDEOS')} </Title>
        </Col>
        <Col xs={24}>
          <Collapse>
            <Panel header={<Title level={5}> {translate('ACTIVE')} </Title>} key="Active">
              {activeVideos.length ? (
                <Loader loading={isLoading} size="large" text={translate('LOADING_ACTIVE_VIDEOS')}>
                  <Row gutter={[8, 16]}>{activeVideos.map((video) => renderVideoItem(video, false))}</Row>
                </Loader>
              ) : (
                <Empty description={translate('NO_ACTIVE_VIDEOS')} />
              )}
            </Panel>
            <Panel header={<Title level={5}> {translate('EXPIRED')} </Title>} key="Expired">
              {expiredVideos.length ? (
                <Loader loading={isLoading} size="large" text={translate('LOADING_EXPIRED_VIDEOS')}>
                  <Row gutter={[8, 16]}>{expiredVideos.map((video) => renderVideoItem(video, true))}</Row>
                </Loader>
              ) : (
                <Empty description={translate('NO_EXPIRED_VIDEOS')} />
              )}
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default Videos;
