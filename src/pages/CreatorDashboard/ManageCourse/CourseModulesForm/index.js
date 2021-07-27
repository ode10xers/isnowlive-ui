import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import moment from 'moment';

import {
  Row,
  Col,
  Spin,
  Button,
  Form,
  Typography,
  Modal,
  Collapse,
  Tooltip,
  Input,
  InputNumber,
  PageHeader,
  Radio,
  DatePicker,
  Space,
  message,
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
import { showErrorModal, showSuccessModal, resetBodyStyle } from 'components/Modals/modals';

import SessionContentPopup from '../SessionContentPopup';
import VideoContentPopup from '../VideoContentPopup';

import dateUtil from 'utils/date';
import validationRules from 'utils/validation';
import { isAPISuccess, deepCloneObject, videoSourceType, preventDefaults } from 'utils/helper';

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

const defaultModuleValue = {
  name: 'Enter your course module name example - Introduction to Hatha Yoga',
  module_content: [
    {
      name: 'Select your first live session or video by clicking on the buttons on the right',
      product_type: '',
      product_id: '',
    },
  ],
};

const formInitialValues = {
  modules: [defaultModuleValue],
  curriculumType: courseCurriculumTypes.VIDEO.name,
  maxParticipants: 1,
  validity: 1,
  courseStartDate: null,
  courseEndDate: null,
};

const { Panel } = Collapse;
const { Text, Paragraph } = Typography;

const {
  formatDate: { toLocaleTime, toLongDateWithDay },
  timeCalculation: { dateIsBeforeDate, isBeforeDate },
} = dateUtil;

const CourseContentDetails = ({ productId, productType }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [productData, setProductData] = useState(null);

  const fetchInventoryDetails = useCallback(async (inventoryExternalId) => {
    try {
      const { status, data } = await apis.session.getInventoryDetailsByExternalId(inventoryExternalId);

      if (isAPISuccess(status) && data) {
        setProductData(data);
      }
    } catch (error) {
      setProductData(null);
      console.error(`Failed fetching inventory details for ${inventoryExternalId}`);
      console.error(error);
    }

    setIsLoading(false);
  }, []);

  const fetchVideoDetails = useCallback(async (videoId) => {
    try {
      const { status, data } = await apis.videos.getVideoById(videoId);

      if (isAPISuccess(status) && data) {
        setProductData(data);
      }
    } catch (error) {
      setProductData(null);
      console.error(`Failed fetching video details for ${videoId}`);
      console.error(error);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (productId && productType) {
      switch (productType) {
        case 'SESSION':
          fetchInventoryDetails(productId);
          break;
        case 'VIDEO':
          fetchVideoDetails(productId);
          break;
        default:
          setIsLoading(false);
          break;
      }
    }
  }, [fetchInventoryDetails, fetchVideoDetails, productId, productType]);

  const renderSessionDetails = (session) =>
    isBeforeDate(session.end_time) ? (
      <Space direction="horizontal" align="middle">
        <Text> {toLongDateWithDay(session.start_time)} </Text>
        <Text>
          {toLocaleTime(session.start_time)} - {toLocaleTime(session.end_time)}
        </Text>
      </Space>
    ) : (
      <Tooltip title="This session's date has already passed">
        <Text type="secondary">Past session</Text>
      </Tooltip>
    );

  const renderVideoDetails = (video) =>
    video.source === videoSourceType.YOUTUBE ? (
      <Space direction="horizontal" align="middle">
        <Text> Video </Text>
      </Space>
    ) : (
      <Space direction="horizontal" align="middle">
        <Text> Video : {Math.floor((video?.duration ?? 0) / 60)} mins </Text>
      </Space>
    );

  return (
    <Spin spinning={isLoading}>
      {productData && productType ? (
        productType === 'SESSION' ? (
          renderSessionDetails(productData)
        ) : productType === 'VIDEO' ? (
          renderVideoDetails(productData)
        ) : null
      ) : (
        <Text type="danger"> Invalid product! </Text>
      )}
    </Spin>
  );
};

const CourseModulesForm = ({ match, history }) => {
  const [form] = Form.useForm();

  const courseId = match.params.course_id;

  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [videoPopupVisible, setVideoPopupVisible] = useState(false);
  const [sessionPopupVisible, setSessionPopupVisible] = useState(false);
  const [addVideoContentMethod, setAddVideoContentMethod] = useState(null);
  const [addSessionContentMethod, setAddSessionContentMethod] = useState(null);

  const [courseDetails, setCourseDetails] = useState(null);
  const [expandedModulesKeys, setExpandedModulesKeys] = useState([]);
  const [courseCurriculumType, setCourseCurriculumType] = useState(courseCurriculumTypes.MIXED.name);
  const [courseStartDate, setCourseStartDate] = useState(null);
  const [courseEndDate, setCourseEndDate] = useState(null);

  //#region Start of Helper functions

  const redirectToCourseSectionDashboard = useCallback(
    () => history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.courses),
    [history]
  );

  const isVideosOnlyCourse = () => courseCurriculumType && courseCurriculumType === courseCurriculumTypes.VIDEO.name;

  const getContentProductType = (moduleName, contentName) =>
    form.getFieldValue(['modules', moduleName, 'module_content', contentName, 'product_type']);

  //#endregion End of Helper functions

  //#region Start of API Calls

  // TODO : Very inefficient, should find a better way later
  const fetchContentDetails = useCallback(async (productId, productType) => {
    let productCallSuccessful = false;
    let targetAPI = null;

    if (productType.toUpperCase() === 'SESSION') {
      targetAPI = apis.session.getInventoryDetailsByExternalId;
    } else if (productType.toUpperCase() === 'VIDEO') {
      targetAPI = apis.videos.getVideoById;
    }

    if (targetAPI) {
      try {
        const { status } = await targetAPI(productId);

        if (isAPISuccess(status)) {
          productCallSuccessful = true;
        }
      } catch (error) {
        console.error(`Failed fetching product details for ${productType} with id ${productId}`);
        console.error(error);
      }
    }

    return productCallSuccessful;
  }, []);

  const fetchCourseDetails = useCallback(
    async (courseExternalId) => {
      setIsLoading(true);

      try {
        const { status, data } = await apis.courses.getCreatorCourseDetailsById(courseExternalId);

        if (isAPISuccess(status) && data) {
          setCourseDetails(data);

          form.setFieldsValue({
            modules: data?.modules ?? [defaultModuleValue],
            curriculumType: data?.type || courseCurriculumTypes.MIXED.name,
            courseStartDate: data?.start_date ? moment(data?.start_date) : null,
            courseEndDate: data?.end_date ? moment(data?.end_date) : null,
            maxParticipants: data?.max_participants || 1,
            validity: data?.validity ?? 1,
          });
          setCourseCurriculumType(data?.type || courseCurriculumTypes.MIXED.name);
          setCourseStartDate(data?.start_date ? moment(data?.start_date) : null);
          setCourseEndDate(data?.end_date ? moment(data?.end_date) : null);
          setExpandedModulesKeys(data?.modules?.length > 0 ? [0] : []);
        } else {
          form.resetFields();
          setCourseCurriculumType(courseCurriculumTypes.MIXED.name);
          setCourseStartDate(null);
          setCourseEndDate(null);
          setExpandedModulesKeys([]);
        }
      } catch (error) {
        console.error(error);
        showErrorModal('Failed fetching course details', error?.response?.data?.message || 'Something went wrong.');
      }

      setIsLoading(false);
    },
    [form]
  );

  //#endregion End of API Calls

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails(courseId);
    } else {
      showErrorModal('No Course Id Detected');
      redirectToCourseSectionDashboard();
    }
  }, [courseId, history, fetchCourseDetails, redirectToCourseSectionDashboard]);

  //#region Start of Form Logics

  //#region Start of Date Form Logics

  const handleStartDateChange = (date) => {
    setCourseStartDate(date);
    form.setFieldsValue({ ...form.getFieldsValue(), courseStartDate: date });

    if (!date || (courseEndDate && dateIsBeforeDate(courseEndDate, date))) {
      setCourseEndDate(null);
      showCourseDetailsChangedModal();
      form.setFieldsValue({ ...form.getFieldsValue(), courseEndDate: undefined });
    }
  };

  const disabledStartDates = (currentDate) => {
    return dateIsBeforeDate(currentDate, moment().startOf('day').subtract(1, 'second'));
  };

  const handleEndDateChange = (date) => {
    if (dateIsBeforeDate(courseStartDate, date)) {
      showCourseDetailsChangedModal();
      setCourseEndDate(date);

      form.setFieldsValue({ ...form.getFieldsValue(), courseEndDate: date });
    }
  };

  const disabledEndDates = (currentDate) => {
    return (
      dateIsBeforeDate(currentDate, moment().startOf('day')) ||
      dateIsBeforeDate(currentDate, moment(courseStartDate).add(1, 'day'))
    );
  };

  const handleChangeCourseDates = (startDate, endDate) => {
    setCourseStartDate(startDate);
    setCourseEndDate(endDate);
    form.setFieldsValue({ ...form.getFieldsValue(), courseStartDate: startDate, courseEndDate: endDate });
  };

  //#endregion End of Date Form Logics

  //#region Start of Validation Logics

  const getVideoContentIDsFromModules = (modules = []) => [
    ...new Set(
      modules.reduce(
        (acc, module) =>
          (acc = acc.concat(
            module.module_content
              .filter((content) => content.product_type?.toUpperCase() === 'VIDEO')
              .map((content) => content.product_id)
          )),
        []
      )
    ),
  ];

  const isVideoContentModified = (newModules) => {
    if (!courseDetails?.modules) {
      return false;
    }

    const prevVideoContents = getVideoContentIDsFromModules(courseDetails?.modules ?? []).sort();
    const newVideoContents = getVideoContentIDsFromModules(newModules).sort();

    return JSON.stringify(prevVideoContents) !== JSON.stringify(newVideoContents);
  };

  const showIssueDetectedModal = () =>
    showErrorModal(
      'Issue detected',
      <>
        <Paragraph>You have some empty curriculum item ( outlines ).</Paragraph>
        <Paragraph>Please either add content in them or remove them to update this course</Paragraph>
      </>
    );

  const isCourseContentMatchesCourseType = () => {
    const formValues = form.getFieldsValue();
    const moduleContents =
      formValues.modules?.reduce((acc, val) => (acc = [...acc, ...(val.module_content ?? [])]), []) ?? [];

    // NOTE : Special check, if all contents are empty then it's an outline
    // In this case, allow them to pass through without any checks
    if (moduleContents.every((content) => !content.product_type)) {
      return true;
    } else if (moduleContents.some((content) => !content.product_type)) {
      showIssueDetectedModal();
      return false;
    }

    if (
      courseCurriculumType === courseCurriculumTypes.VIDEO.name &&
      moduleContents.some((content) => content.product_type === 'SESSION')
    ) {
      showErrorModal('You have a session content in a Video Only session! Please review the curriculum');
      return false;
    } else if (
      courseCurriculumType === courseCurriculumTypes.LIVE.name &&
      moduleContents.some((content) => content.product_type === 'VIDEO')
    ) {
      showErrorModal('You have a video content in a Session Only session! Please review the curriculum');
      return false;
    } else if (
      courseCurriculumType === courseCurriculumTypes.MIXED.name &&
      !moduleContents.some((content) => content.product_type === 'SESSION')
    ) {
      // MIXED course needs at least 1 session
      showErrorModal('Mixed course requires at least 1 session added as content');
      return false;
    }

    return true;
  };

  const invalidProductDetected = async () => {
    const formValues = form.getFieldsValue();
    const moduleContents =
      formValues.modules?.reduce((acc, val) => (acc = [...acc, ...(val.module_content ?? [])]), []) ?? [];

    const validModuleContents = await Promise.all(
      moduleContents
        .filter((content) => content.product_id && content.product_type)
        .map(async (content) => await fetchContentDetails(content.product_id, content.product_type))
    );

    return validModuleContents.some((isValid) => !isValid);
  };

  const handleFinishFailed = ({ errorFields }) => {
    let errorModules = [];

    form.scrollToField(errorFields[0].name);
    errorFields.forEach((error) => {
      // We want to expand any module container which have errors
      if (error.name.includes('modules') && error.name.length >= 2) {
        errorModules.push(error.name[1]);
      }

      if (error.name.includes('module_content') && error.name.length === 3) {
        // Error for the module_content fields (probably empty)
        message.error({
          content: `Module ${error.name[1] + 1} : ${error.errors[0]}`,
          key: error.name.join('-') + '-error',
        });
      } else if (error.name.includes('module_content') && error.name.length > 3) {
        // Error for inside of module_content (at the content level)
        if (error.name.includes('product_id') || error.name.includes('product_type')) {
          const errorFieldKey = deepCloneObject(error.name)
            .slice(0, error.name.length - 1)
            .join('-');
          message.error({
            content: `Module ${error.name[1] + 1} Content ${error.name[3] + 1} : Please select a proper content type!`,
            key: `${errorFieldKey}-error`,
          });
        }
      }
    });

    setExpandedModulesKeys([...new Set([...expandedModulesKeys, ...errorModules])]);
  };

  //#endregion End of Validation Logics

  const handleCourseCurriculumTypeChange = (e) => {
    const curriculumType = e.target.value;
    showCourseDetailsChangedModal();
    setCourseCurriculumType(curriculumType);
  };

  const saveCourseCurriculum = async (payload, modalRef = null) => {
    setSubmitting(true);

    if (modalRef) {
      modalRef.destroy();
    }

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

  const handleFinish = async (values) => {
    if (!courseId || !courseDetails) {
      showErrorModal('Invalid course selected!');
      return;
    }

    if (!isCourseContentMatchesCourseType()) {
      return;
    }

    const isAnyInvalidProducts = await invalidProductDetected();

    if (isAnyInvalidProducts) {
      showIssueDetectedModal();
      return;
    }

    const modifiedFields = {
      modules: values.modules,
      type: courseCurriculumType ?? values.curriculumType ?? courseCurriculumTypes.MIXED.name,
      max_participants: values.maxParticipants || 1,
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

    if (isVideoContentModified(values.modules)) {
      const modalRef = Modal.confirm({
        centered: true,
        closable: true,
        maskClosable: false,
        title: 'Some items in this course have changed',
        width: 640,
        content: (
          <Row gutter={[8, 4]}>
            <Col xs={24}>
              <Paragraph>It seems you have added or removed some items in this course.</Paragraph>
            </Col>
            <Col xs={24}>
              <Paragraph>
                Would you like these changes to also reflect in the course orders already purchased by some attendees?
              </Paragraph>
            </Col>
            <Col xs={24}>
              <Row gutter={8} justify="end">
                <Col>
                  <Button
                    block
                    type="default"
                    onClick={() => saveCourseCurriculum({ ...payload, new_videos_to_orders: false }, modalRef)}
                  >
                    Don't change existing orders
                  </Button>
                </Col>
                <Col>
                  <Button
                    block
                    type="primary"
                    onClick={() => saveCourseCurriculum({ ...payload, new_videos_to_orders: true }, modalRef)}
                  >
                    Change existing orders
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        ),
        okButtonProps: { style: { display: 'none' } },
        cancelButtonProps: { style: { display: 'none' } },
      });
    } else {
      saveCourseCurriculum({ ...payload, new_videos_to_orders: false });
    }
  };

  const initializeAddContentFunction = (moduleIndex) => {
    // We return a function that will be set as a state
    // This function will accept the content data that will be added
    return (contentData) => {
      const previousFormValues = deepCloneObject(form.getFieldsValue());
      const targetModuleContents = previousFormValues.modules[moduleIndex].module_content;

      // Check if the same product is already there, if so then skip
      // currently the duplicate check is only in the content scope
      const duplicateContentInstance = targetModuleContents.find(
        (moduleContent) =>
          moduleContent.product_type === contentData.product_type && moduleContent.product_id === contentData.product_id
      );

      if (duplicateContentInstance) {
        message.warning({
          content: 'Duplicate content will be skipped',
          key: 'duplicate_content_message',
        });
        return;
      }

      // Check if there's an empty content to replace with
      const targetContentIndex = targetModuleContents.findIndex(
        (moduleContent) => moduleContent.product_type !== 'SESSION' && moduleContent.product_type !== 'VIDEO'
      );

      if (targetContentIndex >= 0) {
        targetModuleContents.splice(targetContentIndex, 1, contentData);
      } else {
        targetModuleContents.push(contentData);
      }

      previousFormValues.modules[moduleIndex].module_content = targetModuleContents;
      form.setFieldsValue({
        ...form.getFieldsValue(),
        modules: previousFormValues.modules,
      });

      message.success({
        content: `${contentData.product_type[0]}${contentData.product_type
          .slice(1)
          .toLowerCase()} successfully added to module!`,
        key: 'success_add_content_message',
      });
    };
  };

  //#endregion End of Form Logics

  //#region Start of UI Handlers

  const showCourseDetailsChangedModal = () => {
    Modal.warning({
      title: 'Course Date Changed',
      afterClose: resetBodyStyle,
      content: (
        <>
          <Paragraph>Note : Changing these details can affect the videos & sessions selected below.</Paragraph>
          <Paragraph>
            Please review the curriculum below to remove or add sessions or videos after this change.
          </Paragraph>
        </>
      ),
      okText: 'Review Curriculum',
      onOk: () => {
        window.scrollTo(0, 320);
      },
    });
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    const formModules = deepCloneObject(form.getFieldsValue()).modules;
    const moduleIndex = draggableId.split('-')[1];
    const contentIndex = draggableId.split('-')[3];

    // NOTE: For modules, we use form names which are actually array indexes
    const targetModule = formModules[moduleIndex];
    const targetContent = targetModule.module_content[contentIndex];

    if (targetModule && targetContent && destination && destination.index !== source.index) {
      targetModule.module_content.splice(source.index, 1);
      targetModule.module_content.splice(destination.index, 0, targetContent);

      formModules[moduleIndex] = targetModule;

      form.setFieldsValue({
        ...form.getFieldsValue(),
        modules: formModules,
      });
    }
  };

  const openSessionPopup = (moduleIndex) => {
    const addContentFunction = initializeAddContentFunction(moduleIndex);
    setAddSessionContentMethod(() => addContentFunction);
    setSessionPopupVisible(true);
  };

  const closeSessionPopup = () => {
    setSessionPopupVisible(false);
  };

  const openVideoPopup = (moduleIndex) => {
    const addContentFunction = initializeAddContentFunction(moduleIndex);
    setAddVideoContentMethod(() => addContentFunction);
    setVideoPopupVisible(true);
  };

  const closeVideoPopup = () => {
    setVideoPopupVisible(false);
  };

  //#endregion End of UI Handlers

  const renderContentDetails = (moduleName, contentName) => {
    const contentData = form.getFieldValue(['modules', moduleName, 'module_content', contentName]);

    return <CourseContentDetails productType={contentData.product_type} productId={contentData.product_id} />;
  };

  return (
    <>
      <SessionContentPopup
        visible={sessionPopupVisible}
        closeModal={closeSessionPopup}
        addContentMethod={addSessionContentMethod}
        courseStartDate={courseStartDate}
        courseEndDate={courseEndDate}
        changeCourseDates={handleChangeCourseDates}
      />
      <VideoContentPopup
        visible={videoPopupVisible}
        closeModal={closeVideoPopup}
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
                  onBack={() =>
                    history.push(
                      Routes.creatorDashboard.rootPath +
                        Routes.creatorDashboard.courses +
                        (courseId ? `/${courseId}/edit` : '')
                    )
                  }
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
                      <Row gutter={8} align="middle">
                        <Col>
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
                        <Col>-</Col>
                        <Col>
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
                          <DragDropContext onDragEnd={handleDragEnd}>
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
                                    key={moduleFieldName}
                                    extra={
                                      <Tooltip title="Remove this module" style={{ width: 'fit-content' }}>
                                        <DeleteOutlined
                                          className={styles.deleteModuleIconButton}
                                          onClick={() => {
                                            setExpandedModulesKeys((prevKeys) =>
                                              prevKeys.filter((val) => val !== moduleFieldName)
                                            );
                                            removeModule(moduleFieldName);
                                          }}
                                        />
                                      </Tooltip>
                                    }
                                    header={
                                      <Form.Item
                                        {...moduleFormItemRestFields}
                                        id="module_name"
                                        name={[moduleFieldName, 'name']}
                                        fieldKey={[moduleFieldKey, 'name']}
                                        className={styles.panelHeaderFormItem}
                                        rules={validationRules.requiredValidation}
                                      >
                                        <Input
                                          placeholder="Module name"
                                          maxLength={50}
                                          className={styles.panelHeaderFormInput}
                                          onClick={preventDefaults}
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
                                          {(contentFields, { add: addMoreContent, remove: removeContent }) => (
                                            <Row gutter={[8, 8]}>
                                              <Col xs={24}>
                                                <Droppable
                                                  droppableId={`module-${moduleFieldName}-content`}
                                                  type={`module-${moduleFieldName}-content`}
                                                >
                                                  {(contentDroppableProvided) => (
                                                    <div
                                                      {...contentDroppableProvided}
                                                      ref={contentDroppableProvided.innerRef}
                                                    >
                                                      {contentFields.map(
                                                        ({
                                                          key: contentKey,
                                                          name: contentFieldName,
                                                          fieldKey: contentFieldKey,
                                                          ...contentFormItemRestFields
                                                        }) => (
                                                          <Draggable
                                                            draggableId={`module-${moduleFieldName}-content-${contentFieldName}`}
                                                            index={contentFieldName}
                                                            key={`module-${moduleFieldName}-content-${contentFieldName}`}
                                                          >
                                                            {(contentDraggableProvided) => (
                                                              <Row
                                                                {...contentDraggableProvided.draggableProps}
                                                                ref={contentDraggableProvided.innerRef}
                                                                className={styles.contentListItem}
                                                                align="middle"
                                                                wrap={false}
                                                              >
                                                                <Col flex="30px">
                                                                  <div
                                                                    className={styles.contentDragHandle}
                                                                    {...contentDraggableProvided.dragHandleProps}
                                                                  />
                                                                </Col>
                                                                <Col flex="auto">
                                                                  <Row
                                                                    key={contentKey}
                                                                    gutter={[10, 10]}
                                                                    align="middle"
                                                                  >
                                                                    <Col xs={10}>
                                                                      <Form.Item
                                                                        {...contentFormItemRestFields}
                                                                        id="content_name"
                                                                        name={[contentFieldName, 'name']}
                                                                        fieldKey={[contentFieldKey, 'name']}
                                                                        className={styles.inlineFormItem}
                                                                        rules={validationRules.requiredValidation}
                                                                      >
                                                                        <Input
                                                                          placeholder="Content name"
                                                                          maxLength={50}
                                                                        />
                                                                      </Form.Item>
                                                                      <Form.Item
                                                                        hidden={true}
                                                                        id="content_id"
                                                                        name={[contentFieldName, 'product_id']}
                                                                        fieldKey={[contentFieldKey, 'product_id']}
                                                                      >
                                                                        <Input
                                                                          placeholder="Content ID"
                                                                          maxLength={50}
                                                                        />
                                                                      </Form.Item>
                                                                      <Form.Item
                                                                        hidden={true}
                                                                        id="content_type"
                                                                        name={[contentFieldName, 'product_type']}
                                                                        fieldKey={[contentFieldKey, 'product_type']}
                                                                      >
                                                                        <Input
                                                                          placeholder="Content Type"
                                                                          maxLength={50}
                                                                        />
                                                                      </Form.Item>
                                                                    </Col>
                                                                    <Col xs={14}>
                                                                      <Row
                                                                        gutter={[10, 10]}
                                                                        justify="end"
                                                                        align="middle"
                                                                      >
                                                                        {getContentProductType(
                                                                          moduleFieldName,
                                                                          contentFieldName
                                                                        ) ? (
                                                                          <Col
                                                                            xs={12}
                                                                            className={styles.textAlignRight}
                                                                          >
                                                                            {renderContentDetails(
                                                                              moduleFieldName,
                                                                              contentFieldName
                                                                            )}
                                                                          </Col>
                                                                        ) : (
                                                                          <>
                                                                            <Col
                                                                              xs={14}
                                                                              className={styles.textAlignRight}
                                                                            >
                                                                              <Text
                                                                                type="danger"
                                                                                className={styles.textAlignCenter}
                                                                              >
                                                                                Select content to add
                                                                              </Text>
                                                                            </Col>
                                                                            <Col
                                                                              xs={3}
                                                                              className={styles.textAlignCenter}
                                                                            >
                                                                              <Tooltip
                                                                                title={
                                                                                  courseCurriculumType ===
                                                                                  courseCurriculumTypes.LIVE.name
                                                                                    ? `You can't add a video to a live session course`
                                                                                    : 'Add Video Content'
                                                                                }
                                                                              >
                                                                                <Button
                                                                                  block
                                                                                  disabled={
                                                                                    courseCurriculumType ===
                                                                                    courseCurriculumTypes.LIVE.name
                                                                                  }
                                                                                  size="large"
                                                                                  type="link"
                                                                                  icon={<PlayCircleOutlined />}
                                                                                  onClick={() =>
                                                                                    openVideoPopup(moduleFieldName)
                                                                                  }
                                                                                />
                                                                              </Tooltip>
                                                                            </Col>
                                                                            <Col
                                                                              xs={3}
                                                                              className={styles.textAlignCenter}
                                                                            >
                                                                              <Tooltip
                                                                                title={
                                                                                  courseCurriculumType ===
                                                                                  courseCurriculumTypes.VIDEO.name
                                                                                    ? `You can't add a session to a video course`
                                                                                    : !courseStartDate || !courseEndDate
                                                                                    ? 'Please pick the course dates first'
                                                                                    : 'Add Session Content'
                                                                                }
                                                                              >
                                                                                <Button
                                                                                  block
                                                                                  disabled={
                                                                                    courseCurriculumType ===
                                                                                      courseCurriculumTypes.VIDEO
                                                                                        .name ||
                                                                                    !courseStartDate ||
                                                                                    !courseEndDate
                                                                                  }
                                                                                  size="large"
                                                                                  type="link"
                                                                                  icon={<VideoCameraAddOutlined />}
                                                                                  onClick={() =>
                                                                                    openSessionPopup(moduleFieldName)
                                                                                  }
                                                                                />
                                                                              </Tooltip>
                                                                            </Col>
                                                                          </>
                                                                        )}
                                                                        <Col xs={3} className={styles.textAlignCenter}>
                                                                          <Tooltip title="Remove content">
                                                                            <Button
                                                                              size="large"
                                                                              type="link"
                                                                              icon={
                                                                                <MinusCircleTwoTone twoToneColor="#FF0000" />
                                                                              }
                                                                              onClick={() =>
                                                                                removeContent(contentFieldName)
                                                                              }
                                                                            />
                                                                          </Tooltip>
                                                                        </Col>
                                                                      </Row>
                                                                    </Col>
                                                                  </Row>
                                                                </Col>
                                                              </Row>
                                                            )}
                                                          </Draggable>
                                                        )
                                                      )}
                                                      {contentDroppableProvided.placeholder}
                                                    </div>
                                                  )}
                                                </Droppable>
                                              </Col>
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
                          </DragDropContext>
                        </Col>
                        <Col xs={24} md={8} lg={6}>
                          <Button
                            ghost
                            size="large"
                            type="primary"
                            onClick={() => {
                              // NOTE : Since the new one will be added at the last place
                              // We ad the length of current array to the expanded keys
                              setExpandedModulesKeys((prevKeys) => [...new Set([...prevKeys, moduleFields.length])]);
                              addMoreModule();
                            }}
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
