import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import classNames from 'classnames';
import ReactHtmlParser from 'react-html-parser';
import moment from 'moment';

import { Row, Col, Typography, message, Space, Image, Button } from 'antd';

import {
  GlobalOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Table from 'components/Table';
import Share from 'components/Share';
import Loader from 'components/Loader';
import SessionCards from 'components/SessionCards';
import VideoCard from 'components/VideoCard';
import ShowcaseCourseCard from 'components/ShowcaseCourseCard';
import DefaultImage from 'components/Icons/DefaultImage';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { isAPISuccess, reservedDomainName, generateUrlFromUsername } from 'utils/helper';

import styles from './styles.module.scss';

const {
  timezoneUtils: { getCurrentLongTimezone },
  formatDate: { toLongDateWithLongDay, toLocaleTime },
} = dateUtil;

const { Title } = Typography;

const CourseDetails = ({ match, history }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [course, setCourse] = useState(null);
  const [courseSession, setCourseSession] = useState(null);
  const [isOnAttendeeDashboard, setIsOnAttendeeDashboard] = useState(false);

  const username = location.state?.username || window.location.hostname.split('.')[0];

  const getProfileDetails = useCallback(async () => {
    try {
      const { data } = username ? await apis.user.getProfileByUsername(username) : await apis.user.getProfile();
      if (data) {
        setProfile(data);
        setProfileImage(data.profile_image_url);
        setIsLoading(false);
      }
    } catch (error) {
      message.error('Failed to load profile details');
      setIsLoading(false);
    }
  }, [username]);

  const getCourseDetails = useCallback(async (courseId) => {
    try {
      const { status, data } = await apis.courses.getDetails(courseId);

      if (isAPISuccess(status) && data) {
        setCourse(data);

        if (data.session?.session_id) {
          const sessionData = await apis.session.getSessionDetails(data.session?.session_id);

          if (isAPISuccess(sessionData.status) && sessionData.data) {
            setCourseSession(sessionData.data);
          }
        }

        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      message.error('Failed to load course details');
    }
  }, []);

  useEffect(() => {
    if (history.location.pathname.includes('dashboard')) {
      setIsOnAttendeeDashboard(true);
    }

    if (match.params.course_id) {
      if (username && !reservedDomainName.includes(username)) {
        getProfileDetails();
        getCourseDetails(match.params.course_id);
      }
    } else {
      setIsLoading(false);
      message.error('Course details not found.');
    }
    //eslint-disable-next-line
  }, [match.params.course_id]);

  const redirectToVideoDetails = (video) => {
    if (video?.external_id) {
      const baseUrl = generateUrlFromUsername(username || video?.username || 'app');
      window.open(`${baseUrl}/v/${video?.external_id}`);
    }
  };

  const filterInventoryByCourseDate = (inventories) => {
    return inventories.filter(
      (inventory) =>
        moment(inventory.start_time).isSameOrAfter(moment(course.start_date).startOf('day')) &&
        moment(inventory.end_time).isSameOrBefore(moment(course.end_date).endOf('day'))
    );
  };

  const sessionSchedulesColumns = [
    {
      title: 'Session Date',
      key: 'start_time',
      dataIndex: 'start_time',
      width: '60%',
      render: (text, record) => toLongDateWithLongDay(record.start_time),
    },
    {
      title: 'Session Time',
      key: 'end_time',
      dataIndex: 'end_time',
      width: '40%',
      render: (text, record) =>
        `${toLocaleTime(record.start_time)} - ${toLocaleTime(record.end_time)} (${getCurrentLongTimezone()})`,
    },
  ];

  const mainContent = (
    <Loader size="large" text="Loading course details" loading={isLoading}>
      <Row gutter={[8, 24]}>
        {isOnAttendeeDashboard && (
          <Col xs={24} className={styles.mb20}>
            <Button
              onClick={() => history.push(Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.courses)}
              icon={<ArrowLeftOutlined />}
            >
              Back to Course List
            </Button>
          </Col>
        )}

        <Col xs={24} className={styles.creatorProfileWrapper}>
          <Row className={styles.imageWrapper} gutter={[8, 8]}>
            <Col xs={24} className={styles.profileImageWrapper}>
              <div className={styles.profileImage}>
                <Image
                  preview={false}
                  width={'100%'}
                  src={profileImage ? profileImage : 'error'}
                  fallback={DefaultImage()}
                />
                <div className={styles.userName}>
                  <Title level={isMobileDevice ? 4 : 2}>
                    {profile?.first_name} {profile?.last_name}
                  </Title>
                </div>
                <div className={styles.shareButton}>
                  <Share
                    label="Share"
                    shareUrl={generateUrlFromUsername(profile.username)}
                    title={`${profile.first_name} ${profile.last_name}`}
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} md={{ span: 22, offset: 1 }}>
              <div className={styles.bio}>{ReactHtmlParser(profile?.profile?.bio)}</div>
            </Col>
            <Col xs={24} md={{ span: 22, offset: 1 }}>
              {profile?.profile?.social_media_links && (
                <Space size={'middle'}>
                  {profile.profile.social_media_links.website && (
                    <a href={profile.profile.social_media_links.website} target="_blank" rel="noopener noreferrer">
                      <GlobalOutlined className={styles.socialIcon} />
                    </a>
                  )}
                  {profile.profile.social_media_links.facebook_link && (
                    <a
                      href={profile.profile.social_media_links.facebook_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FacebookOutlined className={styles.socialIcon} />
                    </a>
                  )}
                  {profile.profile.social_media_links.twitter_link && (
                    <a href={profile.profile.social_media_links.twitter_link} target="_blank" rel="noopener noreferrer">
                      <TwitterOutlined className={styles.socialIcon} />
                    </a>
                  )}
                  {profile.profile.social_media_links.instagram_link && (
                    <a
                      href={profile.profile.social_media_links.instagram_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <InstagramOutlined className={styles.socialIcon} />
                    </a>
                  )}
                  {profile.profile.social_media_links.linkedin_link && (
                    <a
                      href={profile.profile.social_media_links.linkedin_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <LinkedinOutlined className={styles.socialIcon} />
                    </a>
                  )}
                </Space>
              )}
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          {course && (
            <Row classname={classNames(styles.box, styles.p20)} gutter={[8, 24]}>
              <Col xs={24}>
                <ShowcaseCourseCard course={course} username={username} />
              </Col>

              {courseSession && (
                <>
                  <Col xs={24}>
                    <Title level={3} className={styles.ml20}>
                      Course Session
                    </Title>
                  </Col>
                  <Col xs={24}>
                    <SessionCards sessions={[courseSession]} shouldFetchInventories={false} username={username} />
                  </Col>
                  <Col xs={24}>
                    <Title level={3} className={styles.ml20}>
                      Course Schedules
                    </Title>
                    <Table
                      columns={sessionSchedulesColumns}
                      data={filterInventoryByCourseDate(courseSession.inventory)}
                      rowKey={(record) => record.inventory_id}
                    />
                  </Col>
                </>
              )}

              {course.videos?.length > 0 && (
                <Col xs={24}>
                  <Row gutter={[8, 8]}>
                    <Col xs={24}>
                      <Title level={3} className={styles.ml20}>
                        Course Videos
                      </Title>
                    </Col>
                    <Col xs={24}>
                      <Row gutter={[8, 8]}>
                        {course.videos?.map((video) => (
                          <Col xs={24} md={12} key={video?.external_id}>
                            <VideoCard
                              video={video}
                              buyable={false}
                              onCardClick={() => redirectToVideoDetails(video)}
                              showDetailsBtn={false}
                            />
                          </Col>
                        ))}
                      </Row>
                    </Col>
                  </Row>
                </Col>
              )}
            </Row>
          )}
        </Col>
      </Row>
    </Loader>
  );

  if (isOnAttendeeDashboard) {
    return (
      <Row>
        <Col xs={2} md={isMobileDevice ? 4 : 1} lg={1}></Col>
        <Col xs={20} md={isMobileDevice ? 16 : 22} lg={22}>
          {mainContent}
        </Col>
        <Col xs={2} md={isMobileDevice ? 4 : 1} lg={1}></Col>
      </Row>
    );
  } else {
    return mainContent;
  }
};

export default CourseDetails;
