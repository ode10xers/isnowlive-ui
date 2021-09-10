import React, { useState, useMemo, useCallback, useEffect } from 'react';

// import VideoDetailedListView from 'pages/DetailedListView/Videos';

import { Spin, Row, Col, Button, Typography, message } from 'antd';
import { BarsOutlined, LeftOutlined } from '@ant-design/icons';

import VideoListCard from 'components/DynamicProfileComponents/VideosProfileComponent/VideoListCard';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';

const { Title } = Typography;

const mockData = [
  {
    title: 'PWYW But Cloned',
    description: '<p>Desc</p>\n',
    validity: 1,
    price: 15,
    pay_what_you_want: true,
    thumbnail_url: 'https://dkfqbuenrrvge.cloudfront.net/image/FQoQHkWjaGuH17g5_sample_trainer_cover.png',
    watch_limit: 3,
    is_course: false,
    source: 'CLOUDFLARE',
    video_uid: 'd75813aaa24dbb36049c84f362f69096',
    currency: 'sgd',
    external_id: 'd6afe01c-f9bf-433d-a162-fe87a833c9e2',
    is_published: true,
    duration: 489,
    status: 'UPLOAD_SUCCESS',
    creator_username: 'ellianto',
    tags: [],
    total_price: 15,
    sessions: [],
    groups: ['Yoga 101', 'Intermediate Level'],
  },
  {
    title: 'Metube Video',
    description: '<p>Videos are not mine, shoutout to fireship.io (check out his site)</p>\n',
    validity: 1,
    price: 5,
    pay_what_you_want: false,
    thumbnail_url: 'https://img.youtube.com/vi/biOMz4puGt8/hqdefault.jpg',
    watch_limit: 1,
    is_course: false,
    source: 'YOUTUBE',
    currency: 'sgd',
    external_id: '9b19b511-3fa3-43fa-bd95-09b2a65db7b5',
    is_published: true,
    duration: 1,
    status: 'UPLOAD_SUCCESS',
    creator_username: 'ellianto',
    tags: [],
    total_price: 5,
    groups: ['Yoga 101'],
    sessions: [
      {
        price: 16,
        currency: 'sgd',
        max_participants: 10,
        name: 'Yoga at the Park (Guided by: Irini Lembessis) LAVAL',
        session_image_url:
          'https://dkfqbuenrrvge.cloudfront.net/image/6xC6Fn7yFOsqrEo0_desert safari facebook cover.png',
        document_urls: [],
        beginning: '2021-08-28T17:00:00Z',
        expiry: '2021-09-30T16:59:59Z',
        prerequisites: '',
        pay_what_you_want: false,
        recurring: true,
        is_refundable: false,
        refund_before_hours: 0,
        user_timezone_offset: 420,
        user_timezone: 'Indochina Time',
        color_code: '#ff9800',
        is_course: false,
        is_offline: true,
        total_price: 16,
        type: 'NORMAL',
        session_id: 382,
        group: true,
        is_active: true,
        session_external_id: '29ce0e74-113d-4756-a723-eec687f623a9',
        creator_username: 'ellianto',
        tags: [],
      },
    ],
  },
  {
    title: 'Upload in Custom Domain',
    groups: ['Intermediate Level'],
    description: '<p>Testing</p>\n',
    validity: 1,
    price: 8,
    pay_what_you_want: false,
    thumbnail_url: 'https://dkfqbuenrrvge.cloudfront.net/image/FutfpgrTfKvQBqaE_white-bg.jpg',
    watch_limit: 1,
    is_course: false,
    source: 'CLOUDFLARE',
    video_uid: '57a8d23c72d4cf603a97f9fb76522039',
    currency: 'sgd',
    external_id: 'cfb057f8-74e4-4a0c-8221-dbfd385631e7',
    is_published: true,
    duration: 489,
    status: 'UPLOAD_SUCCESS',
    creator_username: 'ellianto',
    tags: [],
    total_price: 8,
    sessions: [],
  },
  {
    title: 'Create, Upload, Cancel after Fix',
    description: '<p>Test</p>\n',
    validity: 1,
    price: 8,
    pay_what_you_want: false,
    thumbnail_url: 'https://dkfqbuenrrvge.cloudfront.net/image/icpyj903a88nfzHZ_thumbnail.gif',
    watch_limit: 1,
    is_course: false,
    source: 'CLOUDFLARE',
    video_uid: '11458eea7ad9e069add75a2fb569df50',
    currency: 'sgd',
    external_id: 'cb4a9cd4-8dc7-4526-9fed-72fb43257a44',
    is_published: true,
    duration: 489,
    status: 'UPLOAD_SUCCESS',
    creator_username: 'ellianto',
    tags: [],
    total_price: 9.6,
    sessions: [],
    groups: ['Pilates', 'Intermediate Level'],
  },
  {
    title: 'Fees on Mees',
    description: '<p>Testing</p>\n',
    validity: 1,
    price: 10,
    pay_what_you_want: false,
    thumbnail_url: 'https://dkfqbuenrrvge.cloudfront.net/image/kV0U0f8MH8Bnju8F_desert safari facebook cover.png',
    watch_limit: 1,
    is_course: false,
    source: 'CLOUDFLARE',
    video_uid: '57a8d23c72d4cf603a97f9fb76522039',
    currency: 'sgd',
    external_id: '95a3ed95-66bc-4a9e-a0be-71d23ed12254',
    is_published: true,
    duration: 489,
    status: 'UPLOAD_SUCCESS',
    creator_username: 'ellianto',
    tags: [],
    total_price: 10,
    groups: ['Intermediate Level'],
    sessions: [],
  },
  {
    title: 'auto add to membership',
    description: '<p>Desc</p>\n',
    validity: 1,
    price: 21,
    pay_what_you_want: false,
    thumbnail_url: 'https://img.youtube.com/vi/705XCEruZFs/hqdefault.jpg',
    watch_limit: 1,
    is_course: false,
    source: 'YOUTUBE',
    currency: 'sgd',
    external_id: 'c03876cf-4ebd-4b86-a684-e174f87b7e53',
    is_published: true,
    duration: 1,
    status: 'UPLOAD_SUCCESS',
    creator_username: 'ellianto',
    tags: [],
    total_price: 21,
    groups: [],
    sessions: [],
  },
];

const otherVideosKey = 'Other Videos';
const videoItemsLimit = 2;

const Videos = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [groupView, setGroupView] = useState(null);

  const fetchCreatorVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Integrate API Here
      const { status, data } = {
        status: 200,
        data: mockData,
      };

      if (isAPISuccess(status) && data) {
        setVideos(data);
      }
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to fetch videos');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorVideos();

    document.body.style.background = 'transparent';
  }, [fetchCreatorVideos]);

  const videosByGroup = useMemo(() => {
    return videos.reduce((acc, video) => {
      let newAcc = { ...acc };

      if (video.groups?.length <= 0) {
        return {
          ...newAcc,
          [otherVideosKey]: [...(newAcc[otherVideosKey] ?? []), video],
        };
      } else {
        video.groups.forEach((group) => {
          newAcc = {
            ...newAcc,
            [group]: [...(newAcc[group] ?? []), video],
          };
        });

        return newAcc;
      }
    }, {});
  }, [videos]);

  const handleVideoItemClicked = (video) => {
    // TODO: Confirm what we want to do here
    console.log(video);
  };

  const handleMoreClicked = (videoGroupName) => {
    setGroupView(videoGroupName);
  };

  const groupedVideoList = (
    <>
      {Object.entries(videosByGroup).map(([groupName, groupVideos]) => (
        <div key={groupName}>
          <Row gutter={[8, 8]}>
            <Col xs={24}>
              <Title level={4} className={styles.videoGroupName}>
                {groupName}
              </Title>
            </Col>
            <Col xs={24}>
              <Row gutter={[8, 8]} align="middle" className={styles.horizontalVideoList}>
                {groupVideos?.slice(0, videoItemsLimit).map((video) => (
                  <Col xs={20} sm={18} md={7} lg={5}>
                    <VideoListCard video={video} handleClick={() => handleVideoItemClicked(video)} />
                  </Col>
                ))}
                {groupVideos?.length > videoItemsLimit && (
                  <Col xs={20} sm={18} md={7} lg={5} className={styles.fadedItemContainer}>
                    <div className={styles.fadedOverlay}>
                      <div className={styles.seeMoreButton} onClick={() => handleMoreClicked(groupName)}>
                        <BarsOutlined className={styles.seeMoreIcon} />
                        SEE MORE
                      </div>
                    </div>
                    <div className={styles.fadedItem}>
                      <VideoListCard video={groupVideos[videoItemsLimit]} />
                    </div>
                  </Col>
                )}
              </Row>
            </Col>
          </Row>
        </div>
      ))}
    </>
  );

  const moreVideoList = (
    <Row gutter={[8, 8]}>
      <Col xs={24}>
        <Button ghost type="primary" onClick={() => setGroupView(null)} icon={<LeftOutlined />}>
          Back to video library
        </Button>
      </Col>
      <Col xs={24}>
        <Title level={4} className={styles.videoGroupName}>
          {groupView}
        </Title>
      </Col>
      <Col xs={24}>
        <Row gutter={[8, 8]} align="middle">
          {videosByGroup[groupView]?.map((video) => (
            <Col xs={24} sm={12} md={8} lg={6}>
              <VideoListCard video={video} handleClick={() => handleVideoItemClicked(video)} />
            </Col>
          ))}
        </Row>
      </Col>
    </Row>
  );

  return (
    <div className={styles.videoPluginContainer}>
      <div className={styles.videoListContainer}>
        <Spin spinning={isLoading} tip="Fetching videos..">
          {/* Filters */}

          {/* List Groups */}
          {!groupView && videos.length > 0 && groupedVideoList}

          {/* See More */}
          {groupView && videosByGroup[groupView].length > 0 && moreVideoList}
        </Spin>
      </div>
    </div>
  );
};

export default Videos;
