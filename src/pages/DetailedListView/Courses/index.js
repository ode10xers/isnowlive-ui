import React, { useState, useCallback, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { Row, Col, Button, Affix, Select, Spin, Empty, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import CourseListItem from 'components/DynamicProfileComponents/CoursesProfileComponent/CoursesListItem';

import { isAPISuccess } from 'utils/helper';
import { isInIframeWidget } from 'utils/widgets';
import { getLiveCoursesFromCourses, getVideoCoursesFromCourses } from 'utils/productsHelper';

import styles from './style.module.scss';

const filterOptions = [
  {
    label: 'All Courses',
    value: 'all',
  },
  {
    label: 'Video Courses',
    value: 'video',
  },
  {
    label: 'Live Session Courses',
    value: 'live',
  },
];

const CourseDetailedListView = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourseType, setSelectedCourseType] = useState('all');

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

  useEffect(() => {
    fetchCreatorCourses();
  }, [fetchCreatorCourses]);

  const handleBackClicked = () => history.push(Routes.courses);

  const renderCourseItems = (course) => (
    <Col xs={24} sm={12} key={course.id}>
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
                          className={styles.blueText}
                          size="large"
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
            <Button
              className={styles.blueText}
              size="large"
              icon={<ArrowLeftOutlined />}
              onClick={() => history.push(Routes.root)}
            >
              Back to home
            </Button>
          </Empty>
        )}
      </Spin>
    </div>
  );
};

export default CourseDetailedListView;
