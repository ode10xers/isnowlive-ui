import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Empty, Spin, message } from 'antd';

import apis from 'apis';
import layouts from '../layouts';

import CoursesListItem from 'components/DynamicProfileComponents/CoursesProfileComponent/CoursesListItem';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const CourseList = ({ layout = layouts.GRID, padding = 8 }) => {
  const isGrid = layout === layouts.GRID;

  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCreatorCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.courses.getCoursesByUsername();

      if (isAPISuccess(status) && data) {
        setCourses(data);
      }
    } catch (error) {
      console.error(error);
      message.error('Failed to fetch courses for creator');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorCourses();
  }, [fetchCreatorCourses]);

  const renderCourseItems = (course) => (
    <Col xs={isGrid ? 24 : 20} md={isGrid ? 12 : 10} lg={isGrid ? 8 : 9} key={course.id}>
      <CoursesListItem course={course} />
    </Col>
  );

  return (
    <div
      style={{
        padding: typeof padding === 'string' ? parseInt(padding) : padding,
      }}
    >
      <Spin spinning={isLoading} tip="Fetching courses data...">
        {courses.length > 0 ? (
          <Row gutter={[8, 8]} className={isGrid ? undefined : styles.horizontalScrollableListContainer}>
            {courses.map(renderCourseItems)}
          </Row>
        ) : (
          <Empty description="No courses found" />
        )}
      </Spin>
    </div>
  );
};

export default CourseList;
