import React, { useState } from 'react';
import classNames from 'classnames';
import { Row, Col, Tooltip, Typography, Button, Card, Empty, Collapse } from 'antd';
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
  formatDate: { toDateAndTime },
} = dateUtil;

const VideoCourses = ({ videoCourses, showEditModal, publishCourse, unpublishCourse }) => {
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
        videoCourses?.filter((videoCourse) => videoCourse.is_published).map((videoCourse) => videoCourse.id)
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
        videoCourses?.filter((videoCourse) => !videoCourse.is_published).map((videoCourse) => videoCourse.id)
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

  const generateVideoCourseColumns = (published) => [
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
              {record.is_published ? null : <EyeInvisibleOutlined style={{ color: '#f00' }} />}
            </>
          ),
        };
      },
    },
    {
      title: 'Total Videos',
      width: '120px',
      render: (text, record) => `${record?.videos?.length} Videos`,
    },
    {
      title: 'Duration',
      dataIndex: 'validity',
      key: 'validity',
      width: '100px',
      render: (text, record) => `${record?.validity} days`,
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
    },
    {
      title: 'Date of Purchase',
      dataIndex: 'date_of_purchase',
      key: 'date_of_purchase',
      width: '170px',
      render: (text, record) => toDateAndTime(record.date_of_purchase),
    },
    {
      title: 'Net Price',
      dataIndex: 'price_paid',
      key: 'price_paid',
      width: '100px',
      render: (text, record) => `${record.currency?.toUpperCase()} ${record.price_paid}`,
    },
    {
      title: 'Discount Code',
      dataIndex: 'discount',
      key: 'discount',
      width: '180px',
      render: (text, record) => record.discount?.code || 'No Discount',
    },
  ];

  const renderBuyersList = (record) => {
    return (
      <div className={classNames(styles.mb20, styles.mt20)}>
        <Table
          columns={buyersColumns}
          data={record.buyers}
          rowKey={(record) => `${record.name}_${record.date_of_purchase}`}
        />
      </div>
    );
  };

  const renderMobileSubscriberCards = (subscriber) => {
    const layout = (label, value) => (
      <Row>
        <Col span={8}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={16}>: {value}</Col>
      </Row>
    );

    return (
      <Col xs={24} key={`${subscriber.name}_${subscriber.date_of_purchase}`}>
        <Card bodyStyle={{ padding: '20px 10px' }} title={<Title level={5}> {subscriber.name} </Title>}>
          {layout('Buy Date', toDateAndTime(subscriber.date_of_purchase))}
          {layout('Price', <Text strong> {`${subscriber.price_paid} ${subscriber.currency.toUpperCase()}`} </Text>)}
          {layout('Discount Code', <Text strong> {subscriber.discount?.code || 'No Discount'} </Text>)}
        </Card>
      </Col>
    );
  };

  const renderCourseItem = (course) => {
    const layout = (label, value) => (
      <Row>
        <Col span={10}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={14}>: {value}</Col>
      </Row>
    );

    return (
      <Col xs={24} key={course.id}>
        <Card
          className={styles.card}
          bodyStyle={{ padding: '20px 10px' }}
          title={
            <div style={{ paddingTop: 12, borderTop: `6px solid ${course?.color_code || '#FFF'}` }}>
              <Text>{course?.name}</Text>
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
                onClick={() => copyCourseLink(course?.id)}
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
          {layout('Total Videos', <Text>{course.videos?.length} videos</Text>)}
          {layout('Duration', <Text> {course?.validity} days</Text>)}
          {layout('Price', <Text>{`${course?.currency?.toUpperCase()} ${course?.price} `}</Text>)}
        </Card>
        {course.is_published
          ? expandedPublishedRowKeys.includes(course?.id) && (
              <Row className={styles.cardExpansion}>{course?.buyers?.map(renderMobileSubscriberCards)}</Row>
            )
          : expandedUnpublishedRowKeys.includes(course?.id) && (
              <Row className={styles.cardExpansion}>{course?.buyers?.map(renderMobileSubscriberCards)}</Row>
            )}
      </Col>
    );
  };

  return (
    <div>
      {videoCourses?.length > 0 ? (
        <Collapse>
          <Panel header={<Title level={5}> Published </Title>} key="published">
            {isMobileDevice ? (
              <Row gutter={[8, 16]}>
                <Col xs={24}>
                  <Button block shape="round" type="primary" onClick={() => toggleExpandAllPublished()}>
                    {expandedPublishedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
                  </Button>
                </Col>
                {videoCourses?.filter((videoCourse) => videoCourse.is_published).map(renderCourseItem)}
              </Row>
            ) : (
              <Table
                size="small"
                sticky={true}
                columns={generateVideoCourseColumns(true)}
                data={videoCourses?.filter((videoCourse) => videoCourse.is_published)}
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
                {videoCourses?.filter((videoCourse) => !videoCourse.is_published).map(renderCourseItem)}
              </Row>
            ) : (
              <Table
                size="small"
                sticky={true}
                columns={generateVideoCourseColumns(false)}
                data={videoCourses?.filter((videoCourse) => !videoCourse.is_published)}
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

export default VideoCourses;
