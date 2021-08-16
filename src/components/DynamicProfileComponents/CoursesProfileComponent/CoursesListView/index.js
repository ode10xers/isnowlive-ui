import React from 'react';
import { useHistory } from 'react-router-dom';

import { Row, Col } from 'antd';
import { BarsOutlined } from '@ant-design/icons';

import Routes from 'routes';

import CoursesListItem from '../CoursesListItem';

import { getLocalUserDetails } from 'utils/storage';
import { generateUrlFromUsername, isInCreatorDashboard, preventDefaults } from 'utils/helper';

import styles from './style.module.scss';

const CoursesListView = ({ limit = 2, courses = [], profileColor }) => {
  const history = useHistory();

  const renderCourseCards = (course) => (
    <Col xs={18} md={8} key={course.id}>
      <CoursesListItem course={course} />
    </Col>
  );

  const handleMoreClicked = (e) => {
    preventDefaults(e);

    if (isInCreatorDashboard()) {
      const localUserDetails = getLocalUserDetails();

      window.open(generateUrlFromUsername(localUserDetails?.username ?? 'app') + Routes.list.courses);
    } else {
      history.push(Routes.list.courses);
    }
  };

  return (
    <div>
      {courses.length > 0 && (
        <Row gutter={[8, 8]} className={styles.courseListContainer}>
          {courses.slice(0, limit).map(renderCourseCards)}
          {courses.length > limit && (
            <Col xs={18} md={8} className={styles.fadedItemContainer}>
              <div className={styles.fadedOverlay}>
                <div className={styles.seeMoreButton} onClick={handleMoreClicked}>
                  <BarsOutlined className={styles.seeMoreIcon} />
                  SEE MORE
                </div>
              </div>
              <div className={styles.fadedItem}>
                <CoursesListItem course={courses[limit]} />
              </div>
            </Col>
          )}
        </Row>
      )}
    </div>
  );
};

export default CoursesListView;
