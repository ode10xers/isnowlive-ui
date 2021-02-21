import React from 'react';

import { Row, Col, Image, Card, Typography, Button, Tag } from 'antd';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { isValidFile, courseType } from 'utils/helper';

import styles from './styles.module.scss';
const DefaultImage = require('assets/images/greybg.jpg');

const { Text } = Typography;
const {
  formatDate: { toShortDateWithYear },
} = dateUtil;

const noop = () => {};

//TODO: Since mobile and desktop very similar designs, refactor to be responsive
const LiveCourseCard = ({ course, onCardClick = noop, buyable = false, showPurchaseModal = noop }) => {
  return (
    <Card
      hoverable={true}
      className={styles.liveCourseCard}
      bodyStyle={{ padding: '8px 8px 0px' }}
      onClick={() => onCardClick(course)}
    >
      {isMobileDevice ? (
        <Row gutter={[8, 4]}>
          <Col xs={24} className={styles.courseImageWrapper}>
            <Image
              preview={false}
              height={100}
              className={styles.courseImage}
              src={isValidFile(course?.course_image_url) ? course?.course_image_url : DefaultImage}
            />
          </Col>
          <Col xs={24} className={styles.courseInfoWrapper}>
            <Row gutter={[8, 8]}>
              <Col xs={24} className={styles.courseNameWrapper}>
                <Text strong> {course?.name} </Text>
              </Col>
              <Col xs={24} className={styles.courseDetailsWrapper}>
                <Text type="secondary">
                  {course?.type === courseType.LIVE
                    ? `${toShortDateWithYear(course?.start_date)} - ${toShortDateWithYear(course?.end_date)}`
                    : `Validity: ${course?.validity} days`}
                </Text>
              </Col>
              <Col xs={24} className={styles.courseDetailsWrapper}>
                {course?.videos?.length > 0 && <Tag color="blue"> {course?.videos?.length} Videos </Tag>}
                {course?.inventory_ids?.length > 0 && (
                  <Tag color="volcano"> {course?.inventory_ids?.length} Sessions </Tag>
                )}
              </Col>
              <Col xs={24} className={styles.coursePriceWrapper}>
                <Text strong className={styles.blueText}>
                  {course?.currency?.toUpperCase()} {course?.price}
                </Text>
              </Col>
            </Row>
          </Col>
          <Col xs={buyable ? 24 : 0} className={styles.buyButtonWrapper}>
            <Button
              block
              className={styles.buyButton}
              type="primary"
              onClick={(e) => {
                e.stopPropagation();
                showPurchaseModal(course);
              }}
            >
              Buy Course
            </Button>
          </Col>
        </Row>
      ) : (
        <Row gutter={[8, 8]}>
          <Col xs={buyable ? 10 : 14} className={styles.courseImageWrapper}>
            <Image
              preview={false}
              height={116}
              className={styles.courseImage}
              src={isValidFile(course?.course_image_url) ? course?.course_image_url : DefaultImage}
            />
          </Col>
          <Col xs={10} className={styles.courseInfoWrapper}>
            <Row gutter={[8, 4]}>
              <Col xs={24} className={styles.courseNameWrapper}>
                <Text strong> {course?.name} </Text>
              </Col>
              <Col xs={24} className={styles.courseDetailsWrapper}>
                <Text type="secondary">
                  {course?.type === courseType.LIVE
                    ? `${toShortDateWithYear(course?.start_date)} - ${toShortDateWithYear(course?.end_date)}`
                    : `Validity: ${course?.validity} days`}
                </Text>
              </Col>
              <Col xs={24} className={styles.courseDetailsWrapper}>
                {course?.videos?.length > 0 && <Tag color="blue"> {course?.videos?.length} Videos </Tag>}
                {course?.inventory_ids?.length > 0 && (
                  <Tag color="volcano"> {course?.inventory_ids?.length} Sessions </Tag>
                )}
              </Col>
              <Col xs={24} className={styles.coursePriceWrapper}>
                <Text strong className={styles.blueText}>
                  {course?.currency?.toUpperCase()} {course?.price}
                </Text>
              </Col>
            </Row>
          </Col>
          <Col xs={buyable ? 4 : 0} className={styles.buyButtonWrapper}>
            <Button
              block
              className={styles.buyButton}
              type="primary"
              onClick={(e) => {
                e.stopPropagation();
                showPurchaseModal(course);
              }}
            >
              Buy Course
            </Button>
          </Col>
        </Row>
      )}
    </Card>
  );
};

export default LiveCourseCard;
