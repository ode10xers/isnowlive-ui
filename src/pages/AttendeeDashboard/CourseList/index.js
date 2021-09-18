import React, { useState, useCallback, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import moment from 'moment';
import { Row, Col, Button, Typography, Card, Collapse, Tag, Space, Image, Grid } from 'antd';

import apis from 'apis';
import Routes from 'routes';

import Loader from 'components/Loader';
import Table from 'components/Table';
import DefaultImage from 'components/Icons/DefaultImage';
import { showErrorModal } from 'components/Modals/modals';

import { isAPISuccess, isUnapprovedUserError } from 'utils/helper';
import { getCourseDocumentContentCount, getCourseSessionContentCount, getCourseVideoContentCount } from 'utils/course';

import styles from './styles.module.scss';

const { Text, Title } = Typography;
const { Panel } = Collapse;
const { useBreakpoint } = Grid;

const CourseList = () => {
  const history = useHistory();
  const { md } = useBreakpoint();
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
    const docCount = getCourseDocumentContentCount(courseOrder.course?.modules ?? []);

    return (
      <Space size={1} wrap={true}>
        {sessionCount > 0 ? <Tag color="blue" className={styles.mb5}>{`${sessionCount} sessions`}</Tag> : null}
        {videoCount > 0 ? <Tag color="purple" className={styles.mb5}>{`${videoCount} videos`}</Tag> : null}
        {docCount > 0 ? <Tag color="magenta" className={styles.mb5}>{`${docCount} files`}</Tag> : null}
      </Space>
    );
  };

  const renderCourseDuration = (course) =>
    course?.type === 'VIDEO'
      ? `${course?.validity ?? 0} days`
      : `${moment(course?.end_date)
          .endOf('day')
          .add(1, 'second')
          .diff(moment(course.start_date).startOf('day'), 'days')} days`;

  const renderCourseItem = (item, isExpired = false) => {
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
      <Col xs={24} key={item.course_order_id}>
        <Card
          bodyStyle={{ padding: '10px' }}
          title={
            <div
              onClick={() => {
                if (!isExpired) {
                  redirectToCourseOrderDetails(item);
                }
              }}
            >
              <Text>{item?.course?.name}</Text>
            </div>
          }
          actions={
            isExpired
              ? []
              : [
                  <Button type="link" onClick={() => redirectToCourseOrderDetails(item)}>
                    Details
                  </Button>,
                ]
          }
        >
          <div
            onClick={() => {
              if (!isExpired) {
                redirectToCourseOrderDetails(item);
              }
            }}
          >
            {layout('Contents', renderCourseContents(item))}
            {layout('Duration', <Text>{renderCourseDuration(item.course)}</Text>)}
            {layout(
              'Price',
              <Text>{item?.price > 0 ? `${item?.currency?.toUpperCase()} ${item?.price}` : 'Free'}</Text>
            )}
          </div>
        </Card>
      </Col>
    );
  };

  const courseColumns = [
    {
      title: '',
      dataIndex: ['course', 'course_image_url'],
      align: 'center',
      width: md ? '150px' : '180px',
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
      width: '165px',
      render: renderCourseContents,
    },
    {
      title: 'Duration',
      width: '98px',
      render: (text, record) => renderCourseDuration(record.course),
    },
    {
      title: 'Price',
      key: 'price',
      dataIndex: 'price',
      width: '90px',
      render: (text, record) => (record.price > 0 ? `${record.currency?.toUpperCase()} ${record.price}` : 'Free'),
    },
    {
      title: '',
      width: '70px',
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
              {!md ? (
                <Loader loading={isLoading} size="large" text="Loading courses">
                  {courseOrders?.active?.length > 0 ? (
                    <>
                      <Text className={`${styles.helperText} ${styles.mt10} ${styles.mb10}`}>
                        Click on the card to show course details
                      </Text>
                      <Row gutter={[8, 8]}>
                        {courseOrders?.active?.map((course) => renderCourseItem(course, false))}
                      </Row>
                    </>
                  ) : (
                    <div className="text-empty"> No course found </div>
                  )}
                </Loader>
              ) : (
                <Table
                  size="small"
                  columns={courseColumns}
                  data={courseOrders?.active}
                  loading={isLoading}
                  rowKey={(record) => record.course_order_id}
                />
              )}
            </Panel>
            <Panel header={<Title level={5}> Expired Courses </Title>} key="Expired">
              {!md ? (
                <Loader loading={isLoading} size="large" text="Loading courses">
                  {courseOrders?.expired?.length > 0 ? (
                    <>
                      <Text className={`${styles.helperText} ${styles.mt10} ${styles.mb10}`}>
                        Click on the card to show course details
                      </Text>
                      <Row gutter={[8, 8]}>
                        {courseOrders?.expired?.map((course) => renderCourseItem(course, true))}
                      </Row>
                    </>
                  ) : (
                    <div className="text-empty"> No course found </div>
                  )}
                </Loader>
              ) : (
                <Table
                  size="small"
                  columns={courseColumns.slice(0, -1)}
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
