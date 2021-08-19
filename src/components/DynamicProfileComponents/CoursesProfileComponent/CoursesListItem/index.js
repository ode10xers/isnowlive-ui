import React from 'react';
import classNames from 'classnames';

import { Card, Typography, Image, Row, Col } from 'antd';

import dateUtil from 'utils/date';
import { courseType, isValidFile, preventDefaults } from 'utils/helper';
import { redirectToCoursesPage } from 'utils/redirect';

import styles from './style.module.scss';
const DefaultImage = require('assets/images/greybg.jpg');

const {
  formatDate: { toDate, toShortMonth },
} = dateUtil;

const { Title } = Typography;

const CourseListItem = ({ course }) => {
  const courseImage = (
    <div className={styles.courseCoverContainer}>
      <div className={styles.courseImageContainer}>
        <Image
          preview={false}
          className={styles.courseImage}
          src={isValidFile(course?.course_image_url) ? course?.course_image_url : DefaultImage}
        />
      </div>
    </div>
  );

  const courseName = (
    <Title
      level={4}
      className={classNames(
        styles.courseName,
        course?.name.length <= 28
          ? styles.textLength28
          : course?.name.length <= 56
          ? styles.textLength56
          : styles.textLength84
      )}
    >
      {course?.name}
    </Title>
  );

  const renderCourseDate = (date) => `${toDate(date)} ${toShortMonth(date)}`;

  const renderCoursePrice = () => {
    if (course?.pay_what_you_want) {
      return 'Flexible';
    } else if (course?.total_price === 0 || course?.currency === '') {
      return 'Free';
    } else {
      return `${course?.currency?.toUpperCase()} ${course?.total_price}`;
    }
  };

  const bottomCardBar = (
    <Row className={styles.cardFooter}>
      <Col flex="1 1 auto" className={styles.timeText}>
        {course.type === courseType.VIDEO
          ? `VALIDITY : ${course?.validity} DAY${course?.validity > 1 ? 'S' : ''}`
          : `${renderCourseDate(course?.start_date)} - ${renderCourseDate(course?.end_date)}`}
      </Col>
      <Col flex="0 0 70px" className={styles.priceText}>
        {renderCoursePrice()}
      </Col>
    </Row>
  );

  const handleCardClicked = (e) => {
    preventDefaults(e);
    redirectToCoursesPage(course);
  };

  return (
    <Card className={styles.courseListItem} cover={courseImage} bodyStyle={{ padding: 0 }} onClick={handleCardClicked}>
      <Row>
        <Col xs={24}>{courseName}</Col>
        <Col xs={24}>{bottomCardBar}</Col>
      </Row>
    </Card>
  );
};

export default CourseListItem;
