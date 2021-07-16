import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';

import { Row, Col, Typography, Button, Collapse, Card, Tag, Tooltip, Space, Divider } from 'antd';
import {
  MailOutlined,
  CopyOutlined,
  EditTwoTone,
  DownOutlined,
  UpOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Table from 'components/Table';
import Loader from 'components/Loader';
import TagListPopup from 'components/TagListPopup';

import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { getLocalUserDetails } from 'utils/storage';
import { getCourseSessionContentCount, getCourseVideoContentCount } from 'utils/course';
import { isAPISuccess, productType, copyToClipboard, generateUrlFromUsername, preventDefaults } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const {
  formatDate: { toShortDateWithYear, toDateAndTime },
} = dateUtil;

const Courses = ({ history }) => {
  const { showSendEmailPopup } = useGlobalContext();

  const [isLoading, setIsLoading] = useState([]);
  const [courses, setCourses] = useState([]);
  const [creatorMemberTags, setCreatorMemberTags] = useState([]);

  const [expandedPublishedRowKeys, setExpandedPublishedRowKeys] = useState([]);
  const [expandedUnpublishedRowKeys, setExpandedUnpublishedRowKeys] = useState([]);

  //#region Start of API Functions

  const fetchCreatorMemberTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.user.getCreatorSettings();

      if (isAPISuccess(status) && data) {
        setCreatorMemberTags(data.tags);
      }
    } catch (error) {
      showErrorModal('Failed to fetch creator tags', error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }, []);

  const fetchAllCoursesForCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.courses.getCreatorCourses();

      if (isAPISuccess(status) && data) {
        setCourses(data);
      }
    } catch (error) {
      showErrorModal('Failed fetching courses', error?.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  }, []);

  const publishCourse = async (course) => {
    setIsLoading(true);
    try {
      const { status } = await apis.courses.publishCourse(course.id);

      if (isAPISuccess(status)) {
        showSuccessModal('Course Published');
        fetchAllCoursesForCreator();
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message || 'Failed to publish course');
    }
    setIsLoading(false);
  };

  const unpublishCourse = async (course) => {
    setIsLoading(true);
    try {
      const { status } = await apis.courses.unpublishCourse(course.id);

      if (isAPISuccess(status)) {
        showSuccessModal('Course Unpublished');
        fetchAllCoursesForCreator();
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message || 'Failed to unpublish course');
    }
    setIsLoading(false);
  };

  //#endregion End of API Functions

  useEffect(() => {
    fetchCreatorMemberTags();
    fetchAllCoursesForCreator();
  }, [fetchCreatorMemberTags, fetchAllCoursesForCreator]);

  //#region Start Of Business Logics

  const showSendEmailModal = (course) => {
    let userIdMap = new Map();

    // This mapping is used to make sure the recipients sent to modal is unique
    if (course?.buyers && course?.buyers?.length > 0) {
      course.buyers.forEach((buyer) => {
        if (!userIdMap.has(buyer.external_id)) {
          userIdMap.set(buyer.external_id, buyer);
        }
      });
    }

    showSendEmailPopup({
      recipients: {
        active: Array.from(userIdMap, ([key, val]) => val),
        expired: [],
      },
      productId: course?.id || null,
      productType: productType.COURSE,
    });
  };

  const copyCourseLink = (courseId) => {
    const username = getLocalUserDetails().username;
    const pageLink = `${generateUrlFromUsername(username)}/c/${courseId}`;

    copyToClipboard(pageLink);
  };

  const redirectToCreateCourse = (e) => {
    preventDefaults(e);
    history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.createCourse);
  };

  const redirectToEditCourse = (courseExternalId) => {
    history.push(Routes.creatorDashboard.rootPath + `courses/${courseExternalId}/edit`);
  };

  //#endregion End Of Business Logics

  //#region Start Of Expandable Logics

  const toggleExpandAllPublished = () => {
    if (expandedPublishedRowKeys.length > 0) {
      setExpandedPublishedRowKeys([]);
    } else {
      setExpandedPublishedRowKeys(
        courses?.filter((liveCourse) => liveCourse.is_published).map((liveCourse) => liveCourse.id)
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
        courses?.filter((liveCourse) => !liveCourse.is_published).map((liveCourse) => liveCourse.id)
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

  //#endregion End Of Expandable Logics

  //#region Start Of Table Columns

  const generateLiveCourseColumns = (published) => {
    const initialColumns = [
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
        title: 'Duration',
        dataIndex: 'start_time',
        key: 'start_time',
        render: (text, record) =>
          record?.type === 'VIDEO'
            ? `${record?.validity ?? 0} days`
            : `${toShortDateWithYear(record.start_date)} - ${toShortDateWithYear(record.end_date)}`,
      },
      {
        title: 'Course Content',
        dataIndex: 'inventory_ids',
        key: 'inventory_ids',
        width: '170px',
        render: (text, record) => {
          const sessionCount = getCourseSessionContentCount(record?.modules ?? []);
          const videoCount = getCourseVideoContentCount(record?.modules ?? []);

          if (!sessionCount && !videoCount) {
            return '-';
          }

          return (
            <Tag color="blue">
              <Space split={<Divider type="vertical" />}>
                {sessionCount > 0 ? <Text className={styles.blueText}> {`${sessionCount} sessions`} </Text> : null}
                {videoCount > 0 ? <Text className={styles.blueText}> {`${videoCount} videos`} </Text> : null}
              </Space>
            </Tag>
          );
        },
      },
      {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        width: '100px',
        render: (text, record) => (record.price > 0 ? `${record.currency?.toUpperCase()} ${record.price}` : 'Free'),
      },
      {
        title: published ? (
          <Button ghost type="primary" onClick={() => toggleExpandAllPublished()}>
            {expandedPublishedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
          </Button>
        ) : (
          <Button ghost type="primary" onClick={() => toggleExpandAllUnpublished()}>
            {expandedUnpublishedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
          </Button>
        ),
        width: '250px',
        align: 'right',
        render: (text, record) => (
          <Row gutter={4} justify="end">
            <Col xs={3}>
              <Tooltip title="Send Customer Email">
                <Button type="text" onClick={() => showSendEmailModal(record)} icon={<MailOutlined />} />
              </Tooltip>
            </Col>
            <Col xs={3}>
              <Tooltip title="Edit Course">
                <Button
                  block
                  type="text"
                  onClick={() => redirectToEditCourse(record.id)}
                  icon={<EditTwoTone twoToneColor="#08979c" />}
                />
              </Tooltip>
            </Col>
            <Col xs={3}>
              <Tooltip title="Copy Course Link">
                <Button block type="text" onClick={() => copyCourseLink(record.id)} icon={<CopyOutlined />} />
              </Tooltip>
            </Col>
            <Col xs={5}>
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

    if (creatorMemberTags.length > 0) {
      const tagColumnPosition = 1;
      const tagColumnObject = {
        title: 'Purchasable By',
        key: 'tag',
        dataIndex: 'tag',
        width: '130px',
        render: (text, record) => <TagListPopup tags={record.tag} />,
      };

      initialColumns.splice(tagColumnPosition, 0, tagColumnObject);
    }

    return initialColumns;
  };

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
      title: 'Earnings',
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

  //#endregion End Of Table Columns

  //#region Start Of Render Functions

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
      <Col xs={24} key={subscriber.date_of_purchase}>
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
        <Col span={7}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={17}>: {value}</Col>
      </Row>
    );

    const sessionCount = getCourseSessionContentCount(course?.modules ?? []);
    const videoCount = getCourseVideoContentCount(course?.modules ?? []);

    return (
      <Col xs={24} key={course.id}>
        <Card
          className={styles.card}
          bodyStyle={{ padding: '20px 10px' }}
          title={
            <div style={{ paddingTop: 12, borderTop: `6px solid ${course.color_code || '#FFF'}` }}>
              <Text>{course.name}</Text>
            </div>
          }
          actions={[
            <Tooltip title="Send Customer Email">
              <Button type="text" onClick={() => showSendEmailModal(course)} icon={<MailOutlined />} />
            </Tooltip>,
            <Tooltip title="Edit">
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => redirectToEditCourse(course.id)}
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
            <Text>
              {course?.type === 'VIDEO'
                ? `${course?.validity ?? 0} days`
                : `${toShortDateWithYear(course.start_date)} - ${toShortDateWithYear(course.end_date)}`}
            </Text>
          )}
          {layout(
            'Content',
            <Tag color="blue">
              <Space split={<Divider type="vertical" />}>
                {sessionCount > 0 ? <Text className={styles.blueText}> {`${sessionCount} sessions`} </Text> : null}
                {videoCount > 0 ? <Text className={styles.blueText}> {`${videoCount} videos`} </Text> : null}
              </Space>
            </Tag>
          )}
          {layout(
            'Price',
            <Text>{course.price > 0 ? `${course.currency?.toUpperCase()} ${course.price}` : 'Free'}</Text>
          )}
          {creatorMemberTags.length > 0 && <TagListPopup tags={course.tag} mobileView={true} />}
        </Card>
        {course.is_published
          ? expandedPublishedRowKeys.includes(course.id) && (
              <Row className={styles.cardExpansion}>{course.buyers?.map(renderMobileSubscriberCards)}</Row>
            )
          : expandedUnpublishedRowKeys.includes(course.id) && (
              <Row className={styles.cardExpansion}>{course.buyers?.map(renderMobileSubscriberCards)}</Row>
            )}
      </Col>
    );
  };

  //#endregion End Of Render Functions

  return (
    <div className={styles.box}>
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Row gutter={[10, 10]} align="middle">
            <Col xs={24} md={14} lg={18}>
              <Title level={3}> Courses </Title>
            </Col>
            <Col xs={24} md={10} lg={6} className={styles.textAlignRight}>
              <Button size="large" type="primary" onClick={redirectToCreateCourse}>
                Create Live Course
              </Button>
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          <Loader loading={isLoading} size="large" text="Fetching Courses">
            <Collapse defaultActiveKey="published">
              <Panel header={<Title level={5}> Published </Title>} key="published">
                {isMobileDevice ? (
                  <Row gutter={[8, 16]}>
                    <Col xs={24}>
                      <Button block ghost type="primary" onClick={() => toggleExpandAllPublished()}>
                        {expandedPublishedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
                      </Button>
                    </Col>
                    {courses?.filter((liveCourse) => liveCourse.is_published).map(renderCourseItem)}
                  </Row>
                ) : (
                  <Table
                    size="small"
                    sticky={true}
                    columns={generateLiveCourseColumns(true)}
                    data={courses?.filter((liveCourse) => liveCourse.is_published)}
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
                      <Button block ghost type="primary" onClick={() => toggleExpandAllUnpublished()}>
                        {expandedUnpublishedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
                      </Button>
                    </Col>
                    {courses?.filter((liveCourse) => !liveCourse.is_published).map(renderCourseItem)}
                  </Row>
                ) : (
                  <Table
                    size="small"
                    sticky={true}
                    columns={generateLiveCourseColumns(false)}
                    data={courses?.filter((liveCourse) => !liveCourse.is_published)}
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
          </Loader>
        </Col>
      </Row>
    </div>
  );
};

export default Courses;
