import React, { useState } from 'react';

import { Row, Col, Tooltip, Typography, Button, Card, Empty } from 'antd';
import { CopyOutlined, EditTwoTone, DownOutlined, UpOutlined } from '@ant-design/icons';

import Table from 'components/Table';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { getLocalUserDetails } from 'utils/storage';
import { copyPageLinkToClipboard, generateUrlFromUsername } from 'utils/helper';

import styles from './styles.module.scss';

const { Text, Title } = Typography;

const {
  formatDate: { toShortDateWithYear, toDateAndTime },
} = dateUtil;

const LiveCourses = ({ liveCourses, showEditModal }) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  const publishCourse = (courseId) => {
    //TODO: Implement API Here
    console.log('Published ', courseId);
  };

  const unpublishCourse = (courseId) => {
    //TODO: Implement API Here
    console.log('Unpublished', courseId);
  };

  const copyCourseLink = (courseId) => {
    const username = getLocalUserDetails().username;
    const pageLink = `${generateUrlFromUsername(username)}/c/${courseId}`;

    copyPageLinkToClipboard(pageLink);
  };

  const toggleExpandAll = () => {
    if (expandedRowKeys.length > 0) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(liveCourses?.map((liveCourse) => liveCourse.id));
    }
  };

  const expandRow = (rowKey) => {
    const tempExpandedRowsArray = expandedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRow = (rowKey) => setExpandedRowKeys(expandedRowKeys.filter((key) => key !== rowKey));

  const liveCourseColumns = [
    {
      title: 'Course Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        return {
          props: {
            style: {
              borderLeft: `6px solid ${record.color_code || '#FFF'}`,
            },
          },
          children: <Text className={styles.textAlignLeft}> {record?.name} </Text>,
        };
      },
    },
    {
      title: 'Duration',
      dataIndex: 'start_time',
      key: 'start_time',
      width: '170px',
      render: (text, record) => `${toShortDateWithYear(record.start_date)} - ${toShortDateWithYear(record.end_date)}`,
    },
    {
      title: 'Course Session',
      dataIndex: 'session',
      key: 'session',
      render: (text, record) => record.session?.name,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: '85px',
      render: (text, record) => `${record.currency?.toUpperCase()} ${record.price}`,
    },
    {
      title: (
        <Button shape="round" type="primary" onClick={() => toggleExpandAll()}>
          {expandedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
        </Button>
      ),
      width: '250px',
      render: (text, record) => (
        <Row gutter={8} justify="end">
          <Col xs={4}>
            <Tooltip title="Edit Course">
              <Button
                block
                type="text"
                onClick={() => showEditModal(record)}
                icon={<EditTwoTone twoToneColor="#08979c" />}
              />
            </Tooltip>
          </Col>
          <Col xs={4}>
            <Tooltip title="Copy Course Link">
              <Button block type="text" onClick={() => copyCourseLink(record.id)} icon={<CopyOutlined />} />
            </Tooltip>
          </Col>
          <Col xs={6}>
            {record.is_published ? (
              <Tooltip title="Hide Course">
                <Button danger block type="link" onClick={() => unpublishCourse(record.id)}>
                  Hide
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Unhide Course">
                <Button block className={styles.successBtn} onClick={() => publishCourse(record.id)}>
                  Show
                </Button>
              </Tooltip>
            )}
          </Col>
          <Col xs={10}>
            {expandedRowKeys.includes(record.id) ? (
              <Button block type="link" onClick={() => collapseRow(record.id)}>
                {record.buyers?.length} Buyers <UpOutlined />
              </Button>
            ) : (
              <Button block type="link" onClick={() => expandRow(record.id)}>
                {record.buyers?.length} Buyers <DownOutlined />
              </Button>
            )}
          </Col>
        </Row>
      ),
    },
  ];

  //TODO: Adjust buyers object here

  const buyersColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
    },
    {
      title: 'Date of Purchase',
      dataIndex: 'date_of_purchase',
      key: 'date_of_purchase',
      width: '30%',
      render: (text, record) => toDateAndTime(record.date_of_purchase),
    },
    {
      title: 'Net Price',
      dataIndex: 'price_paid',
      key: 'price_paid',
      render: (text, record) => `${record.price_paid} ${record.currency?.toUpperCase()}`,
    },
  ];

  const renderBuyersList = (record) => {
    return (
      <div className={styles.mb20}>
        <Table
          columns={buyersColumns}
          data={record.buyers}
          rowKey={(record) => `${record.name}_${record.date_of_purchase}`}
        />
      </div>
    );
  };

  const renderMobileSubscriberCards = (subscriber) => (
    <Card>
      <Row>
        <Col xs={24}>
          <Title level={5}> {subscriber.name} </Title>
        </Col>
        <Col xs={24}>
          <Text> Purchased at {toDateAndTime(subscriber.date_of_purchase)} </Text>
        </Col>
        <Col xs={24}>
          <Text> {`${subscriber.price_paid} ${subscriber.currency.toUpperCase()}`} </Text>
        </Col>
      </Row>
    </Card>
  );

  const renderCourseItem = (course) => {
    const layout = (label, value) => (
      <Row>
        <Col span={6}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={18}>: {value}</Col>
      </Row>
    );

    return (
      <Col xs={24}>
        <Card
          className={styles.card}
          title={
            <div style={{ paddingTop: 12, borderTop: `6px solid ${course.color_code || '#FFF'}` }}>
              <Text>{course.name}</Text>
            </div>
          }
          actions={[
            <Tooltip title="Edit">
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => showEditModal(course)}
                icon={<EditTwoTone twoToneColor="#08979c" />}
              />
            </Tooltip>,
            <Tooltip title="Copy Course Link">
              <Button
                type="text"
                className={styles.detailsButton}
                onClick={() => copyCourseLink(course.id)}
                icon={<CopyOutlined />}
              />
            </Tooltip>,
            course.is_published ? (
              <Tooltip title="Hide Course">
                <Button type="link" danger onClick={() => unpublishCourse(course.id)}>
                  Hide
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Unhide Course">
                <Button type="link" className={styles.successBtn} onClick={() => publishCourse(course.id)}>
                  Show
                </Button>
              </Tooltip>
            ),
            expandedRowKeys.includes(course.id) ? (
              <Button type="link" onClick={() => collapseRow(course.id)} icon={<UpOutlined />} />
            ) : (
              <Button type="link" onClick={() => expandRow(course.id)} icon={<DownOutlined />} />
            ),
          ]}
        >
          {layout(
            'Duration',
            <Text> {`${toShortDateWithYear(course.start_date)} - ${toShortDateWithYear(course.end_date)}`} </Text>
          )}
          {layout('Session', <Text>{course.session?.name}</Text>)}
          {layout('Price', <Text>{`${course.currency?.toUpperCase()} ${course.price} `}</Text>)}
        </Card>
        {expandedRowKeys.includes(course.id) && (
          <Row className={styles.cardExpansion}>
            <div className={styles.mb20}>{course.buyers?.map(renderMobileSubscriberCards)}</div>
          </Row>
        )}
      </Col>
    );
  };

  return (
    <div>
      {liveCourses?.length > 0 ? (
        isMobileDevice ? (
          <Row gutter={[8, 16]}>
            <Col xs={24}>
              <Button block shape="round" type="primary" onClick={() => toggleExpandAll()}>
                {expandedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
              </Button>
            </Col>
            {liveCourses?.map(renderCourseItem)}
          </Row>
        ) : (
          <Table
            size="small"
            sticky={true}
            columns={liveCourseColumns}
            data={liveCourses}
            rowKey={(record) => record.id}
            expandable={{
              expandedRowRender: renderBuyersList,
              expandRowByClick: true,
              expandIconColumnIndex: -1,
              expandedRowKeys: expandedRowKeys,
            }}
          />
        )
      ) : (
        <Empty description="No Courses found" />
      )}
    </div>
  );
};

export default LiveCourses;
