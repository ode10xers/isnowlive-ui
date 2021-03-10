import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import classNames from 'classnames';
import moment from 'moment';

import { Row, Col, Typography, message, Button, Card, Tag } from 'antd';

import { ArrowLeftOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Table from 'components/Table';
import CreatorProfile from 'components/CreatorProfile';
import Loader from 'components/Loader';
import SessionCards from 'components/SessionCards';
import VideoCard from 'components/VideoCard';
import ShowcaseCourseCard from 'components/ShowcaseCourseCard';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import {
  isAPISuccess,
  tagColors,
  getRandomTagColor,
  reservedDomainName,
  generateUrlFromUsername,
  courseType,
} from 'utils/helper';

import styles from './styles.module.scss';

const {
  timezoneUtils: { getCurrentLongTimezone },
  formatDate: { toLongDateWithLongDay, toLocaleTime },
} = dateUtil;

const { Title, Text } = Typography;

const CourseDetails = ({ match, history }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [course, setCourse] = useState(null);
  const [courseSessions, setCourseSessions] = useState(null);
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

        if (data.type === courseType.MIXED && data.sessions?.length > 0) {
          const sessionResponses = await Promise.all(
            data.sessions.map(async (session) => await apis.session.getSessionDetails(session.session_id))
          );
          setCourseSessions(sessionResponses.map((sessionResponse) => sessionResponse.data));
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

  const generateCourseSessionsScheduleList = () => {
    let tableData = [];
    let usedColors = [];

    if (courseSessions?.length > 0) {
      courseSessions.forEach((courseSession) => {
        if (usedColors.length >= tagColors.length) {
          usedColors = [];
        }

        let colorForSession = '';

        do {
          colorForSession = getRandomTagColor();
        } while (usedColors.includes(colorForSession));

        usedColors.push(colorForSession);

        tableData = [
          ...tableData,
          ...filterInventoryByCourseDate(courseSession.inventory)
            .filter((inventory) => course?.inventory_ids?.includes(inventory.inventory_id))
            .map((sessionInventory) => ({
              key: `${courseSession.session_id}_${sessionInventory.inventory_id}`,
              name: courseSession.name,
              start_time: sessionInventory.start_time,
              end_time: sessionInventory.end_time,
              color: colorForSession,
            })),
        ];
      });
    }

    return tableData;
  };

  const sessionSchedulesColumns = [
    {
      title: 'Session Name',
      key: 'name',
      dataIndex: 'name',
      width: '30%',
      render: (text, record) => (
        <Tag className={styles.courseScheduleName} color={record.color || 'blue'}>
          {record.name}
        </Tag>
      ),
    },
    {
      title: 'Session Date',
      key: 'start_time',
      dataIndex: 'start_time',
      width: '30%',
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

  const renderMobileCourseSchedules = (schedule) => {
    const layout = (label, value) => (
      <Row>
        <Col span={5}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={19} className={styles.mobileDetailsText}>
          : {value}
        </Col>
      </Row>
    );

    return (
      <Col xs={24} key={schedule.key}>
        <Card
          bodyStyle={{ padding: '10px' }}
          title={
            <Tag className={styles.courseScheduleName} color={schedule.color}>
              {schedule?.name}
            </Tag>
          }
        >
          {layout('Date', <Text> {toLongDateWithLongDay(schedule.start_time)} </Text>)}
          {layout(
            'Time',
            <Text>
              {' '}
              {`${toLocaleTime(schedule.start_time)} - ${toLocaleTime(
                schedule.end_time
              )} (${getCurrentLongTimezone()})`}{' '}
            </Text>
          )}
        </Card>
      </Col>
    );
  };

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
          {profile && <CreatorProfile profile={profile} profileImage={profileImage} />}
        </Col>
        <Col xs={24}>
          {course && (
            <Row className={classNames(styles.box, styles.p20)} gutter={[8, 24]}>
              <Col xs={24}>
                <Title level={3} className={styles.ml20}>
                  {' '}
                  Course Details{' '}
                </Title>
              </Col>
              <Col xs={24}>
                <ShowcaseCourseCard courses={[course]} username={username} />
              </Col>

              {courseSessions?.length > 0 && (
                <>
                  <Col xs={24}>
                    <Title level={3} className={styles.ml20}>
                      Sessions Included
                    </Title>
                  </Col>
                  <Col xs={24}>
                    <SessionCards sessions={courseSessions} shouldFetchInventories={false} username={username} />
                  </Col>
                  <Col xs={24}>
                    <Title level={3} className={styles.ml20}>
                      Course Schedules
                    </Title>
                    {isMobileDevice ? (
                      <Row gutter={[8, 10]}>
                        {generateCourseSessionsScheduleList().map(renderMobileCourseSchedules)}
                      </Row>
                    ) : (
                      <Table
                        columns={sessionSchedulesColumns}
                        data={generateCourseSessionsScheduleList()}
                        rowKey={(record) => record.key}
                      />
                    )}
                  </Col>
                </>
              )}

              {course.videos?.length > 0 && (
                <Col xs={24}>
                  <Row gutter={[8, 8]}>
                    <Col xs={24}>
                      <Title level={3} className={styles.ml20}>
                        Videos Included
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
