import React, { useState } from 'react';

import { Row, Col, Tooltip, Typography, Button, Card, Empty, Tag, Collapse } from 'antd';
import { CopyOutlined, EditTwoTone, DownOutlined, UpOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

import Table from 'components/Table';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { getLocalUserDetails } from 'utils/storage';
import { copyPageLinkToClipboard, generateUrlFromUsername } from 'utils/helper';

import styles from './styles.module.scss';

const { Text, Title } = Typography;
const { Panel } = Collapse;

const {
  formatDate: { toShortDateWithYear, toDateAndTime },
} = dateUtil;

const LiveCourses = ({ liveCourses, showEditModal, publishCourse, unpublishCourse }) => {
  const [expandedPublishedRowKeys, setExpandedPublishedRowKeys] = useState([]);
  const [expandedUnpublishedRowKeys, setExpandedUnpublishedRowKeys] = useState([]);

  const copyCourseLink = (courseId) => {
    const username = getLocalUserDetails().username;
    const pageLink = `${generateUrlFromUsername(username)}/c/${courseId}`;

    copyPageLinkToClipboard(pageLink);
  };

  const toggleExpandAllPublished = () => {
    if (expandedPublishedRowKeys.length > 0) {
      setExpandedPublishedRowKeys([]);
    } else {
      setExpandedPublishedRowKeys(
        liveCourses?.filter((liveCourse) => liveCourse.is_published).map((liveCourse) => liveCourse.id)
      );
    }
  };

  const expandRowPublished = (rowKey) => {
    const tempExpandedRowsArray = expandedPublishedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedPublishedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRowPublished = (rowKey) =>
    setExpandedPublishedRowKeys(expandedPublishedRowKeys.filter((key) => key !== rowKey));

  const toggleExpandAllUnpublished = () => {
    if (expandedUnpublishedRowKeys.length > 0) {
      setExpandedUnpublishedRowKeys([]);
    } else {
      setExpandedUnpublishedRowKeys(
        liveCourses?.filter((liveCourse) => !liveCourse.is_published).map((liveCourse) => liveCourse.id)
      );
    }
  };

  const expandRowUnpublished = (rowKey) => {
    const tempExpandedRowsArray = expandedUnpublishedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedUnpublishedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRowUnpublished = (rowKey) =>
    setExpandedUnpublishedRowKeys(expandedUnpublishedRowKeys.filter((key) => key !== rowKey));

  const generateLiveCourseColumns = (published) => [
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
          children: (
            <>
              <Text> {record?.name} </Text>
              {record.is_published ? null : <EyeInvisibleOutlined />}
            </>
          ),
        };
      },
    },
    {
      title: 'Duration',
      dataIndex: 'start_time',
      key: 'start_time',
      width: '210px',
      render: (text, record) => `${toShortDateWithYear(record.start_date)} - ${toShortDateWithYear(record.end_date)}`,
    },
    {
      title: 'Course Content',
      dataIndex: 'inventory_ids',
      key: 'inventory_ids',
      width: '175px',
      render: (text, record) => (
        <>
          <Tag color="volcano"> {record.inventory_ids?.length} sessions</Tag>
          <Tag color="blue"> {record.videos?.length} videos </Tag>
        </>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: '85px',
      render: (text, record) => `${record.currency?.toUpperCase()} ${record.price}`,
    },
    {
      title: published ? (
        <Button shape="round" type="primary" onClick={() => toggleExpandAllPublished()}>
          {expandedPublishedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
        </Button>
      ) : (
        <Button shape="round" type="primary" onClick={() => toggleExpandAllUnpublished()}>
          {expandedUnpublishedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
        </Button>
      ),
      width: '250px',
      align: 'right',
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
                <Button danger block type="link" onClick={() => unpublishCourse(record)}>
                  Hide
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Unhide Course">
                <Button block type="link" className={styles.successBtn} onClick={() => publishCourse(record)}>
                  Show
                </Button>
              </Tooltip>
            )}
          </Col>
          <Col xs={10}>
            {record.is_published ? (
              expandedPublishedRowKeys.includes(record.id) ? (
                <Button block type="link" onClick={() => collapseRowPublished(record.id)}>
                  {record.buyers?.length} Buyers <UpOutlined />
                </Button>
              ) : (
                <Button block type="link" onClick={() => expandRowPublished(record.id)}>
                  {record.buyers?.length} Buyers <DownOutlined />
                </Button>
              )
            ) : expandedUnpublishedRowKeys.includes(record.id) ? (
              <Button block type="link" onClick={() => collapseRowUnpublished(record.id)}>
                {record.buyers?.length} Buyers <UpOutlined />
              </Button>
            ) : (
              <Button block type="link" onClick={() => expandRowUnpublished(record.id)}>
                {record.buyers?.length} Buyers <DownOutlined />
              </Button>
            )}
          </Col>
        </Row>
      ),
    },
  ];

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
      render: (text, record) => `${record.currency?.toUpperCase()} ${record.price_paid}`,
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
        <Col span={7}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={17}>: {value}</Col>
      </Row>
    );

    return (
      <Col xs={24}>
        <Card
          className={styles.card}
          bodyStyle={{ padding: '20px 10px' }}
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
                <Button type="link" danger onClick={() => unpublishCourse(course)}>
                  Hide
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Unhide Course">
                <Button type="link" className={styles.successBtn} onClick={() => publishCourse(course)}>
                  Show
                </Button>
              </Tooltip>
            ),
            course.is_published ? (
              expandedPublishedRowKeys.includes(course.id) ? (
                <Button type="link" onClick={() => collapseRowPublished(course.id)} icon={<UpOutlined />} />
              ) : (
                <Button type="link" onClick={() => expandRowPublished(course.id)} icon={<DownOutlined />} />
              )
            ) : expandedUnpublishedRowKeys.includes(course.id) ? (
              <Button type="link" onClick={() => collapseRowUnpublished(course.id)} icon={<UpOutlined />} />
            ) : (
              <Button type="link" onClick={() => expandRowUnpublished(course.id)} icon={<DownOutlined />} />
            ),
          ]}
        >
          {layout(
            'Duration',
            <Text> {`${toShortDateWithYear(course.start_date)} - ${toShortDateWithYear(course.end_date)}`} </Text>
          )}
          {layout(
            'Content',
            <>
              <Tag color="volcano">{course.inventory_ids?.length} sessions</Tag>
              <Tag color="blue">{course.videos?.length} videos</Tag>
            </>
          )}
          {layout('Price', <Text>{`${course.currency?.toUpperCase()} ${course.price} `}</Text>)}
        </Card>
        {course.is_published
          ? expandedPublishedRowKeys.includes(course.id) && (
              <Row className={styles.cardExpansion}>
                <div className={styles.mb20}>{course.buyers?.map(renderMobileSubscriberCards)}</div>
              </Row>
            )
          : expandedUnpublishedRowKeys.includes(course.id) && (
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
        <Collapse>
          <Panel header={<Title level={5}> Published </Title>} key="published">
            {isMobileDevice ? (
              <Row gutter={[8, 16]}>
                <Col xs={24}>
                  <Button block shape="round" type="primary" onClick={() => toggleExpandAllPublished()}>
                    {expandedPublishedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
                  </Button>
                </Col>
                {liveCourses?.filter((liveCourse) => liveCourse.is_published).map(renderCourseItem)}
              </Row>
            ) : (
              <Table
                size="small"
                sticky={true}
                columns={generateLiveCourseColumns(true)}
                data={liveCourses?.filter((liveCourse) => liveCourse.is_published)}
                rowKey={(record) => record.id}
                expandable={{
                  expandedRowRender: renderBuyersList,
                  expandRowByClick: true,
                  expandIconColumnIndex: -1,
                  expandedRowKeys: expandedPublishedRowKeys,
                }}
              />
            )}
          </Panel>
          <Panel header={<Title level={5}> Unpublished </Title>} key="unpublished">
            {isMobileDevice ? (
              <Row gutter={[8, 16]}>
                <Col xs={24}>
                  <Button block shape="round" type="primary" onClick={() => toggleExpandAllUnpublished()}>
                    {expandedUnpublishedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
                  </Button>
                </Col>
                {liveCourses?.filter((liveCourse) => !liveCourse.is_published).map(renderCourseItem)}
              </Row>
            ) : (
              <Table
                size="small"
                sticky={true}
                columns={generateLiveCourseColumns(false)}
                data={liveCourses?.filter((liveCourse) => !liveCourse.is_published)}
                rowKey={(record) => record.id}
                expandable={{
                  expandedRowRender: renderBuyersList,
                  expandRowByClick: true,
                  expandIconColumnIndex: -1,
                  expandedRowKeys: expandedUnpublishedRowKeys,
                }}
              />
            )}
          </Panel>
        </Collapse>
      ) : (
        <Empty description="No Courses found" />
      )}
    </div>
  );
};

export default LiveCourses;
