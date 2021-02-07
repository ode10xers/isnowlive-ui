import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import moment from 'moment';

import { Row, Col, Typography, Empty, Image, Collapse } from 'antd';
import apis from 'apis';
import Routes from 'routes';
import Loader from 'components/Loader';
import { showErrorModal } from 'components/Modals/modals';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const Videos = () => {
  const history = useHistory();
  const [activeVideos, setActiveVideos] = useState([]);
  const [expiredVideos, setExpiredVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getVideosForCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apis.videos.getAttendeeVideos();

      setActiveVideos(data.active);
      setExpiredVideos(data.expired);
    } catch (error) {
      showErrorModal('Failed fetching videos', error.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getVideosForCreator();
    //eslint-disable-next-line
  }, []);

  const renderVideoItem = (video) => {
    return (
      <Col
        xs={24}
        md={12}
        lg={8}
        className={styles.videoItem}
        onClick={() =>
          history.push(
            Routes.attendeeDashboard.rootPath +
              Routes.attendeeDashboard.videos +
              `/${video.video_id}/${video.video_order_id}`
          )
        }
      >
        <Row gutter={[8, 8]}>
          <Col xs={24} md={11}>
            <Image height={80} className={styles.coverImage} src={video.thumbnail_url} preview={false} />
          </Col>
          <Col xs={24} md={1}></Col>
          <Col xs={24} md={12}>
            <Row>
              <Col xs={24}>
                <Title level={4}>{video.title}</Title>
              </Col>
              <Col xs={24}>
                {video.price === 0 ? (
                  <Text type="secondary">Free video</Text>
                ) : (
                  <Text type="secondary">
                    {video.currency} {video.price}
                  </Text>
                )}
              </Col>
              <Col xs={24}>
                <Text type="secondary">Expire {moment(video.expiry).fromNow()}</Text>
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
          <Title level={4}> Videos </Title>
        </Col>
        <Col xs={24}>
          <Collapse>
            <Panel header={<Title level={5}> Active </Title>} key="Active">
              {activeVideos.length ? (
                <Loader loading={isLoading} size="large" text="Loading Active Videos">
                  <Row gutter={[8, 16]}>{activeVideos.map(renderVideoItem)}</Row>
                </Loader>
              ) : (
                <Empty description={'No Active Videos'} />
              )}
            </Panel>
            <Panel header={<Title level={5}> Expired </Title>} key="Expired">
              {expiredVideos.length ? (
                <Loader loading={isLoading} size="large" text="Loading Expired Videos">
                  <Row gutter={[8, 16]}>{expiredVideos.map(renderVideoItem)}</Row>
                </Loader>
              ) : (
                <Empty description={'No Expired Videos'} />
              )}
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default Videos;
