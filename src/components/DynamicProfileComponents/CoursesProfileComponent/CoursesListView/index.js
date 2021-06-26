import React from 'react';

import { Row, Col, Button } from 'antd';

import CoursesListItem from '../CoursesListItem';

import styles from './style.module.scss';
import Routes from 'routes';
import { useHistory } from 'react-router-dom';

const CoursesListView = ({ limit = 2, courses = [] }) => {
  const history = useHistory();

  const renderCourseCards = (course) => (
    <Col xs={24} sm={12} key={course.id}>
      <CoursesListItem course={course} />
    </Col>
  );

  return (
    <div>
      {courses.length > 0 && (
        <Row gutter={[8, 16]}>
          {courses.slice(0, limit).map(renderCourseCards)}
          {courses.length > limit && (
            <Col xs={24}>
              <Row justify="center">
                <Col>
                  <Button
                    className={styles.moreButton}
                    type="primary"
                    onClick={() => history.push(Routes.list.courses)}
                  >
                    MORE
                  </Button>
                </Col>
              </Row>
            </Col>
          )}
        </Row>
      )}
    </div>
  );
};

export default CoursesListView;
