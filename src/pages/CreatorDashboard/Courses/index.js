import React, { useState, useEffect, useCallback } from 'react';
import { generatePath } from 'react-router';
import classNames from 'classnames';
import moment from 'moment';

import {
  Row,
  Col,
  Popover,
  Typography,
  Button,
  Collapse,
  Card,
  Tag,
  Tooltip,
  Space,
  Grid,
  Modal,
  Popconfirm,
  List,
  message,
} from 'antd';
import {
  MailOutlined,
  EditTwoTone,
  DownOutlined,
  UpOutlined,
  EyeInvisibleOutlined,
  ProfileOutlined,
  CopyTwoTone,
  ExportOutlined,
  CarryOutOutlined,
  DeleteOutlined,
  CheckCircleTwoTone,
} from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Table from 'components/Table';
import Loader from 'components/Loader';
import TagListPopup from 'components/TagListPopup';
import { resetBodyStyle, showErrorModal, showSuccessModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { paymentProvider } from 'utils/constants';
import { getLocalUserDetails } from 'utils/storage';
import {
  getCourseSessionContentCount,
  getCourseVideoContentCount,
  getCourseEmptyContentCount,
  getCourseDocumentContentCount,
} from 'utils/course';
import {
  isAPISuccess,
  productType,
  copyToClipboard,
  generateUrlFromUsername,
  preventDefaults,
  courseType,
} from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { useBreakpoint } = Grid;
const {
  formatDate: { toShortDateMonth, toDateAndTime },
} = dateUtil;

const Courses = ({ history }) => {
  const { md, xl } = useBreakpoint();
  const {
    state: { userDetails },
    showSendEmailPopup,
  } = useGlobalContext();

  const [isLoading, setIsLoading] = useState([]);
  const [courses, setCourses] = useState([]);
  const [creatorMemberTags, setCreatorMemberTags] = useState([]);

  const [expandedPublishedRowKeys, setExpandedPublishedRowKeys] = useState([]);
  const [expandedUnpublishedRowKeys, setExpandedUnpublishedRowKeys] = useState([]);
  const [expandedWaitlistedPublishedRowKeys, setExpandedWaitlistedPublishedRowKeys] = useState([]);
  const [expandedWaitlistedUnpublishedRowKeys, setExpandedWaitlistedUnpublishedRowKeys] = useState([]);

  //#region Start of API Functions

  const fetchCreatorMemberTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.user.getCreatorSettings();

      if (isAPISuccess(status) && data) {
        setCreatorMemberTags(data.tags);
      }
    } catch (error) {
      console.error(error);
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
      console.error(error);
      showErrorModal('Failed fetching courses', error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }, []);

  const publishCourse = async (course) => {
    const emptyContentCount = getCourseEmptyContentCount(course?.modules);

    if (emptyContentCount > 0) {
      showErrorModal(
        'Course Outline detected',
        'This course has an outline but does not have content. Please add content before publishing it to avoid customers buying an empty course.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const { status } = await apis.courses.publishCourse(course.id);

      if (isAPISuccess(status)) {
        showSuccessModal('Course Published');
        fetchAllCoursesForCreator();
      }
    } catch (error) {
      showErrorModal('Failed to publish course', error.response?.data?.message || 'Something went wrong.');
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
      console.error(error);
      showErrorModal('Failed to unpublish course', error.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  };

  const cloneCourse = async (course) => {
    setIsLoading(true);

    if (!course) {
      message.error('Invalid course selected!');
      return;
    }

    try {
      const clonedPayload = {
        name: course.name + ' (Cloned)',
        course_image_url: course.course_image_url ?? '',
        summary: course.summary ?? '',
        description: course.description ?? '',
        topic: course.topic ?? [],
        faqs: course.faqs ?? [],
        price: course.price ?? 0,
        currency: course.currency ?? '',
        tag_ids: course.tag?.map((tagData) => tagData.external_id) ?? [],
        preview_image_url: course.preview_image_url ?? [],
        preview_video_urls: course.preview_video_urls ?? [],
        type: course.type ?? courseType.MIXED,
        max_participants: course.max_participants ?? 0,
        validity: course.validity ?? 0,
        start_date: course.start_date ?? moment().startOf('day').utc().format(),
        end_date: course.end_date ?? moment().endOf('day').add(10, 'day').utc().format(),
        modules: course.modules ?? [],
        waitlist: course.waitlist ?? false,
      };

      const { status, data } = await apis.courses.createCourse(clonedPayload);

      if (isAPISuccess(status) && data) {
        message.success('Course cloned successfully!');
        if (data?.id) {
          redirectToEditCourse(data?.id);
        }
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to clone course', error.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  };

  const closeCourseWaitlist = async (course) => {
    setIsLoading(true);

    try {
      const { status } = await apis.waitlist.closeCourseWaitlist(course.id);

      if (isAPISuccess(status)) {
        showSuccessModal(
          'Course open for registration',
          <>
            <Paragraph>The course is now available for purchase and the wait-list has been closed.</Paragraph>
            <Paragraph>
              We have sent notification emails to users who have joined the wait-list so they can come and purchase the
              course
            </Paragraph>
          </>
        );
        fetchAllCoursesForCreator();
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to close wait-list', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  const deleteCourse = async (course) => {
    setIsLoading(true);

    try {
      const { status } = await apis.courses.deleteCourse(course.id);

      if (isAPISuccess(status)) {
        showSuccessModal('Course has been cancelled!');
        fetchAllCoursesForCreator();
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to cancel course', error?.response?.data?.message || 'Something went wrong');
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
    const pageLink = `${generateUrlFromUsername(username)}${generatePath(Routes.courseDetails, {
      course_id: courseId,
    })}`;

    copyToClipboard(pageLink);
  };

  const redirectToCreateCourse = (e) => {
    preventDefaults(e);
    history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.createCourse);
  };

  const redirectToEditCourse = (courseExternalId) => {
    history.push(
      Routes.creatorDashboard.rootPath +
        generatePath(Routes.creatorDashboard.updateCourse, {
          course_id: courseExternalId,
        })
    );
  };

  const redirectToEditModules = (courseExternalId) => {
    history.push(
      Routes.creatorDashboard.rootPath +
        generatePath(Routes.creatorDashboard.createCourseModule, {
          course_id: courseExternalId,
        })
    );
  };

  //#endregion End Of Business Logics

  //#region Start Of Expandable Logics

  const toggleExpandAllPublished = () => {
    if (expandedPublishedRowKeys.length > 0) {
      setExpandedPublishedRowKeys([]);
    } else {
      setExpandedPublishedRowKeys(
        courses?.filter((course) => course.is_published && !course.waitlist).map((course) => course.id)
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
        courses?.filter((course) => !course.is_published && !course.waitlist).map((course) => course.id)
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

  const toggleExpandAllWaitlistedPublished = () => {
    if (expandedWaitlistedPublishedRowKeys.length > 0) {
      setExpandedWaitlistedPublishedRowKeys([]);
    } else {
      setExpandedWaitlistedPublishedRowKeys(
        courses?.filter((course) => course.is_published && course.waitlist).map((course) => course.id)
      );
    }
  };

  const expandRowWaitlistedPublished = (rowKey) => {
    const tempExpandedRowsArray = expandedWaitlistedPublishedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedWaitlistedPublishedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRowWaitlistedPublished = (rowKey) =>
    setExpandedWaitlistedPublishedRowKeys(expandedWaitlistedPublishedRowKeys.filter((key) => key !== rowKey));

  const toggleExpandAllWaitlistedUnpublished = () => {
    if (expandedWaitlistedUnpublishedRowKeys.length > 0) {
      setExpandedWaitlistedUnpublishedRowKeys([]);
    } else {
      setExpandedWaitlistedUnpublishedRowKeys(
        courses?.filter((course) => !course.is_published && course.waitlist).map((course) => course.id)
      );
    }
  };

  const expandRowWaitlistedUnpublished = (rowKey) => {
    const tempExpandedRowsArray = expandedWaitlistedUnpublishedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedWaitlistedUnpublishedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRowWaitlistedUnpublished = (rowKey) =>
    setExpandedWaitlistedUnpublishedRowKeys(expandedWaitlistedUnpublishedRowKeys.filter((key) => key !== rowKey));

  //#endregion End Of Expandable Logics

  //#region Start Of Table Columns

  const handleCloseWaitlistClicked = (course) => {
    Modal.confirm({
      centered: true,
      closable: true,
      maskClosable: true,
      width: 640,
      okText: 'Close Wait-list',
      onOk: () => closeCourseWaitlist(course),
      afterClose: resetBodyStyle,
      title: 'Are you sure about closing the wait-list?',
      content: (
        <>
          <Paragraph>The following things will happen once the wait-list is closed</Paragraph>
          <List
            size="large"
            dataSource={[
              'Users who have joined the wait-list will be notified to buy the course',
              'Anyone will be able to purchase the course and the wait-list will be closed',
            ]}
            renderItem={(item) => (
              <List.Item.Meta
                avatar={<CheckCircleTwoTone twoToneColor="#1890ff" />}
                description={<Paragraph strong>{item}</Paragraph>}
              />
            )}
          />
        </>
      ),
    });
  };

  const renderCourseName = (text, record) => {
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
  };

  const renderCourseDuration = (text, record) =>
    record?.type === 'VIDEO'
      ? `${record?.validity ?? 0} days`
      : `${toShortDateMonth(record.start_date)} - ${toShortDateMonth(record.end_date)}`;

  const renderCourseContents = (text, record) => {
    const sessionCount = getCourseSessionContentCount(record?.modules ?? []);
    const videoCount = getCourseVideoContentCount(record?.modules ?? []);
    const docCount = getCourseDocumentContentCount(record?.modules ?? []);
    const emptyCount = getCourseEmptyContentCount(record?.modules ?? []);

    if (!sessionCount && !videoCount && !docCount) {
      return <Tag>{`${emptyCount} outlines`}</Tag>;
    }

    return (
      <Space size={1} wrap={true}>
        {sessionCount > 0 ? (
          <Tag className={styles.mb5} color="blue">
            {`${sessionCount} sessions`}
          </Tag>
        ) : null}
        {videoCount > 0 ? (
          <Tag className={styles.mb5} color="purple">
            {`${videoCount} videos`}
          </Tag>
        ) : null}
        {docCount > 0 ? (
          <Tag className={styles.mb5} color="magenta">
            {`${docCount} files`}
          </Tag>
        ) : null}
        {emptyCount > 0 ? <Tag>{`${emptyCount} outlines`}</Tag> : null}
      </Space>
    );
  };

  const renderCoursePrice = (text, record) =>
    record.price > 0 ? `${record.currency?.toUpperCase()} ${record.price}` : 'Free';

  const renderCourseActions = (text, record) => (
    <Row gutter={4} justify="end" align="middle">
      <Col xs={6} xl={3}>
        <Tooltip title="Edit Course Details">
          <Button
            block
            type="text"
            onClick={() => redirectToEditCourse(record.id)}
            icon={<EditTwoTone twoToneColor="#08979c" />}
          />
        </Tooltip>
      </Col>
      <Col xs={6} xl={3}>
        <Tooltip title="Edit Course Modules">
          <Button block type="link" onClick={() => redirectToEditModules(record.id)} icon={<ProfileOutlined />} />
        </Tooltip>
      </Col>
      <Col xs={12} xl={5}>
        <Popover
          placement="topRight"
          content={
            <Space>
              <Tooltip title="Copy Course Link">
                <Button
                  type="link"
                  onClick={() => copyCourseLink(record.internal_id)}
                  icon={<CopyTwoTone twoToneColor="#08979c" />}
                />
              </Tooltip>
              <Tooltip title="Send Customer Email">
                <Button type="link" onClick={() => showSendEmailModal(record)} icon={<MailOutlined />} />
              </Tooltip>
              <Popconfirm
                title="Are you sure about cancelling the course?"
                okButtonProps={{ danger: true }}
                okText="Yes, cancel the course"
                cancelText="Nevermind"
                onConfirm={() => deleteCourse(record)}
              >
                <Tooltip title="Cancel Course">
                  <Button danger type="link" icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
              <Tooltip title="Clone This Course">
                <Button type="text" onClick={() => cloneCourse(record)} icon={<ExportOutlined />} />
              </Tooltip>
            </Space>
          }
        >
          <Button block type="text">
            More
          </Button>
        </Popover>
      </Col>
      <Col xs={12} xl={5}>
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
      <Col xs={12} xl={8}>
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
  );

  const renderWaitlistedCourseActions = (text, record) => (
    <Row gutter={4} justify="end" align="middle">
      <Col xs={6} xl={3}>
        <Tooltip title="Edit Course Details">
          <Button
            block
            type="text"
            onClick={() => redirectToEditCourse(record.id)}
            icon={<EditTwoTone twoToneColor="#08979c" />}
          />
        </Tooltip>
      </Col>
      <Col xs={6} xl={3}>
        <Tooltip title="Edit Course Modules">
          <Button block type="link" onClick={() => redirectToEditModules(record.id)} icon={<ProfileOutlined />} />
        </Tooltip>
      </Col>
      <Col xs={12} xl={5}>
        <Popover
          placement="topRight"
          content={
            <Space>
              <Tooltip title="Copy Course Link">
                <Button
                  type="link"
                  onClick={() => copyCourseLink(record.internal_id)}
                  icon={<CopyTwoTone twoToneColor="#08979c" />}
                />
              </Tooltip>
              <Tooltip title="Open Registrations">
                <Button
                  type="link"
                  className={styles.successBtn}
                  onClick={() => handleCloseWaitlistClicked(record)}
                  icon={<CarryOutOutlined />}
                />
              </Tooltip>
              <Popconfirm
                title="Are you sure about cancelling the course?"
                okButtonProps={{ danger: true }}
                okText="Yes, cancel the course"
                cancelText="Nevermind"
                onConfirm={() => deleteCourse(record)}
              >
                <Tooltip title="Cancel Course">
                  <Button danger type="link" icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
              <Tooltip title="Clone This Course">
                <Button type="text" onClick={() => cloneCourse(record)} icon={<ExportOutlined />} />
              </Tooltip>
            </Space>
          }
        >
          <Button block type="text">
            More
          </Button>
        </Popover>
      </Col>
      <Col xs={12} xl={5}>
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
      <Col xs={12} xl={8}>
        {record.is_published ? (
          expandedWaitlistedPublishedRowKeys.includes(record.id) ? (
            <Button block type="link" onClick={() => collapseRowWaitlistedPublished(record.id)}>
              {record.waitlist_users?.length} Wait-list <UpOutlined />
            </Button>
          ) : (
            <Button block type="link" onClick={() => expandRowWaitlistedPublished(record.id)}>
              {record.waitlist_users?.length} Wait-list <DownOutlined />
            </Button>
          )
        ) : expandedWaitlistedUnpublishedRowKeys.includes(record.id) ? (
          <Button block type="link" onClick={() => collapseRowWaitlistedUnpublished(record.id)}>
            {record.waitlist_users?.length} Wait-list <UpOutlined />
          </Button>
        ) : (
          <Button block type="link" onClick={() => expandRowWaitlistedUnpublished(record.id)}>
            {record.waitlist_users?.length} Wait-list <DownOutlined />
          </Button>
        )}
      </Col>
    </Row>
  );

  const generateWaitlistedCourseColumns = (published) => {
    const initialColumns = [
      {
        title: 'Course Name',
        dataIndex: 'name',
        key: 'name',
        render: renderCourseName,
      },
      {
        title: 'Duration',
        dataIndex: 'start_time',
        key: 'start_time',
        width: !xl ? '80px' : '120px',
        render: renderCourseDuration,
      },
      {
        title: 'Course Content',
        dataIndex: 'modules',
        key: 'modules',
        width: '170px',
        render: renderCourseContents,
      },
      {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        width: '90px',
        render: renderCoursePrice,
      },
      {
        title: published ? (
          <Button ghost type="primary" onClick={() => toggleExpandAllWaitlistedPublished()}>
            {expandedWaitlistedPublishedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
          </Button>
        ) : (
          <Button ghost type="primary" onClick={() => toggleExpandAllWaitlistedUnpublished()}>
            {expandedWaitlistedUnpublishedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
          </Button>
        ),
        width: !xl ? '200px' : '310px',
        align: 'right',
        render: renderWaitlistedCourseActions,
      },
    ];

    if (creatorMemberTags.length > 0) {
      const tagColumnPosition = 1;
      const tagColumnObject = {
        title: 'Viewable By',
        key: 'tag',
        dataIndex: 'tag',
        width: '110px',
        render: (text, record) => <TagListPopup tags={record.tag} />,
      };

      initialColumns.splice(tagColumnPosition, 0, tagColumnObject);
    }

    return initialColumns;
  };

  const generateCourseColumns = (published) => {
    const initialColumns = [
      {
        title: 'Course Name',
        dataIndex: 'name',
        key: 'name',
        render: renderCourseName,
      },
      {
        title: 'Duration',
        dataIndex: 'start_time',
        key: 'start_time',
        width: !xl ? '80px' : '120px',
        render: renderCourseDuration,
      },
      {
        title: 'Course Content',
        dataIndex: 'modules',
        key: 'modules',
        width: '170px',
        render: renderCourseContents,
      },
      {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        width: '90px',
        render: renderCoursePrice,
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
        width: !xl ? '200px' : '310px',
        align: 'right',
        render: renderCourseActions,
      },
    ];

    if (creatorMemberTags.length > 0) {
      const tagColumnPosition = 1;
      const tagColumnObject = {
        title: 'Purchasable By',
        key: 'tag',
        dataIndex: 'tag',
        width: '110px',
        render: (text, record) => <TagListPopup tags={record.tag} />,
      };

      initialColumns.splice(tagColumnPosition, 0, tagColumnObject);
    }

    return initialColumns;
  };

  const waitlistUserColumns = [
    {
      title: 'Name',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
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

  const renderWaitlistUserList = (record) => (
    <div className={classNames(styles.mb20, styles.mt20)}>
      <Table
        columns={waitlistUserColumns}
        data={record.waitlist_users ?? []}
        rowKey={(user) => `${user.full_name}_${user.email}`}
      />
    </div>
  );

  const renderBuyersList = (record) => {
    return (
      <div className={classNames(styles.mb20, styles.mt20)}>
        <Table
          columns={buyersColumns}
          data={record.buyers ?? []}
          rowKey={(buyer) => `${buyer.name}_${buyer.date_of_purchase}`}
        />
      </div>
    );
  };

  const renderMobileWaitlistUserCards = (waitlistUser) => {
    const layout = (label, value) => (
      <Row>
        <Col span={8}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={16}>: {value}</Col>
      </Row>
    );

    return (
      <Col xs={24} key={waitlistUser.email}>
        <Card bodyStyle={{ padding: '20px 10px' }} title={<Title level={5}> {waitlistUser.full_name} </Title>}>
          {layout('Email', <Text strong> {waitlistUser.email || ''} </Text>)}
        </Card>
      </Col>
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
            <Tooltip title="Edit">
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => redirectToEditCourse(course.id)}
                icon={<EditTwoTone twoToneColor="#08979c" />}
              />
            </Tooltip>,
            <Popover
              trigger="click"
              content={
                <Space>
                  <Tooltip title="Copy Course Link">
                    <Button
                      type="link"
                      className={styles.detailsButton}
                      onClick={() => copyCourseLink(course.internal_id)}
                      icon={<CopyTwoTone twoToneColor="#08979c" />}
                    />
                  </Tooltip>
                  {course.waitlist ? (
                    <>
                      <Tooltip title="Open Registrations">
                        <Button
                          type="link"
                          className={styles.successBtn}
                          onClick={() => handleCloseWaitlistClicked(course)}
                          icon={<CarryOutOutlined />}
                        />
                      </Tooltip>
                    </>
                  ) : (
                    <Tooltip title="Send Customer Email">
                      <Button type="link" onClick={() => showSendEmailModal(course)} icon={<MailOutlined />} />
                    </Tooltip>
                  )}
                  <Popconfirm
                    title="Are you sure about cancelling the course?"
                    okButtonProps={{ danger: true }}
                    okText="Yes, cancel the course"
                    cancelText="Nevermind"
                    onConfirm={() => deleteCourse(course)}
                  >
                    <Tooltip title="Cancel Course">
                      <Button danger type="link" icon={<DeleteOutlined />} />
                    </Tooltip>
                  </Popconfirm>
                  <Tooltip title="Clone This Course">
                    <Button type="text" onClick={() => cloneCourse(course)} icon={<ExportOutlined />} />
                  </Tooltip>
                </Space>
              }
            >
              <Button type="text">More</Button>
            </Popover>,
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
            course.waitlist ? (
              course.is_published ? (
                expandedWaitlistedPublishedRowKeys.includes(course.id) ? (
                  <Button type="link" onClick={() => collapseRowWaitlistedPublished(course.id)} icon={<UpOutlined />} />
                ) : (
                  <Button type="link" onClick={() => expandRowWaitlistedPublished(course.id)} icon={<DownOutlined />} />
                )
              ) : expandedWaitlistedUnpublishedRowKeys.includes(course.id) ? (
                <Button type="link" onClick={() => collapseRowWaitlistedUnpublished(course.id)} icon={<UpOutlined />} />
              ) : (
                <Button type="link" onClick={() => expandRowWaitlistedUnpublished(course.id)} icon={<DownOutlined />} />
              )
            ) : course.is_published ? (
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
                : `${toShortDateMonth(course.start_date)} - ${toShortDateMonth(course.end_date)}`}
            </Text>
          )}
          {layout('Content', renderCourseContents('', course))}
          {layout(
            'Price',
            <Text>{course.price > 0 ? `${course.currency?.toUpperCase()} ${course.price}` : 'Free'}</Text>
          )}
          {creatorMemberTags.length > 0 && <TagListPopup tags={course.tag} mobileView={true} />}
        </Card>
        {course.waitlist
          ? course.is_published
            ? expandedWaitlistedPublishedRowKeys.includes(course.id) && (
                <Row className={styles.cardExpansion} gutter={[8, 8]}>
                  {course.waitlist_users?.map(renderMobileWaitlistUserCards)}
                </Row>
              )
            : expandedWaitlistedUnpublishedRowKeys.includes(course.id) && (
                <Row className={styles.cardExpansion} gutter={[8, 8]}>
                  {course.waitlist_users?.map(renderMobileWaitlistUserCards)}
                </Row>
              )
          : course.is_published
          ? expandedPublishedRowKeys.includes(course.id) && (
              <Row className={styles.cardExpansion} gutter={[8, 8]}>
                {course.buyers?.map(renderMobileSubscriberCards)}
              </Row>
            )
          : expandedUnpublishedRowKeys.includes(course.id) && (
              <Row className={styles.cardExpansion} gutter={[8, 8]}>
                {course.buyers?.map(renderMobileSubscriberCards)}
              </Row>
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
            <Col xs={24} sm={12} md={14} lg={18}>
              <Title level={3}> Courses </Title>
            </Col>
            <Col xs={24} sm={12} md={10} lg={6} className={styles.textAlignRight}>
              <Button size="large" type="primary" onClick={redirectToCreateCourse}>
                Create New Course
              </Button>
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          <Loader loading={isLoading} size="large" text="Fetching Courses">
            <Collapse defaultActiveKey={['published', 'unpublished']}>
              <Panel
                header={
                  <Title level={4} className={styles.collapseHeaderText}>
                    {' '}
                    Published{' '}
                  </Title>
                }
                key="published"
              >
                <Row gutter={[12, 20]}>
                  {userDetails?.profile?.payment_provider === paymentProvider.STRIPE &&
                    courses?.filter((course) => course.is_published && course.waitlist).length > 0 && (
                      <Col xs={24}>
                        <Title level={5}>Wait-list Course</Title>
                        {!md ? (
                          <Row gutter={[8, 16]}>
                            <Col xs={24}>
                              <Button block ghost type="primary" onClick={toggleExpandAllWaitlistedPublished}>
                                {expandedWaitlistedPublishedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
                              </Button>
                            </Col>
                            {courses?.filter((course) => course.is_published && course.waitlist).map(renderCourseItem)}
                          </Row>
                        ) : (
                          <Table
                            size="small"
                            sticky={true}
                            columns={generateWaitlistedCourseColumns(true)}
                            data={courses?.filter((course) => course.is_published && course.waitlist)}
                            rowKey={(record) => record.id}
                            expandable={{
                              expandedRowRender: renderWaitlistUserList,
                              expandRowByClick: true,
                              expandIconColumnIndex: -1,
                              expandedRowKeys: expandedWaitlistedPublishedRowKeys,
                            }}
                          />
                        )}
                      </Col>
                    )}
                  <Col xs={24}>
                    {userDetails?.profile?.payment_provider === paymentProvider.STRIPE && (
                      <Title level={5}>Normal Course</Title>
                    )}
                    {!md ? (
                      <Row gutter={[8, 16]}>
                        <Col xs={24}>
                          <Button block ghost type="primary" onClick={toggleExpandAllPublished}>
                            {expandedPublishedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
                          </Button>
                        </Col>
                        {courses?.filter((course) => course.is_published && !course.waitlist).map(renderCourseItem)}
                      </Row>
                    ) : (
                      <Table
                        size="small"
                        sticky={true}
                        columns={generateCourseColumns(true)}
                        data={courses?.filter((course) => course.is_published && !course.waitlist)}
                        rowKey={(record) => record.id}
                        expandable={{
                          expandedRowRender: renderBuyersList,
                          expandRowByClick: true,
                          expandIconColumnIndex: -1,
                          expandedRowKeys: expandedPublishedRowKeys,
                        }}
                      />
                    )}
                  </Col>
                </Row>
              </Panel>
              <Panel
                header={
                  <Title level={4} className={styles.collapseHeaderText}>
                    Unpublished
                  </Title>
                }
                key="unpublished"
              >
                <Row gutter={[12, 20]}>
                  {userDetails?.profile?.payment_provider === paymentProvider.STRIPE &&
                    courses?.filter((course) => !course.is_published && course.waitlist).length > 0 && (
                      <Col xs={24}>
                        <Title level={5}>Wait-list Course</Title>
                        {!md ? (
                          <Row gutter={[8, 16]}>
                            <Col xs={24}>
                              <Button block ghost type="primary" onClick={toggleExpandAllWaitlistedUnpublished}>
                                {expandedWaitlistedUnpublishedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
                              </Button>
                            </Col>
                            {courses?.filter((course) => !course.is_published && course.waitlist).map(renderCourseItem)}
                          </Row>
                        ) : (
                          <Table
                            size="small"
                            sticky={true}
                            columns={generateWaitlistedCourseColumns(false)}
                            data={courses?.filter((course) => !course.is_published && course.waitlist)}
                            rowKey={(record) => record.id}
                            expandable={{
                              expandedRowRender: renderWaitlistUserList,
                              expandRowByClick: true,
                              expandIconColumnIndex: -1,
                              expandedRowKeys: expandedUnpublishedRowKeys,
                            }}
                          />
                        )}
                      </Col>
                    )}

                  <Col xs={24}>
                    {userDetails?.profile?.payment_provider === paymentProvider.STRIPE && (
                      <Title level={5}>Normal Course</Title>
                    )}
                    {!md ? (
                      <Row gutter={[8, 16]}>
                        <Col xs={24}>
                          <Button block ghost type="primary" onClick={() => toggleExpandAllUnpublished()}>
                            {expandedUnpublishedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
                          </Button>
                        </Col>
                        {courses?.filter((course) => !course.is_published && !course.waitlist).map(renderCourseItem)}
                      </Row>
                    ) : (
                      <Table
                        size="small"
                        sticky={true}
                        columns={generateCourseColumns(false)}
                        data={courses?.filter((course) => !course.is_published && !course.waitlist)}
                        rowKey={(record) => record.id}
                        expandable={{
                          expandedRowRender: renderBuyersList,
                          expandRowByClick: true,
                          expandIconColumnIndex: -1,
                          expandedRowKeys: expandedUnpublishedRowKeys,
                        }}
                      />
                    )}
                  </Col>
                </Row>
              </Panel>
            </Collapse>
          </Loader>
        </Col>
      </Row>
    </div>
  );
};

export default Courses;
