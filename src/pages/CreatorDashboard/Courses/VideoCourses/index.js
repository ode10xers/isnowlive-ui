import React, { useState } from 'react';
import classNames from 'classnames';
import { Row, Col, Tooltip, Typography, Button, Card, Empty, Collapse } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  MailOutlined,
  CopyOutlined,
  EditTwoTone,
  DownOutlined,
  UpOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';

import Table from 'components/Table';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { getLocalUserDetails } from 'utils/storage';
import { copyToClipboard, generateUrlFromUsername } from 'utils/helper';

import styles from './styles.module.scss';

const { Text, Title } = Typography;
const { Panel } = Collapse;

const {
  formatDate: { toDateAndTime },
} = dateUtil;

const VideoCourses = ({ videoCourses, showEditModal, publishCourse, unpublishCourse, showSendEmailModal }) => {
  const { t: translate } = useTranslation();
  const [expandedPublishedRowKeys, setExpandedPublishedRowKeys] = useState([]);
  const [expandedUnpublishedRowKeys, setExpandedUnpublishedRowKeys] = useState([]);

  const copyCourseLink = (courseId) => {
    const username = getLocalUserDetails().username;
    const pageLink = `${generateUrlFromUsername(username)}/c/${courseId}`;

    copyToClipboard(pageLink);
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
      title: translate('COURSE_NAME'),
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
      title: translate('TOTAL_VIDEO'),
      width: '120px',
      render: (text, record) => `${record?.videos?.length} ${translate('VIDEOS')}`,
    },
    {
      title: translate('DURATION'),
      dataIndex: 'validity',
      key: 'validity',
      width: '100px',
      render: (text, record) => `${record?.validity} ${translate('DAYS')}`,
    },
    {
      title: translate('PRICE'),
      dataIndex: 'price',
      key: 'price',
      width: '85px',
      render: (text, record) => `${record.currency?.toUpperCase()} ${record.price}`,
    },
    {
      title: published ? (
        <Button shape="round" type="primary" onClick={() => toggleExpandAllPublished()}>
          {expandedPublishedRowKeys.length > 0 ? translate('COLLAPSE') : translate('EXPAND')} {translate('ALL')}
        </Button>
      ) : (
        <Button shape="round" type="primary" onClick={() => toggleExpandAllUnpublished()}>
          {expandedUnpublishedRowKeys.length > 0 ? translate('COLLAPSE') : translate('EXPAND')} {translate('ALL')}
        </Button>
      ),
      width: '250px',
      align: 'right',
      render: (text, record) => (
        <Row gutter={8} justify="end">
          <Col xs={3}>
            <Tooltip title={translate('SEND_CUSTOMER_EMAIL')}>
              <Button type="text" onClick={() => showSendEmailModal(record)} icon={<MailOutlined />} />
            </Tooltip>
          </Col>
          <Col xs={3}>
            <Tooltip title={translate('EDIT_COURSES')}>
              <Button
                block
                type="text"
                onClick={() => showEditModal(record)}
                icon={<EditTwoTone twoToneColor="#08979c" />}
              />
            </Tooltip>
          </Col>
          <Col xs={3}>
            <Tooltip title={translate('COPY_COURSE_LINK')}>
              <Button block type="text" onClick={() => copyCourseLink(record.id)} icon={<CopyOutlined />} />
            </Tooltip>
          </Col>
          <Col xs={5}>
            {record.is_published ? (
              <Tooltip title={translate('HIDE_COURSE')}>
                <Button danger block type="link" onClick={() => unpublishCourse(record)}>
                  {translate('HIDE')}
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title={translate('SHOW_COURSE')}>
                <Button block type="link" className={styles.successBtn} onClick={() => publishCourse(record)}>
                  {translate('SHOW')}
                </Button>
              </Tooltip>
            )}
          </Col>
          <Col xs={10}>
            {record.is_published ? (
              expandedPublishedRowKeys.includes(record.id) ? (
                <Button block type="link" onClick={() => collapseRowPublished(record.id)}>
                  {record.buyers?.length} {translate('BUYERS')} <UpOutlined />
                </Button>
              ) : (
                <Button block type="link" onClick={() => expandRowPublished(record.id)}>
                  {record.buyers?.length} {translate('BUYERS')} <DownOutlined />
                </Button>
              )
            ) : expandedUnpublishedRowKeys.includes(record.id) ? (
              <Button block type="link" onClick={() => collapseRowUnpublished(record.id)}>
                {record.buyers?.length} {translate('BUYERS')} <UpOutlined />
              </Button>
            ) : (
              <Button block type="link" onClick={() => expandRowUnpublished(record.id)}>
                {record.buyers?.length} {translate('BUYERS')} <DownOutlined />
              </Button>
            )}
          </Col>
        </Row>
      ),
    },
  ];

  const buyersColumns = [
    {
      title: translate('NAME'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: translate('DATE_OF_PURCHASE'),
      dataIndex: 'date_of_purchase',
      key: 'date_of_purchase',
      width: '170px',
      render: (text, record) => toDateAndTime(record.date_of_purchase),
    },
    {
      title: translate('NET_PRICE'),
      dataIndex: 'price_paid',
      key: 'price_paid',
      width: '100px',
      render: (text, record) => `${record.currency?.toUpperCase()} ${record.price_paid}`,
    },
    {
      title: translate('DISCOUNT_CODE'),
      dataIndex: 'discount',
      key: 'discount',
      width: '180px',
      render: (text, record) => record.discount?.code || translate('NO_DISCOUNT'),
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
          {layout(translate('BUY_DATE'), toDateAndTime(subscriber.date_of_purchase))}
          {layout(
            translate('PRICE'),
            <Text strong> {`${subscriber.price_paid} ${subscriber.currency.toUpperCase()}`} </Text>
          )}
          {layout(
            translate('DISCOUNT_CODE'),
            <Text strong> {subscriber.discount?.code || translate('NO_DISCOUNT')} </Text>
          )}
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
            <Tooltip title={translate('SEND_CUSTOMER_EMAIL')}>
              <Button type="text" onClick={() => showSendEmailModal(course)} icon={<MailOutlined />} />
            </Tooltip>,
            <Tooltip title={translate('EDIT')}>
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => showEditModal(course)}
                icon={<EditTwoTone twoToneColor="#08979c" />}
              />
            </Tooltip>,
            <Tooltip title={translate('COPY_COURSE_LINK')}>
              <Button
                type="text"
                className={styles.detailsButton}
                onClick={() => copyCourseLink(course?.id)}
                icon={<CopyOutlined />}
              />
            </Tooltip>,
            course.is_published ? (
              <Tooltip title={translate('HIDE_COURSE')}>
                <Button type="link" danger onClick={() => unpublishCourse(course)}>
                  {translate('HIDE')}
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title={translate('SHOW_COURSE')}>
                <Button type="link" className={styles.successBtn} onClick={() => publishCourse(course)}>
                  {translate('SHOW')}
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
            translate('TOTAL_VIDEO'),
            <Text>
              {course.videos?.length} {translate('VIDEOS')}
            </Text>
          )}
          {layout(
            translate('DURATION'),
            <Text>
              {' '}
              {course?.validity} {translate('DAYS')}{' '}
            </Text>
          )}
          {layout(translate('PRICE'), <Text>{`${course?.currency?.toUpperCase()} ${course?.price} `}</Text>)}
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
          <Panel header={<Title level={5}> {translate('PUBLISHED')} </Title>} key="published">
            {isMobileDevice ? (
              <Row gutter={[8, 16]}>
                <Col xs={24}>
                  <Button block shape="round" type="primary" onClick={() => toggleExpandAllPublished()}>
                    {expandedPublishedRowKeys.length > 0 ? translate('COLLAPSE') : translate('EXPAND')}{' '}
                    {translate('ALL')}
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
          <Panel header={<Title level={5}> {translate('UNPUBLISHED')} </Title>} key="unpublished">
            {isMobileDevice ? (
              <Row gutter={[8, 16]}>
                <Col xs={24}>
                  <Button block shape="round" type="primary" onClick={() => toggleExpandAllUnpublished()}>
                    {expandedUnpublishedRowKeys.length > 0 ? translate('COLLAPSE') : translate('EXPAND')}{' '}
                    {translate('ALL')}
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
        <Empty description={translate('NO_COURSE_FOUND')} />
      )}
    </div>
  );
};

export default VideoCourses;
