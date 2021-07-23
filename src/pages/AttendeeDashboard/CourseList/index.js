import React, { useState, useCallback, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import moment from 'moment';
import { Row, Col, Button, Typography, Card, Collapse, Tag, Space, Divider, Image } from 'antd';

import apis from 'apis';
import Routes from 'routes';

import Loader from 'components/Loader';
import Table from 'components/Table';
import DefaultImage from 'components/Icons/DefaultImage';
import { showErrorModal } from 'components/Modals/modals';

import { isMobileDevice } from 'utils/device';
import { isAPISuccess, isUnapprovedUserError } from 'utils/helper';
import { getCourseSessionContentCount, getCourseVideoContentCount } from 'utils/course';

import styles from './styles.module.scss';

const { Text, Title } = Typography;
const { Panel } = Collapse;

const CourseList = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [courseOrders, setCourseOrders] = useState([]);

  const fetchUserCourseOrders = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.courses.getAttendeeCourses();

      if (isAPISuccess(status) && data) {
        setCourseOrders(data);
      }
    } catch (error) {
      if (!isUnapprovedUserError(error.response)) {
        showErrorModal('Something wrong happened', error?.response?.data?.message || 'Failed to fetch course orders');
      }
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUserCourseOrders();
  }, [fetchUserCourseOrders]);

  const redirectToCourseOrderDetails = (courseOrder) => {
    if (courseOrder?.course?.creator_username && courseOrder?.course_order_id) {
      history.push(`${Routes.attendeeDashboard.rootPath}/course/${courseOrder.course_order_id}`);
    }
  };

  const renderCourseContents = (courseOrder) => {
    const sessionCount = getCourseSessionContentCount(courseOrder.course?.modules ?? []);
    const videoCount = getCourseVideoContentCount(courseOrder.course?.modules ?? []);

    return (
      <Tag color="blue">
        <Space split={<Divider type="vertical" />}>
          {sessionCount > 0 ? <Text className={styles.blueText}> {`${sessionCount} sessions`} </Text> : null}
          {videoCount > 0 ? <Text className={styles.blueText}> {`${videoCount} videos`} </Text> : null}
        </Space>
      </Tag>
    );
  };

  const renderCourseDuration = (course) =>
    course?.type === 'VIDEO'
      ? `${course?.validity ?? 0} days`
      : `${moment(course?.end_date)
          .endOf('day')
          .add(1, 'second')
          .diff(moment(course.start_date).startOf('day'), 'days')} days`;

  const renderCourseItem = (item) => {
    const layout = (label, value) => (
      <Row>
        <Col span={7}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={17} className={styles.mobileDetailsText}>
          : {value}
        </Col>
      </Row>
    );

    return (
      <Card
        key={item.course_order_id}
        bodyStyle={{ padding: '10px' }}
        title={
          <div onClick={() => redirectToCourseOrderDetails(item)}>
            <Text>{item?.course?.name}</Text>
          </div>
        }
        actions={[
          <Button type="link" size="large" onClick={() => redirectToCourseOrderDetails(item)}>
            Details
          </Button>,
        ]}
      >
        <div onClick={() => redirectToCourseOrderDetails(item)}>
          {layout('Contents', renderCourseContents(item))}
          {layout('Duration', <Text>{renderCourseDuration(item.course)}</Text>)}
          {layout('Price', <Text>{item?.price > 0 ? `${item?.currency?.toUpperCase()} ${item?.price}` : 'Free'}</Text>)}
        </div>
      </Card>
    );
  };

  const courseColumns = [
    {
      title: '',
      dataIndex: ['course', 'course_image_url'],
      align: 'center',
      width: '180px',
      render: (text, record) => (
        <Image
          src={text || 'error'}
          alt={record.course?.name}
          fallback={DefaultImage()}
          className={styles.thumbnailImage}
        />
      ),
    },
    {
      title: 'Course Name',
      dataIndex: ['course', 'name'],
    },
    {
      title: 'Course Content',
      width: '150px',
      render: renderCourseContents,
    },
    {
      title: 'Duration',
      width: '90px',
      render: (text, record) => renderCourseDuration(record.course),
    },
    {
      title: 'Price',
      key: 'price',
      dataIndex: 'price',
      width: '100px',
      render: (text, record) => (record.price > 0 ? `${record.currency?.toUpperCase()} ${record.price}` : 'Free'),
    },
    {
      title: '',
      align: 'right',
      width: '100px',
      render: (text, record) => (
        <Row gutter={[8, 8]} justify="end">
          <Col>
            <Button type="link" size="large" onClick={() => redirectToCourseOrderDetails(record)}>
              Details
            </Button>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div className={styles.box}>
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Title level={4}> My Courses </Title>
        </Col>
        <Col xs={24}>
          <Collapse defaultActiveKey="Active">
            <Panel header={<Title level={5}> Active Courses </Title>} key="Active">
              {isMobileDevice ? (
                <Loader loading={isLoading} size="large" text="Loading courses">
                  {courseOrders?.active?.length > 0 ? (
                    <>
                      <Text className={`${styles.helperText} ${styles.mt10} ${styles.mb10}`}>
                        Click on the card to show course details
                      </Text>
                      {courseOrders?.active?.map(renderCourseItem)}
                    </>
                  ) : (
                    <div className="text-empty"> No course found </div>
                  )}
                </Loader>
              ) : (
                <Table
                  columns={courseColumns}
                  data={courseOrders?.active}
                  loading={isLoading}
                  rowKey={(record) => record.course_order_id}
                />
              )}
            </Panel>
            <Panel header={<Title level={5}> Expired Courses </Title>} key="Expired">
              {isMobileDevice ? (
                <Loader loading={isLoading} size="large" text="Loading courses">
                  {courseOrders?.expired?.length > 0 ? (
                    <>
                      <Text className={`${styles.helperText} ${styles.mt10} ${styles.mb10}`}>
                        Click on the card to show course details
                      </Text>
                      {courseOrders?.expired?.map(renderCourseItem)}
                    </>
                  ) : (
                    <div className="text-empty"> No course found </div>
                  )}
                </Loader>
              ) : (
                <Table
                  columns={courseColumns}
                  data={courseOrders?.expired}
                  loading={isLoading}
                  rowKey={(record) => record.course_order_id}
                />
              )}
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default CourseList;
