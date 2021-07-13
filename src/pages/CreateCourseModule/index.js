import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';

import { Row, Col, Button, Form, Typography, Modal, Collapse, Tooltip, Input, Image, PageHeader, Space } from 'antd';
import {
  PlusOutlined,
  PlayCircleOutlined,
  VideoCameraAddOutlined,
  PlusCircleOutlined,
  MinusCircleTwoTone,
  DeleteOutlined,
} from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Loader from 'components/Loader';
import DefaultImage from 'components/Icons/DefaultImage';
import { showErrorModal, resetBodyStyle, showSuccessModal } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const courseTypes = {
  LIVE: {
    name: 'LIVE',
    label: 'Live sessions only',
  },
  MIXED: {
    name: 'MIXED',
    label: 'Both live sessions & videos',
  },
  VIDEO: {
    name: 'VIDEO',
    label: 'Videos only',
  },
};

const formInitialValues = {
  modules: [
    {
      name: 'Module 1',
      module_content: [
        {
          name: 'Content 1',
          product_type: '',
          product_id: '',
        },
      ],
    },
  ],
  type: 'MIXED',
  max_participants: 2,
  start_date: moment().startOf('day').utc().format(),
  end_date: moment().endOf('day').utc().format(),
  validity: 1,
};

const { Panel } = Collapse;
const { Text, Title } = Typography;

const CreateCourseModule = ({ match, history }) => {
  const [form] = Form.useForm();

  const courseId = match.params.course_id;

  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [videos, setVideos] = useState([]);
  const [inventories, setInventories] = useState([]);

  const [videoPopupVisible, setVideoPopupVisible] = useState(false);
  const [sessionPopupVisible, setSessionPopupVisible] = useState(false);
  const [addVideoContentMethod, setAddVideoContentMethod] = useState(null);
  const [addSessionContentMethod, setAddSessionContentMethod] = useState(null);

  const [courseDetails, setCourseDetails] = useState(null);
  const [expandedModulesKeys, setExpandedModulesKeys] = useState([]);

  const redirectToCourseSectionDashboard = useCallback(
    () => history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.courses),
    [history]
  );

  const fetchCreatorUpcomingSessionInventories = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.session.getUpcomingSession();

      if (isAPISuccess(status) && data) {
        setInventories(data);
      }
    } catch (error) {
      showErrorModal('Failed to fetch course classes', error?.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  }, []);

  const fetchVideosForCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.videos.getCreatorVideos();

      if (isAPISuccess(status) && data) {
        setVideos(data);
      }
    } catch (error) {
      showErrorModal('Failed to fetch videos', error?.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  }, []);

  const fetchCourseDetails = useCallback(
    async (courseExternalId) => {
      setIsLoading(true);

      try {
        const { status, data } = await apis.courses.getCreatorCourseDetailsById(courseExternalId);

        if (isAPISuccess(status) && data) {
          setCourseDetails(data);

          // TODO: Also set other fields here
          form.setFieldsValue({
            modules: data.modules,
          });
        } else {
          form.resetFields();
        }
      } catch (error) {
        console.error(error);
        showErrorModal('Failed fetching course details', error?.response?.data?.message || 'Something went wrong.');
      }

      setIsLoading(false);
    },
    [form]
  );

  useEffect(() => {
    if (courseId) {
      fetchCreatorUpcomingSessionInventories();
      fetchVideosForCreator();
      fetchCourseDetails(courseId);
    } else {
      showErrorModal('No Course Id Detected');
      redirectToCourseSectionDashboard();
    }
  }, [
    courseId,
    history,
    fetchCourseDetails,
    fetchVideosForCreator,
    fetchCreatorUpcomingSessionInventories,
    redirectToCourseSectionDashboard,
  ]);

  const openSessionPopup = (addSessionMethod) => {
    setAddSessionContentMethod(() => addSessionMethod);
    setSessionPopupVisible(true);
  };

  const openVideoPopup = (addVideoMethod) => {
    setAddVideoContentMethod(() => addVideoMethod);
    setVideoPopupVisible(true);
  };

  const addSessionsToContent = (data) => {
    if (addSessionContentMethod) {
      addSessionContentMethod(data);
    }
  };

  const addVideosToContent = (data) => {
    if (addVideoContentMethod) {
      addVideoContentMethod(data);
    }
  };

  const handleFinish = async (values) => {
    setSubmitting(true);

    if (!courseId || !courseDetails) {
      showErrorModal('Invalid course selected!');
      setTimeout(() => redirectToCourseSectionDashboard(), 2000);
    }

    // TODO: Match these with the actual form names and value/states
    const modifiedFields = {
      modules: values.modules,
      type: 'MIXED',
      max_participants: values.max_participants ?? 0,
      start_date: moment().startOf('day').utc().format(),
      end_date: moment().endOf('day').utc().format(),
      validity: values.validity ?? 1,
    };

    // NOTE : We'll only modify the related fields and keep everything else the same
    const payload = {
      name: courseDetails?.name,
      course_image_url: courseDetails?.course_image_url,
      summary: courseDetails?.summary,
      description: courseDetails?.description,
      topic: courseDetails?.topic,
      faqs: courseDetails?.faqs,
      price: courseDetails?.price,
      currency: courseDetails?.currency,
      tag_ids: courseDetails?.tag?.map((tagData) => tagData.external_id),
      preview_image_url: courseDetails?.preview_image_url,
      ...modifiedFields,
    };

    console.log(payload);
    return;

    try {
      const { status } = await apis.courses.updateCourse(courseId, payload);

      if (isAPISuccess(status)) {
        showSuccessModal(`${courseDetails.name ?? 'Course'} updated successfully`);
        setTimeout(() => redirectToCourseSectionDashboard(), 2000);
      }
    } catch (error) {
      showErrorModal(`Failed to update course`, error?.response?.data?.message || 'Something went wrong.');
    }

    setSubmitting(false);
  };

  const sessionPopup = (
    <Modal
      title={<Title level={5}> Add Sessions To Module </Title>}
      visible={sessionPopupVisible}
      centered={true}
      onCancel={() => setSessionPopupVisible(false)}
      footer={null}
      width={640}
      afterClose={resetBodyStyle}
    >
      <Row gutter={[8, 12]} className={styles.contentPopupItemContainer}>
        {inventories.map((inventory) => (
          <Col xs={24} key={inventory.inventory_external_id}>
            <Row gutter={[12, 12]} className={styles.contentPopupItem}>
              <Col xs={24} md={6}>
                <Image
                  src={inventory.session_image_url || 'error'}
                  alt={inventory.name}
                  fallback={DefaultImage()}
                  className={styles.thumbnailImage}
                />
              </Col>
              <Col xs={24} md={18}>
                <Space size="large" direction="vertical">
                  <Title level={4}>{inventory.name}</Title>
                  <Button
                    onClick={() =>
                      addSessionsToContent({
                        name: inventory.name,
                        product_id: inventory.inventory_external_id,
                        product_type: 'SESSION',
                      })
                    }
                  >
                    Add to Course
                  </Button>
                </Space>
              </Col>
            </Row>
          </Col>
        ))}
      </Row>
    </Modal>
  );

  const videoPopup = (
    <Modal
      title={<Title level={5}> Add Videos To Module </Title>}
      visible={videoPopupVisible}
      centered={true}
      onCancel={() => setVideoPopupVisible(false)}
      footer={null}
      width={640}
      afterClose={resetBodyStyle}
    >
      <Row gutter={[8, 12]} className={styles.contentPopupItemContainer}>
        {videos.map((video) => (
          <Col xs={24} key={video.external_id}>
            <Row gutter={[12, 12]} className={styles.contentPopupItem}>
              <Col xs={24} md={6}>
                <Image
                  src={video.thumbnail_url || 'error'}
                  alt={video.title}
                  fallback={DefaultImage()}
                  className={styles.thumbnailImage}
                />
              </Col>
              <Col xs={24} md={18}>
                <Space size="large" direction="vertical">
                  <Title level={4}>{video.title}</Title>
                  <Button
                    onClick={() =>
                      addVideosToContent({
                        name: video.title,
                        product_id: video.external_id,
                        product_type: 'VIDEO',
                      })
                    }
                  >
                    Add to Course
                  </Button>
                </Space>
              </Col>
            </Row>
          </Col>
        ))}
      </Row>
    </Modal>
  );

  return (
    <>
      {sessionPopup}
      {videoPopup}
      <div className={styles.box}>
        <Loader size="large" loading={isLoading}>
          <Form
            layout="horizontal"
            name="courseModuleForm"
            form={form}
            onFinish={handleFinish}
            initialValues={formInitialValues}
            scrollToFirstError={true}
          >
            <Row gutter={[12, 12]} className={styles.coursePageContainer}>
              <Col xs={24}>
                <PageHeader
                  title="Manage Course Curriculum"
                  onBack={() => history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.courses)}
                />
              </Col>
              <Col xs={24}>
                <div className={styles.courseFormListContainer}>
                  <Form.List name="modules" rules={validationRules.courseModulesValidation}>
                    {(moduleFields, { add: addMoreModule, remove: removeModule }, { errors: moduleErrors }) => (
                      <Row gutter={[8, 12]}>
                        <Col xs={24}>
                          <Collapse
                            defaultActiveKey={moduleFields[0]?.name ?? 0}
                            activeKey={expandedModulesKeys}
                            onChange={setExpandedModulesKeys}
                          >
                            {moduleFields.map(
                              ({
                                key: moduleKey,
                                name: moduleFieldName,
                                fieldKey: moduleFieldKey,
                                ...moduleFormItemRestFields
                              }) => (
                                <Panel
                                  key={moduleKey}
                                  extra={
                                    <DeleteOutlined
                                      className={styles.deleteModuleIconButton}
                                      onClick={() => removeModule(moduleFieldName)}
                                    />
                                  }
                                  header={
                                    <Form.Item
                                      {...moduleFormItemRestFields}
                                      id="module_name"
                                      name={[moduleFieldName, 'name']}
                                      fieldKey={[moduleFieldKey, 'name']}
                                      className={styles.panelHeaderFormItem}
                                    >
                                      <Input
                                        placeholder="Module name"
                                        maxLength={50}
                                        className={styles.panelHeaderFormInput}
                                      />
                                    </Form.Item>
                                  }
                                >
                                  <Row>
                                    <Col xs={24}>
                                      <Form.List
                                        {...moduleFormItemRestFields}
                                        name={[moduleFieldName, 'module_content']}
                                      >
                                        {(
                                          contentFields,
                                          { add: addMoreContent, remove: removeContent },
                                          { errors: contentErrors }
                                        ) => (
                                          <Row gutter={[8, 8]}>
                                            <Col xs={24}>
                                              {contentFields.map(
                                                ({
                                                  key: contentKey,
                                                  name: contentName,
                                                  fieldKey: contentFieldKey,
                                                  ...contentFormItemRestFields
                                                }) => (
                                                  <Row
                                                    gutter={[10, 10]}
                                                    align="middle"
                                                    className={styles.contentListItem}
                                                  >
                                                    <Col xs={18}>
                                                      <Form.Item
                                                        {...contentFormItemRestFields}
                                                        id="content_name"
                                                        name={[contentName, 'name']}
                                                        fieldKey={[contentFieldKey, 'name']}
                                                        className={styles.inlineFormItem}
                                                      >
                                                        <Input placeholder="Content name" maxLength={50} />
                                                      </Form.Item>
                                                      <Form.Item
                                                        hidden={true}
                                                        id="content_id"
                                                        name={[contentName, 'product_id']}
                                                        fieldKey={[contentFieldKey, 'product_id']}
                                                      >
                                                        <Input placeholder="Content ID" maxLength={50} />
                                                      </Form.Item>
                                                      <Form.Item
                                                        hidden={true}
                                                        id="content_type"
                                                        name={[contentName, 'product_type']}
                                                        fieldKey={[contentFieldKey, 'product_type']}
                                                      >
                                                        <Input placeholder="Content Type" maxLength={50} />
                                                      </Form.Item>
                                                    </Col>
                                                    <Col xs={6}>
                                                      <Row gutter={[10, 10]} justify="end">
                                                        <Col xs={6}>
                                                          <Tooltip title="Add Video Content">
                                                            <PlayCircleOutlined
                                                              onClick={() => openVideoPopup(addMoreContent)}
                                                            />
                                                          </Tooltip>
                                                        </Col>
                                                        <Col xs={6}>
                                                          <Tooltip title="Add Session Content">
                                                            <VideoCameraAddOutlined
                                                              onClick={() => openSessionPopup(addMoreContent)}
                                                            />
                                                          </Tooltip>
                                                        </Col>
                                                        <Col xs={6}>
                                                          <Tooltip title="Remove content">
                                                            <MinusCircleTwoTone
                                                              twoToneColor="#FF0000"
                                                              onClick={() => removeContent(contentName)}
                                                            />
                                                          </Tooltip>
                                                        </Col>
                                                      </Row>
                                                    </Col>
                                                  </Row>
                                                )
                                              )}
                                            </Col>
                                            {contentErrors && (
                                              <Col xs={24}>
                                                <Text type="danger"> {contentErrors} </Text>
                                              </Col>
                                            )}
                                            <Col xs={24}>
                                              <Row justify="center">
                                                <Col>
                                                  <Button
                                                    size="large"
                                                    type="primary"
                                                    onClick={() => addMoreContent()}
                                                    icon={<PlusOutlined />}
                                                    className={styles.greenBtn}
                                                  >
                                                    Add More Content
                                                  </Button>
                                                </Col>
                                              </Row>
                                            </Col>
                                          </Row>
                                        )}
                                      </Form.List>
                                    </Col>
                                  </Row>
                                </Panel>
                              )
                            )}
                          </Collapse>
                        </Col>
                        <Col xs={24}>
                          <Row justify="center">
                            <Col xs={24} md={8} lg={6} xl={4}>
                              <Button
                                ghost
                                size="large"
                                type="primary"
                                onClick={() => addMoreModule()}
                                icon={<PlusCircleOutlined />}
                              >
                                Add more module
                              </Button>
                            </Col>
                            <Col xs={24} md={8} lg={6} xl={4}>
                              <Button size="large" type="primary" htmlType="submit" loading={submitting}>
                                Update Course Curriculum
                              </Button>
                            </Col>
                          </Row>
                        </Col>
                        {moduleErrors && (
                          <Col xs={24}>
                            <Text type="danger"> {moduleErrors} </Text>
                          </Col>
                        )}
                      </Row>
                    )}
                  </Form.List>
                </div>
              </Col>
            </Row>
          </Form>
        </Loader>
      </div>
    </>
  );
};

export default CreateCourseModule;
