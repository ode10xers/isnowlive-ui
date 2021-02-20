import React, { useState, useCallback, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Button, Typography, Card, Collapse } from 'antd';

import apis from 'apis';
import Routes from 'routes';

import Loader from 'components/Loader';
import Table from 'components/Table';
import { showErrorModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { Text, Title } = Typography;
const { Panel } = Collapse;
const {
  formatDate: { toShortDateWithYear },
} = dateUtil;

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
      showErrorModal('Something wrong happened', error?.response?.data?.message || 'Failed to fetch course orders');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUserCourseOrders();
  }, [fetchUserCourseOrders]);

  const redirectToCourseOrderDetails = (courseOrder) => {
    if (courseOrder.creator_username && courseOrder.course_id) {
      history.push(`${Routes.attendeeDashboard.rootPath}/course/${courseOrder.course_id}`, {
        username: courseOrder.creator_username || 'app',
      });
    }
  };

  const courseColumns = [
    {
      title: 'Course Name',
      key: 'name',
      dataIndex: 'name',
      render: (text, record) => {
        return {
          props: {
            style: {
              borderLeft: `6px solid ${record.color_code || '#FFF'}`,
            },
          },
          children: <Text> {record?.course_name} </Text>,
        };
      },
    },
    {
      title: 'Course Session',
      key: 'session',
      dataIndex: 'session',
      render: (text, record) => record.session?.name,
    },
    {
      title: 'Duration',
      key: 'start_date',
      dataIndex: 'start_date',
      width: '180px',
      render: (text, record) => `${toShortDateWithYear(record.start_date)} - ${toShortDateWithYear(record.end_date)}`,
    },
    {
      title: 'Price',
      key: 'price',
      dataIndex: 'price',
      width: '85px',
      render: (text, record) => `${record.currency?.toUpperCase()} ${record.price}`,
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
        key={item.course_id}
        bodyStyle={{ padding: '10px' }}
        title={
          <div onClick={() => redirectToCourseOrderDetails(item)}>
            <Text>{item?.course_name}</Text>
          </div>
        }
        actions={[
          <Button type="link" size="large" onClick={() => redirectToCourseOrderDetails(item)}>
            Details
          </Button>,
        ]}
      >
        <div onClick={() => redirectToCourseOrderDetails(item)}>
          {layout('Session', <Text>{item?.session?.name}</Text>)}
          {layout(
            'Duration',
            <Text>{`${toShortDateWithYear(item?.start_date)} - ${toShortDateWithYear(item?.end_date)}`}</Text>
          )}
          {layout(
            'Price',
            <Text>
              {item?.currency?.toUpperCase()} {item?.price}
            </Text>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className={styles.box}>
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Title level={4}> My Courses </Title>
        </Col>
        <Col xs={24}>
          <Collapse>
            <Panel header={<Title level={5}> Active Courses </Title>} key="Active">
              {isMobileDevice ? (
                <>
                  <Text className={`${styles.helperText} ${styles.mt10} ${styles.mb10}`}>
                    Click on the card to show course details
                  </Text>
                  <Loader loading={isLoading} size="large" text="Loading courses">
                    {courseOrders?.active?.length > 0 ? (
                      courseOrders?.active?.map(renderCourseItem)
                    ) : (
                      <div className="text-empty"> No course found </div>
                    )}
                  </Loader>
                </>
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
                <>
                  <Text className={`${styles.helperText} ${styles.mt10} ${styles.mb10}`}>
                    Click on the card to show course details
                  </Text>
                  <Loader loading={isLoading} size="large" text="Loading courses">
                    {courseOrders?.expired?.length > 0 ? (
                      courseOrders?.expired?.map(renderCourseItem)
                    ) : (
                      <div className="text-empty"> No course found </div>
                    )}
                  </Loader>
                </>
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
