import React from 'react';

import { Row, Col, Image, Card, Typography, Button, Divider } from 'antd';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { isValidFile } from 'utils/helper';

import styles from './styles.module.scss';
const DefaultImage = require('assets/images/greybg.jpg');

const { Text } = Typography;
const {
  formatDate: { toShortDateWithYear },
} = dateUtil;

const noop = () => {};

const LiveCourseCard = ({ course, onCardClick = noop, buyable = false, showPurchaseModal = noop }) => {
  return (
    <Card className={styles.liveCourseCard} bodyStyle={{ padding: '8px' }} onClick={() => onCardClick(course)}>
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
                  {' '}
                  {`${toShortDateWithYear(course?.start_date)} - ${toShortDateWithYear(course?.end_date)}`}{' '}
                </Text>
              </Col>
              <Col xs={24} className={styles.courseDetailsWrapper}>
                <Text type="secondary"> {course?.videos?.length} Videos </Text>
                <Divider type="vertical" />
                <Text type="secondary"> {course?.inventory_ids?.length} Sessions </Text>
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
                  {`${toShortDateWithYear(course?.start_date)} - ${toShortDateWithYear(course?.end_date)}`}
                </Text>
              </Col>
              <Col xs={24} className={styles.courseDetailsWrapper}>
                <Text type="secondary"> {course?.videos?.length} Videos </Text>
                <Divider type="vertical" />
                <Text type="secondary"> {course?.inventory_ids?.length} Sessions </Text>
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
