import React from 'react';

import { Row, Col } from 'antd';

import LiveCourseCard from 'components/LiveCourseCard';

import { generateUrlFromUsername } from 'utils/helper';

import styles from './styles.module.scss';

const PublicCourseList = ({ username = null, courses }) => {
  const redirectToCourseDetails = (course) => {
    if (course?.id) {
      const baseUrl = generateUrlFromUsername(username || course?.username || 'app');
      window.open(`${baseUrl}/c/${course?.id}`);
    }
  };

  return (
    <div className={styles.box}>
      <Row justify="start" gutter={[20, 20]}>
        {courses?.map((course) => (
          <Col xs={24} xl={12}>
            <LiveCourseCard course={course} onCardClick={() => redirectToCourseDetails(course)} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default PublicCourseList;
