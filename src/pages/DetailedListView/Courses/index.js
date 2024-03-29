import React, { useState, useCallback, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { Row, Col, Button, Affix, Select, Spin, Empty, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';
import dummy from 'data/dummy';

import CourseListItem from 'components/DynamicProfileComponents/CoursesProfileComponent/CoursesListItem';

import { isAPISuccess } from 'utils/helper';
import { getUsernameFromUrl } from 'utils/url';
import { isInIframeWidget } from 'utils/widgets';
import { reservedDomainName } from 'utils/constants';
import { generateColorPalletteForProfile, getNewProfileUIMaxWidth } from 'utils/colors';
import {
  getLiveCoursesFromCourses,
  getMixedCoursesFromCourses,
  getVideoCoursesFromCourses,
} from 'utils/productsHelper';

import styles from './style.module.scss';

const filterOptions = [
  {
    label: 'All Courses',
    value: 'all',
  },
  {
    label: 'Video only courses',
    value: 'video',
  },
  {
    label: 'Live sessions only courses',
    value: 'live',
  },
  {
    label: 'Mixed courses',
    value: 'mixed',
  },
];

const CourseDetailedListView = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourseType, setSelectedCourseType] = useState('all');

  const [creatorProfile, setCreatorProfile] = useState(null);

  const fetchCreatorCourses = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.courses.getCoursesByUsername();

      if (isAPISuccess(status) && data) {
        setCourses(data);
      }
    } catch (error) {
      message.error('Failed to fetch courses for creator');
      console.error(error);
    }

    setIsLoading(false);
  }, []);

  const fetchCreatorProfileDetails = useCallback(async (creatorUsername) => {
    try {
      const { status, data } = creatorUsername
        ? await apis.user.getProfileByUsername(creatorUsername)
        : await apis.user.getProfile();

      if (isAPISuccess(status) && data) {
        setCreatorProfile(data);
      }
    } catch (error) {
      message.error('Failed to fetch creator profile details');
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const domainUsername = getUsernameFromUrl();

    if (domainUsername && !reservedDomainName.includes(domainUsername)) {
      fetchCreatorProfileDetails(domainUsername);
    }
  }, [fetchCreatorProfileDetails]);

  useEffect(() => {
    if (!creatorProfile?.profile?.live_mode && !isInIframeWidget()) {
      setCourses(dummy[creatorProfile?.profile?.category ?? 'YOGA'].COURSES ?? []);
      setTimeout(() => setIsLoading(false), 800);
    } else {
      fetchCreatorCourses();
    }
  }, [fetchCreatorCourses, creatorProfile]);

  useEffect(() => {
    let profileStyleObject = {};
    if (creatorProfile && creatorProfile?.profile?.new_profile) {
      profileStyleObject = { ...profileStyleObject, ...getNewProfileUIMaxWidth() };
    }

    if (creatorProfile && creatorProfile?.profile?.color) {
      profileStyleObject = {
        ...profileStyleObject,
        ...generateColorPalletteForProfile(creatorProfile?.profile?.color, creatorProfile?.profile?.new_profile),
      };
    }

    Object.entries(profileStyleObject).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });

    return () => {
      if (profileStyleObject) {
        Object.keys(profileStyleObject).forEach((key) => {
          document.documentElement.style.removeProperty(key);
        });
      }
    };
  }, [creatorProfile]);

  const handleBackClicked = () => history.push(Routes.courses);

  const renderCourseItems = (course) => (
    <Col xs={24} sm={12} md={!creatorProfile?.profile?.new_profile ? 12 : 8} key={course.id}>
      <CourseListItem course={course} />
    </Col>
  );

  // NOTE : Match these with the filterOptions at the top
  const getCoursesFromSelectedType = () => {
    switch (selectedCourseType) {
      case 'all':
        return courses;
      case 'video':
        return getVideoCoursesFromCourses(courses);
      case 'live':
        return getLiveCoursesFromCourses(courses);
      case 'mixed':
        return getMixedCoursesFromCourses(courses);
      default:
        return courses;
    }
  };

  return (
    <div className={styles.p10}>
      <Spin size="large" spinning={isLoading} tip="Fetching creator courses...">
        {courses.length > 0 ? (
          <>
            <Affix offsetTop={isInIframeWidget() ? 0 : 60}>
              <div className={styles.stickyHeader}>
                <Row gutter={8}>
                  {isInIframeWidget() ? (
                    <Col xs={24}>
                      <Select
                        size="large"
                        defaultValue="all"
                        className={styles.courseFilter}
                        onChange={setSelectedCourseType}
                        onClear={() => setSelectedCourseType('all')}
                        value={selectedCourseType}
                        options={filterOptions}
                      />
                    </Col>
                  ) : (
                    <>
                      <Col xs={4} md={2}>
                        <Button
                          size="large"
                          type="primary"
                          className={styles.backButton}
                          icon={<ArrowLeftOutlined />}
                          onClick={handleBackClicked}
                        />
                      </Col>
                      <Col xs={20} md={22}>
                        <Select
                          size="large"
                          defaultValue="all"
                          className={styles.courseFilter}
                          onChange={setSelectedCourseType}
                          onClear={() => setSelectedCourseType('all')}
                          value={selectedCourseType}
                          options={filterOptions}
                        />
                      </Col>
                    </>
                  )}
                </Row>
              </div>
            </Affix>

            <Row className={styles.mt30} gutter={[8, 16]}>
              {getCoursesFromSelectedType().length > 0 ? (
                getCoursesFromSelectedType().map(renderCourseItems)
              ) : (
                <Empty className={styles.w100} description="No courses matches that filter" />
              )}
            </Row>
          </>
        ) : (
          <Empty className={styles.w100} description="No courses found for creator">
            {!isInIframeWidget() && (
              <Button
                className={styles.backButton}
                size="large"
                type="primary"
                icon={<ArrowLeftOutlined />}
                onClick={() => history.push(Routes.root)}
              >
                Back to home
              </Button>
            )}
          </Empty>
        )}
      </Spin>
    </div>
  );
};

export default CourseDetailedListView;
