import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Typography, Empty, Image } from 'antd';
import apis from 'apis';

import Loader from 'components/Loader';
import { showErrorModal } from 'components/Modals/modals';
import { generateUrlFromUsername } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getVideosForCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apis.videos.getCreatorVideos();
      console.log(data);
      setVideos([
        {
          id: 1,
          cover_image: 'https://dkfqbuenrrvge.cloudfront.net/image/msJ9placWNxt8bGA_city01.jpeg',
          title: 'Test Video 1',
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ipsum dolor, gravida et blandit et, pellentesque a justo. Aenean id nulla nibh. Mauris euismod erat et quam auctor lobortis. Duis posuere neque a diam sollicitudin consequat. Aliquam sapien metus, lacinia quis pulvinar eget, gravida quis augue. Sed non pretium enim. Morbi ornare dignissim arcu, eget mollis erat tempus at. Proin convallis dui id pellentesque accumsan. Aenean finibus nibh sed dictum ultrices. Maecenas rutrum, odio quis consequat bibendum, urna orci tempor libero, quis pharetra nibh nisi eget massa. Fusce in commodo magna. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sed lacus nec mi ullamcorper pretium.',
          sessions: [25],
          price: 10,
          currency: 'USD',
          validity: 24,
          username: 'sanketkarve',
          published: false,
        },
        {
          id: 2,
          cover_image: 'https://dkfqbuenrrvge.cloudfront.net/image/msJ9placWNxt8bGA_city01.jpeg',
          title: 'Test Video 2',
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ipsum dolor, gravida et blandit et, pellentesque a justo. Aenean id nulla nibh. Mauris euismod erat et quam auctor lobortis. Duis posuere neque a diam sollicitudin consequat. Aliquam sapien metus, lacinia quis pulvinar eget, gravida quis augue. Sed non pretium enim. Morbi ornare dignissim arcu, eget mollis erat tempus at. Proin convallis dui id pellentesque accumsan. Aenean finibus nibh sed dictum ultrices. Maecenas rutrum, odio quis consequat bibendum, urna orci tempor libero, quis pharetra nibh nisi eget massa. Fusce in commodo magna. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sed lacus nec mi ullamcorper pretium. 2',
          sessions: [25],
          price: 0,
          currency: 'USD',
          validity: 24,
          username: 'sanketkarve',
          published: false,
        },
        {
          id: 3,
          cover_image: 'https://dkfqbuenrrvge.cloudfront.net/image/msJ9placWNxt8bGA_city01.jpeg',
          title: 'Test Video 3',
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ipsum dolor, gravida et blandit et, pellentesque a justo. Aenean id nulla nibh. Mauris euismod erat et quam auctor lobortis. Duis posuere neque a diam sollicitudin consequat. Aliquam sapien metus, lacinia quis pulvinar eget, gravida quis augue. Sed non pretium enim. Morbi ornare dignissim arcu, eget mollis erat tempus at. Proin convallis dui id pellentesque accumsan. Aenean finibus nibh sed dictum ultrices. Maecenas rutrum, odio quis consequat bibendum, urna orci tempor libero, quis pharetra nibh nisi eget massa. Fusce in commodo magna. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sed lacus nec mi ullamcorper pretium. 2',
          sessions: [25],
          price: 0,
          currency: 'USD',
          validity: 24,
          username: 'sanketkarve',
          published: false,
        },
      ]);

      // if (data) {
      //   setVideos(
      //     data.map((classPass, index) => ({
      //       index,
      //       key: classPass.id,
      //       id: classPass.id,
      //       name: classPass.name,
      //       price: classPass.price,
      //       limited: classPass.limited,
      //       currency: classPass.currency,
      //       validity: classPass.validity,
      //       class_count: classPass.class_count,
      //       is_published: classPass.is_published,
      //       sessions: classPass.sessions,
      //       subscribers: classPass.subscribers.map((subs) => ({ ...subs, currency: classPass.currency })),
      //       color_code: classPass.color_code,
      //     }))
      //   );
      // }
    } catch (error) {
      showErrorModal('Failed fetching videos', error.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getVideosForCreator();
    //eslint-disable-next-line
  }, []);

  const redirectToVideoPreview = (video) => {
    if (video.username) {
      const baseUrl = generateUrlFromUsername(video.username || 'app');
      window.open(`${baseUrl}/v/${video.id}`);
    }
  };

  const renderVideoItem = (video) => {
    return (
      <Col xs={24} md={12} lg={8} className={styles.videoItem} onClick={() => redirectToVideoPreview(video)}>
        <Row gutter={[8, 8]}>
          <Col xs={24} md={11}>
            <Image height={80} className={styles.coverImage} src={video.cover_image} preview={false} />
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
                    {video.currency} {video.price}{' '}
                  </Text>
                )}
              </Col>
              <Col xs={24}>
                <Text type="secondary">Validity {video.validity} Hrs</Text>
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
          {videos.length ? (
            <Loader loading={isLoading} size="large" text="Loading Videos">
              <Row gutter={[8, 16]}>{videos.map(renderVideoItem)}</Row>
            </Loader>
          ) : (
            <Empty description={'No Videos'} />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Videos;
