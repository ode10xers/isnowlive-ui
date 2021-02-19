import React from 'react';

import { Row, Col } from 'antd';

import LiveCourseCard from 'components/LiveCourseCard';

import { generateUrlFromUsername } from 'utils/helper';

import styles from './styles.module.scss';

const PublicLiveCourseList = ({ username = null, liveCourses }) => {
  const redirectToCourseDetails = (liveCourse) => {
    if (liveCourse?.id) {
      const baseUrl = generateUrlFromUsername(username || liveCourse?.username || 'app');
      window.open(`${baseUrl}/c/${liveCourse?.id}`);
    }
  };

  return (
    <div className={styles.box}>
      <Row justify="start" gutter={[20, 20]}>
        {liveCourses?.map((liveCourse) => (
          <Col xs={24} lg={12} key={liveCourse?.id}>
            <LiveCourseCard course={liveCourse} onCardClick={() => redirectToCourseDetails(liveCourse)} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default PublicLiveCourseList;
