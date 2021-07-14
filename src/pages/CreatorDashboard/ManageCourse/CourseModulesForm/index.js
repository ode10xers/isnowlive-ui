import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';

import {
  Row,
  Col,
  Button,
  Form,
  Typography,
  Collapse,
  Tooltip,
  Input,
  InputNumber,
  PageHeader,
  Radio,
  DatePicker,
} from 'antd';
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
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import SessionContentPopup from '../SessionContentPopup';
import VideoContentPopup from '../VideoContentPopup';

import dateUtil from 'utils/date';
import validationRules from 'utils/validation';
import { isAPISuccess } from 'utils/helper';

import { courseCreatePageLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';

const courseCurriculumTypes = {
  MIXED: {
    name: 'MIXED',
    label: 'Both live sessions & videos',
  },
  LIVE: {
    name: 'LIVE',
    label: 'Live sessions only',
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
  curriculumType: courseCurriculumTypes.MIXED.name,
  max_participants: 1,
  validity: 1,
  start_date: moment(),
  end_date: moment().add(1, 'day'),
};

const { Panel } = Collapse;
const { Text } = Typography;

const {
  timeCalculation: { dateIsBeforeDate },
} = dateUtil;

const CourseModulesForm = ({ match, history }) => {
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
  const [courseCurriculumType, setCourseCurriculumType] = useState(courseCurriculumTypes.MIXED.name);
  const [courseStartDate, setCourseStartDate] = useState(moment());
  const [courseEndDate, setCourseEndDate] = useState(moment().add(1, 'day'));

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

          form.setFieldsValue({
            modules: data?.modules ?? [],
            curriculumType: data?.type || courseCurriculumTypes.MIXED.name,
            courseStartDate: data?.start_date ? moment(data?.start_date) : moment(),
            courseEndDate: data?.end_date ? moment(data?.end_date) : moment().add(1, 'day'),
            maxParticipants: data?.max_participants ?? 1,
            validity: data?.validity ?? 1,
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

  const handleCourseCurriculumTypeChange = (e) => {
    const curriculumType = e.target.value;
    setCourseCurriculumType(curriculumType);
  };

  const handleStartDateChange = (date) => {
    setCourseStartDate(date);

    if (!date || (courseEndDate && dateIsBeforeDate(courseEndDate, date))) {
      setCourseEndDate(null);
      form.setFieldsValue({ ...form.getFieldsValue(), courseEndDate: undefined });
    }
  };

  const disabledStartDates = (currentDate) => {
    return dateIsBeforeDate(currentDate, moment().startOf('day'));
  };

  const handleEndDateChange = (date) => {
    if (dateIsBeforeDate(courseStartDate, date)) {
      setCourseEndDate(date);
    }
  };

  const disabledEndDates = (currentDate) => {
    return dateIsBeforeDate(currentDate, moment().startOf('day')) || dateIsBeforeDate(currentDate, courseStartDate);
  };

  const handleFinish = async (values) => {
    setSubmitting(true);

    if (!courseId || !courseDetails) {
      showErrorModal('Invalid course selected!');
      setTimeout(() => redirectToCourseSectionDashboard(), 2000);
    }

    const modifiedFields = {
      modules: values.modules,
      type: courseCurriculumType ?? values.curriculumType ?? courseCurriculumTypes.MIXED.name,
      max_participants: values.maxParticipants ?? 1,
      start_date: moment(courseStartDate).startOf('day').utc().format(),
      end_date: moment(courseEndDate).endOf('day').utc().format(),
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

  // TODO: Improve Error UX here
  const handleFinishFailed = ({ errorFields }) => {
    console.log(errorFields);
  };

  const openSessionPopup = (addSessionMethod) => {
    setAddSessionContentMethod(() => addSessionMethod);
    setSessionPopupVisible(true);
  };

  const closeSessionPopup = () => {
    setSessionPopupVisible(false);
  };

  const openVideoPopup = (addVideoMethod) => {
    setAddVideoContentMethod(() => addVideoMethod);
    setVideoPopupVisible(true);
  };

  const closeVideoPopup = () => {
    setVideoPopupVisible(false);
  };

  const isVideosOnlyCourse = () => courseCurriculumType && courseCurriculumType === courseCurriculumTypes.VIDEO.name;

  const getContentProductType = (moduleName, contentName) =>
    form.getFieldValue(['modules', moduleName, 'module_content', contentName, 'product_type']);

  return (
    <>
      <SessionContentPopup
        visible={sessionPopupVisible}
        closeModal={closeSessionPopup}
        inventories={inventories}
        addContentMethod={addSessionContentMethod}
      />
      <VideoContentPopup
        visible={videoPopupVisible}
        closeModal={closeVideoPopup}
        videos={videos}
        addContentMethod={addVideoContentMethod}
      />
      <div className={styles.box}>
        <Loader size="large" loading={isLoading}>
          <Form
            layout="horizontal"
            name="courseModuleForm"
            form={form}
            onFinish={handleFinish}
            onFinishFailed={handleFinishFailed}
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
              {/* Course Module Informations */}
              <Col xs={24}>
                <Row>
                  <Col xs={24}>
                    <Form.Item
                      {...courseCreatePageLayout}
                      id="curriculumType"
                      name="curriculumType"
                      label="What would you like to offer in this course?"
                      rules={validationRules.requiredValidation}
                      onChange={handleCourseCurriculumTypeChange}
                    >
                      <Radio.Group>
                        {Object.entries(courseCurriculumTypes).map(([key, val]) => (
                          <Radio key={key} value={val.name}>
                            {' '}
                            {val.label}{' '}
                          </Radio>
                        ))}
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                  {/* Start and end date fields */}
                  <Col xs={isVideosOnlyCourse() ? 0 : 24}>
                    <Form.Item
                      {...courseCreatePageLayout}
                      label="Course Duration"
                      required={true}
                      hidden={isVideosOnlyCourse()}
                    >
                      <Row gutter={8}>
                        <Col xs={12}>
                          <Form.Item
                            id="courseStartDate"
                            name="courseStartDate"
                            rules={isVideosOnlyCourse() ? [] : validationRules.requiredValidation}
                            noStyle
                          >
                            <DatePicker
                              placeholder="Select Start Date"
                              onChange={handleStartDateChange}
                              disabledDate={disabledStartDates}
                              className={styles.datePicker}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12}>
                          <Form.Item
                            id="courseEndDate"
                            name="courseEndDate"
                            rules={isVideosOnlyCourse() ? [] : validationRules.requiredValidation}
                            noStyle
                          >
                            <DatePicker
                              placeholder="Select End Date"
                              disabled={!Boolean(courseStartDate)}
                              onChange={handleEndDateChange}
                              disabledDate={disabledEndDates}
                              className={styles.datePicker}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Form.Item>
                  </Col>
                  {/* Max Participants */}
                  <Col xs={isVideosOnlyCourse() ? 0 : 24}>
                    <Form.Item
                      {...courseCreatePageLayout}
                      hidden={isVideosOnlyCourse()}
                      id="maxParticipants"
                      name="maxParticipants"
                      label="Max Participants"
                      rules={
                        isVideosOnlyCourse()
                          ? []
                          : validationRules.numberValidation('Please input course max participants', 1)
                      }
                    >
                      <InputNumber placeholder="Course Max Participants" min={1} className={styles.numericInput} />
                    </Form.Item>
                  </Col>
                  {/* Validity Field */}
                  <Col xs={isVideosOnlyCourse() ? 24 : 0}>
                    <Form.Item
                      {...courseCreatePageLayout}
                      hidden={!isVideosOnlyCourse()}
                      id="videoValidity"
                      name="validity"
                      label="Validity (days)"
                      rules={
                        isVideosOnlyCourse()
                          ? validationRules.numberValidation('Please input course videos validity', 1)
                          : []
                      }
                    >
                      <InputNumber placeholder="Course Videos Validity" min={1} className={styles.numericInput} />
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
              {/* Course Modules */}
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
                                        rules={validationRules.courseModuleContentValidation}
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
                                                  name: contentFieldName,
                                                  fieldKey: contentFieldKey,
                                                  ...contentFormItemRestFields
                                                }) => (
                                                  <Row
                                                    key={contentKey}
                                                    gutter={[10, 10]}
                                                    align="middle"
                                                    className={styles.contentListItem}
                                                  >
                                                    <Col xs={16}>
                                                      <Form.Item
                                                        {...contentFormItemRestFields}
                                                        id="content_name"
                                                        name={[contentFieldName, 'name']}
                                                        fieldKey={[contentFieldKey, 'name']}
                                                        className={styles.inlineFormItem}
                                                      >
                                                        <Input placeholder="Content name" maxLength={50} />
                                                      </Form.Item>
                                                      <Form.Item
                                                        hidden={true}
                                                        id="content_id"
                                                        name={[contentFieldName, 'product_id']}
                                                        fieldKey={[contentFieldKey, 'product_id']}
                                                      >
                                                        <Input placeholder="Content ID" maxLength={50} />
                                                      </Form.Item>
                                                      <Form.Item
                                                        hidden={true}
                                                        id="content_type"
                                                        name={[contentFieldName, 'product_type']}
                                                        fieldKey={[contentFieldKey, 'product_type']}
                                                      >
                                                        <Input placeholder="Content Type" maxLength={50} />
                                                      </Form.Item>
                                                    </Col>
                                                    <Col xs={8}>
                                                      <Row gutter={[10, 10]} justify="end" align="middle">
                                                        {getContentProductType(moduleFieldName, contentFieldName) ? (
                                                          <Col xs={12}>
                                                            <Text type="secondary" className={styles.textAlignRight}>
                                                              {getContentProductType(
                                                                moduleFieldName,
                                                                contentFieldName
                                                              )[0].toUpperCase()}
                                                              {getContentProductType(moduleFieldName, contentFieldName)
                                                                .slice(1)
                                                                .toLowerCase()}{' '}
                                                              content
                                                            </Text>
                                                          </Col>
                                                        ) : (
                                                          <>
                                                            <Col xs={14}>
                                                              <Text type="secondary" className={styles.textAlignCenter}>
                                                                Select content to add
                                                              </Text>
                                                            </Col>
                                                            <Col xs={3}>
                                                              <Tooltip title="Add Video Content">
                                                                <Button
                                                                  disabled={
                                                                    courseCurriculumType ===
                                                                    courseCurriculumTypes.LIVE.name
                                                                  }
                                                                  size="large"
                                                                  type="link"
                                                                  icon={<PlayCircleOutlined />}
                                                                  onClick={() => openVideoPopup(addMoreContent)}
                                                                />
                                                              </Tooltip>
                                                            </Col>
                                                            <Col xs={3}>
                                                              <Tooltip title="Add Session Content">
                                                                <Button
                                                                  disabled={
                                                                    courseCurriculumType ===
                                                                    courseCurriculumTypes.VIDEO.name
                                                                  }
                                                                  size="large"
                                                                  type="link"
                                                                  icon={<VideoCameraAddOutlined />}
                                                                  onClick={() => openSessionPopup(addMoreContent)}
                                                                />
                                                              </Tooltip>
                                                            </Col>
                                                          </>
                                                        )}
                                                        <Col xs={3}>
                                                          <Tooltip title="Remove content">
                                                            <Button
                                                              size="large"
                                                              type="link"
                                                              icon={<MinusCircleTwoTone twoToneColor="#FF0000" />}
                                                              onClick={() => removeContent(contentFieldName)}
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
                        <Col xs={24} md={8} lg={6}>
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
              {/* CTA Button */}
              <Col xs={24}>
                <Row justify="center">
                  <Col>
                    <Button size="large" type="primary" htmlType="submit" loading={submitting}>
                      Update Course Curriculum
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Form>
        </Loader>
      </div>
    </>
  );
};

export default CourseModulesForm;
