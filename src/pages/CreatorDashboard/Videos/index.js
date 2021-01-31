import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Typography, Button, Tooltip, Card, Empty, Image } from 'antd';
import { EditOutlined, CloudUploadOutlined } from '@ant-design/icons';

import apis from 'apis';

import Loader from 'components/Loader';
import UploadVideoModal from 'components/UploadVideoModal';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';
import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const Videos = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const showUploadVideoModal = (video = null) => {
    if (video !== null) {
      setSelectedVideo(video);
    }
    setCreateModalVisible(true);
  };

  const hideUploadVideoModal = (shouldRefresh = false) => {
    setCreateModalVisible(false);
    setSelectedVideo(null);

    if (shouldRefresh) {
      getVideosForCreator();
    }
  };

  const publishVideo = async (videoId) => {
    setIsLoading(true);

    try {
      const { status } = await apis.videos.publishVideo(videoId);

      if (isAPISuccess(status)) {
        showSuccessModal('Video Published');
        getVideosForCreator();
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message);
    }

    setIsLoading(false);
  };

  const unpublishVideo = async (videoId) => {
    setIsLoading(true);

    try {
      const { status } = await apis.videos.unpublishVideo(videoId);

      if (isAPISuccess(status)) {
        showSuccessModal('Video Unpublished');
        getVideosForCreator();
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message);
    }

    setIsLoading(false);
  };

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
          video_url: null,
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
          video_url: null,
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

  const renderVideoItem = (video) => {
    return (
      <Col xs={24}>
        <Card className={styles.card}>
          <Row gutter={[8, 8]}>
            <Col xs={24} md={4}>
              <Image height={72} className={styles.coverImage} src={video.cover_image} preview={false} />
            </Col>
            <Col xs={24} md={1}></Col>
            <Col xs={24} md={7}>
              <Title level={4}>{video.title}</Title>
              <Text type="secondary" className={styles.videoDescription}>
                {video.description}
              </Text>
            </Col>
            <Col xs={24} md={6}>
              <Row justify="center">
                <Col xs={12}>
                  {video.price === 0 ? (
                    <Text>Free video</Text>
                  ) : (
                    <Text>
                      {video.currency} {video.price}{' '}
                    </Text>
                  )}
                </Col>
                <Col xs={12}>
                  <Text>Validity {video.validity} Hrs</Text>
                </Col>
              </Row>
            </Col>
            <Col xs={24} md={6}>
              <Row>
                <Col xs={12}>
                  <Tooltip title="Edit">
                    <Button
                      className={styles.detailsButton}
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => showUploadVideoModal(video)}
                    />
                  </Tooltip>
                </Col>
                <Col xs={12}>
                  {video.published ? (
                    <Tooltip title="Hide Session">
                      <Button type="link" danger onClick={() => unpublishVideo(video.id)}>
                        Hide
                      </Button>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Unhide Session">
                      <Button type="link" className={styles.successBtn} onClick={() => publishVideo(video.id)}>
                        Show
                      </Button>
                    </Tooltip>
                  )}
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      </Col>
    );
  };

  return (
    <div className={styles.box}>
      <UploadVideoModal visible={createModalVisible} closeModal={hideUploadVideoModal} editedVideo={selectedVideo} />
      <Row gutter={[8, 24]}>
        <Col xs={12} md={10} lg={14}>
          <Title level={4}> Videos </Title>
        </Col>
        <Col xs={24}>
          <Button
            className={styles.uploadVideoBtn}
            type="dashed"
            icon={<CloudUploadOutlined />}
            onClick={() => showUploadVideoModal()}
          >
            Upload video
          </Button>
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
