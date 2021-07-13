import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import classNames from 'classnames';
import moment from 'moment';
import { PlusOutlined } from '@ant-design/icons';
import { Row, Col, Button, Form, Input, InputNumber, Select, Typography, Modal, Radio } from 'antd';

import { TagOutlined, InfoCircleOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';
import Loader from 'components/Loader';
import ImageUpload from 'components/ImageUpload';
import { showErrorModal, showSuccessModal, showTagOptionsHelperModal } from 'components/Modals/modals';

// import dateUtil from 'utils/date';
import validationRules from 'utils/validation';
import { isAPISuccess, generateRandomColor } from 'utils/helper';
import { fetchCreatorCurrency } from 'utils/payment';

import { courseCreatePageLayout, courseModalTailLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';

const coursePriceTypes = {
  FREE: {
    name: 'FREE',
    label: 'Free',
  },
  PAID: {
    name: 'PAID',
    label: 'Paid',
  },
};

const { TextArea } = Input;
const initialColor = generateRandomColor();

const whiteColor = '#ffffff';

const formInitialValues = {
  courseName: '',
  price: 10,
  courseTagType: 'anyone',
  videoList: [],
  selectedMemberTags: [],
  colorCode: initialColor,
  faqs: [
    {
      question: '',
      answer: '',
    },
  ],
  topic: [
    {
      heading: '',
      description: '',
    },
  ],
};

const { Text, Title } = Typography;

// const {
//   formatDate: { toLocaleDate },
// } = dateUtil;

const Course = ({ visible, closeModal, editedCourse = null, isVideoModal = false, creatorMemberTags = [] }) => {
  const [form] = Form.useForm();
  const history = useHistory();

  const [courseClasses, setCourseClasses] = useState([]);
  const [currency, setCurrency] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCourseClass, setSelectedCourseClass] = useState([]);
  // const [courseStartDate, setCourseStartDate] = useState(null);
  // const [courseEndDate, setCourseEndDate] = useState(null);
  const [courseImageUrl, setCourseImageUrl] = useState(null);
  // const [highestMaxParticipantCourseSession, setHighestMaxParticipantCourseSession] = useState(null);
  // const [isSequentialVideos, setIsSequentialVideos] = useState(false);
  const [selectedTagType, setSelectedTagType] = useState('anyone');

  const fetchAllCourseClassForCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.session.getSession();

      if (isAPISuccess(status) && data) {
        setCourseClasses(data.filter((session) => session.inventory.length > 0));
      }
    } catch (error) {
      showErrorModal('Failed to fetch course classes', error?.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  }, []);

  const getCreatorCurrencyDetails = useCallback(async () => {
    setIsLoading(true);

    try {
      const creatorCurrency = await fetchCreatorCurrency();

      if (creatorCurrency) {
        setCurrency(creatorCurrency);
      } else {
        setCurrency('');
        form.setFieldsValue({ ...form.getFieldsValue(), price: 0 });
        Modal.confirm({
          title: `We need your bank account details to send you the earnings. Please add your bank account details and proceed with creating a paid pass`,
          okText: 'Setup payment account',
          cancelText: 'Keep it free',
          onOk: () => {
            history.push(`${Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount}`);
          },
        });
      }
    } catch (error) {
      showErrorModal(
        'Failed to fetch creator currency details',
        error?.response?.data?.message || 'Something went wrong'
      );
    }

    setIsLoading(false);
  }, [form, history]);

  const getSelectedCourseClasses = useCallback(
    (selectedClassIds = []) => {
      if (courseClasses?.length <= 0 || selectedClassIds?.length <= 0) {
        return [];
      }

      return courseClasses.filter((courseClass) => selectedClassIds.includes(courseClass.session_id));
    },
    [courseClasses]
  );

  useEffect(() => {
    if (true) {
      if (!isVideoModal) {
        fetchAllCourseClassForCreator();
      }

      if (editedCourse) {
        if (isVideoModal) {
          form.setFieldsValue({
            courseImageUrl: editedCourse?.course_image_url || '',
            courseName: editedCourse?.name,
            validity: editedCourse?.validity,
            // video_type: editedCourse?.course_sequence ? 'sequential' : 'non_sequential',
            videoList: editedCourse?.videos?.map((courseVideo) => courseVideo.external_id),
            price: editedCourse?.currency ? editedCourse?.price : 0,
            colorCode: editedCourse?.color_code || initialColor || whiteColor,
            courseTagType: editedCourse?.tag?.length > 0 ? 'selected' : 'anyone',
            selectedMemberTags: editedCourse?.tag?.map((tag) => tag.external_id) || [],
          });

          //setIsSequentialVideos(editedCourse.course_sequence || false);
          setSelectedTagType(editedCourse?.tag?.length > 0 ? 'selected' : 'anyone');
          setSelectedCourseClass([]);
          // setCourseEndDate(null);
          // setCourseStartDate(null);
        } else {
          form.setFieldsValue({
            courseImageUrl: editedCourse?.course_image_url || '',
            courseName: editedCourse?.name,
            courseStartDate: moment(editedCourse?.start_date),
            courseEndDate: moment(editedCourse?.end_date),
            selectedCourseClass: editedCourse?.sessions?.map((courseSession) => courseSession.session_id),
            maxParticipants: editedCourse?.max_participants,
            videoList: editedCourse?.videos?.map((courseVideo) => courseVideo.external_id),
            price: editedCourse?.currency ? editedCourse?.price : 0,
            colorCode: editedCourse?.color_code || initialColor || whiteColor,
            courseTagType: editedCourse?.tag?.length > 0 ? 'selected' : 'anyone',
            selectedMemberTags: editedCourse?.tag?.map((tag) => tag.external_id) || [],
          });

          setSelectedTagType(editedCourse?.tag?.length > 0 ? 'selected' : 'anyone');
          setSelectedCourseClass(editedCourse?.sessions?.map((courseSession) => courseSession.session_id));
          // setCourseStartDate(moment(editedCourse?.start_date));
          // setCourseEndDate(moment(editedCourse?.end_date));

          // setIsSequentialVideos(false);
        }

        setCurrency(editedCourse.currency?.toUpperCase() || '');
        setCourseImageUrl(editedCourse.course_image_url);
      } else {
        form.resetFields();
        setSelectedCourseClass([]);
        setCurrency('');
        // setCourseStartDate(null);
        // setCourseEndDate(null);
        setCourseImageUrl(null);
        // setHighestMaxParticipantCourseSession(null);
        setSelectedTagType('anyone');
        // setIsSequentialVideos(false);
      }

      getCreatorCurrencyDetails();
    }
  }, [visible, editedCourse, isVideoModal, fetchAllCourseClassForCreator, getCreatorCurrencyDetails, form]);

  useEffect(() => {
    if (!editedCourse || editedCourse?.max_participants === 0) {
      // let highestMaxParticipantCourseSession = null;
      let highestMaxParticipantCount = 0;

      if (selectedCourseClass?.length > 0) {
        // const courseSessionsList = getSelectedCourseClasses(selectedCourseClass).filter(
        //   (selectedClass) => selectedClass.is_course
        // );
        // if (courseSessionsList.length > 0) {
        //   courseSessionsList.forEach((courseSession) => {
        //     if (courseSession.max_participants > highestMaxParticipantCount) {
        //       highestMaxParticipantCount = courseSession.max_participants;
        //       highestMaxParticipantCourseSession = courseSession;
        //     }
        //   });
        // }
      }

      // setHighestMaxParticipantCourseSession(highestMaxParticipantCourseSession);
      form.setFieldsValue({ ...form.getFieldsValue(), maxParticipants: highestMaxParticipantCount });
    } else {
      // setHighestMaxParticipantCourseSession(editedCourse.max_participants);
      form.setFieldsValue({ ...form.getFieldsValue(), maxParticipants: editedCourse.max_participants });
    }
  }, [selectedCourseClass, getSelectedCourseClasses, editedCourse, form]);

  const handleCourseImageUpload = (imageUrl) => {
    setCourseImageUrl(imageUrl);
    form.setFieldsValue({ ...form.getFieldValue(), courseImageUrl: imageUrl });
  };

  const handleCourseTagTypeChange = (e) => {
    if (creatorMemberTags.length > 0) {
      setSelectedTagType(e.target.value);
    } else {
      setSelectedTagType('anyone');
      form.setFieldsValue({ ...form.getFieldsValue(), courseTagType: 'anyone' });
      Modal.confirm({
        title: `You currently don't have any member tags. You need to create tags to limit access to this product.`,
        okText: 'Setup Member Tags',
        cancelText: 'Cancel',
        onOk: () => {
          const newWindow = window.open(`${Routes.creatorDashboard.rootPath + Routes.creatorDashboard.membersTags}`);
          newWindow.blur();
          window.focus();
        },
      });
    }
  };

  const saveChangesToCourse = async (payload, modalRef = null) => {
    setSubmitting(true);

    if (modalRef) {
      modalRef.destroy();
    }

    try {
      const response = editedCourse
        ? await apis.courses.updateCourse(editedCourse.id, payload)
        : await apis.courses.createCourse(payload);

      if (isAPISuccess(response.status)) {
        showSuccessModal(`${payload.name} successfully ${editedCourse ? 'updated' : 'created'}`);
        closeModal(true);
      }
    } catch (error) {
      showErrorModal(
        `Failed to ${editedCourse ? 'update' : 'create'} course`,
        error?.response?.data?.message || 'Something went wrong.'
      );
    }

    setSubmitting(false);
  };

  const setFreeVideo = () => {
    form.setFieldsValue({
      ...form.getFieldsValue(),
      priceType: coursePriceTypes.FREE.name,
      price: 0,
    });
  };

  const handleChangeLimitType = (e) => {
    const priceType = e.target.value;

    if (priceType === coursePriceTypes.FREE.name) {
      setFreeVideo();
    } else {
      if (currency) {
        const values = form.getFieldsValue();
        form.setFieldsValue({
          ...values,
          priceType: priceType,
          price: priceType === coursePriceTypes.FREE.name ? 0 : values.price || 10,
        });
      } else {
        Modal.confirm({
          title: `We need your bank account details to send you the earnings. Please add your bank account details and proceed with creating a paid session`,
          okText: 'Setup payment account',
          cancelText: 'Keep it free',
          onCancel: () => setFreeVideo(),
          onOk: () => {
            setFreeVideo();
            const newWindow = window.open(
              `${Routes.creatorDashboard.rootPath}${Routes.creatorDashboard.paymentAccount}`
            );
            newWindow.blur();
            window.focus();
          },
        });
      }
    }
  };

  const handleFinish = async (values) => {
    setSubmitting(true);
    let payload = {};

    payload = {
      name: values.courseName,
      course_image_url: courseImageUrl || values.courseImageUrl,
      summary: values.summary,
      description: values.description,
      topic: values.topic,
      color_code: '',
      type: 'MIXED',
      max_participants: '20',
      start_date: '',
      end_date: '',
      faqs: values.faqs,
      price: currency ? values.price ?? 1 : 0,
      currency: currency?.toLowerCase() || '',
    };

    saveChangesToCourse(payload);

    setSubmitting(false);
  };

  const gotoModulePage = () => {
    history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.createCourseModule);
  };

  return (
    <Loader size="large" loading={isLoading}>
      <Form
        layout="horizontal"
        name="CourseForm"
        form={form}
        onFinish={handleFinish}
        initialValues={formInitialValues}
        scrollToFirstError={true}
      >
        <div className={styles.box}>
          <Row className={styles.courseRow} gutter={[8, 16]}>
            <Col xs={24}>
              <Title level={4}>1. Course Information</Title>
            </Col>
            <Col xs={16}>
              <Form.Item
                id="courseImageUrl"
                name="courseImageUrl"
                rules={validationRules.requiredValidation}
                wrapperCol={{ span: 24 }}
              >
                <div className={styles.imageWrapper}>
                  <ImageUpload
                    className={classNames('avatar-uploader', styles.coverImage)}
                    name="courseImageUrl"
                    action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                    onChange={handleCourseImageUpload}
                    value={courseImageUrl}
                    label="Course Image (size of Facebook Cover Image)"
                    overlayHelpText="Click to change image (size of Facebook Cover Image)"
                  />
                </div>
              </Form.Item>
            </Col>
            <Col xs={16}>
              <Form.Item
                {...courseCreatePageLayout}
                id="courseName"
                name="courseName"
                label="Course Name"
                rules={validationRules.nameValidation}
              >
                <Input placeholder="Enter Course Name" maxLength={50} />
              </Form.Item>
            </Col>
            <Col xs={16}>
              <Form.Item
                {...courseCreatePageLayout}
                className={classNames(styles.bgWhite, styles.textEditorLayout)}
                label={<Text> Course Description </Text>}
                name="description"
                id="description"
                rules={validationRules.requiredValidation}
              >
                <div>
                  <TextArea rows={5} />
                </div>
              </Form.Item>
            </Col>
            <Col xs={16}>
              <Form.Item
                {...courseCreatePageLayout}
                className={classNames(styles.bgWhite, styles.textEditorLayout)}
                label={<Text> What will Students Learn </Text>}
                name="summary"
                id="summary"
                rules={validationRules.requiredValidation}
              >
                <div>
                  <TextArea rows={5} />
                </div>
              </Form.Item>
            </Col>
          </Row>
        </div>
        <div className={styles.box}>
          <Row className={styles.courseRow} gutter={[8, 16]}>
            <Col xs={24}>
              <Title level={3}>1.5. Who is this course for</Title>
            </Col>
            <Col xs={16}>
              <Form.List name="topic">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, fieldKey, ...restField }) => (
                      <Row key={key}>
                        <Col xs={24}>
                          <Form.Item
                            {...restField}
                            name={[name, 'heading']}
                            {...courseCreatePageLayout}
                            fieldKey={[fieldKey, 'first']}
                            rules={[{ required: true, message: 'Missing heading' }]}
                            id="heading"
                            label="Heading"
                          >
                            <Input placeholder="Enter heading" maxLength={50} />
                          </Form.Item>
                        </Col>
                        <Col xs={24}>
                          <Form.Item
                            {...restField}
                            name={[name, 'description']}
                            {...courseCreatePageLayout}
                            fieldKey={[fieldKey, 'first']}
                            rules={[{ required: true, message: 'Missing description' }]}
                            id="description"
                            label="Description"
                          >
                            <TextArea rows={5} placeholder="Enter Description" />
                          </Form.Item>
                        </Col>
                        <Col span={16} offset={8}>
                          <Form.Item>
                            <Button type="danger" onClick={() => remove(name)}>
                              Remove
                            </Button>
                          </Form.Item>
                        </Col>
                      </Row>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add New Who is this course for
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Col>
          </Row>
        </div>

        <div className={styles.box}>
          <Row className={styles.courseRow} gutter={[8, 16]}>
            <Col xs={24}>
              <Title level={3}>2. Frequently Asked Questions</Title>
            </Col>
            <Col xs={16}>
              <Form.List name="faqs">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, fieldKey, ...restField }) => (
                      <Row key={key}>
                        <Col xs={24}>
                          <Form.Item
                            {...restField}
                            name={[name, 'question']}
                            {...courseCreatePageLayout}
                            fieldKey={[fieldKey, 'first']}
                            rules={[{ required: true, message: 'Missing Question' }]}
                            id="question"
                            label="FAQ QUESTION"
                          >
                            <Input placeholder="Enter Question" maxLength={50} />
                          </Form.Item>
                        </Col>
                        <Col xs={24}>
                          <Form.Item
                            {...restField}
                            name={[name, 'answer']}
                            {...courseCreatePageLayout}
                            fieldKey={[fieldKey, 'first']}
                            rules={[{ required: true, message: 'Missing Answer' }]}
                            id="answer"
                            label="FAQ ANSWER"
                          >
                            <Input placeholder="Enter Answer" maxLength={50} />
                          </Form.Item>
                        </Col>
                        <Col span={16} offset={8}>
                          <Form.Item>
                            <Button type="danger" onClick={() => remove(name)}>
                              Remove
                            </Button>
                          </Form.Item>
                        </Col>
                      </Row>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add New FAQ
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Col>
          </Row>
        </div>
        <div className={styles.box}>
          <Row className={styles.courseRow} gutter={[8, 16]}>
            <Col xs={24}>
              <Title level={4}>3. Pricing and details</Title>
            </Col>
            <Col xs={16}>
              <Row gutter={8}>
                <Col xs={24}>
                  <Form.Item
                    id="priceType"
                    name="priceType"
                    label="Price Type"
                    rules={validationRules.requiredValidation}
                    onChange={handleChangeLimitType}
                  >
                    <Radio.Group
                      options={Object.values(coursePriceTypes).map((pType) => ({
                        label: pType.label,
                        value: pType.name,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={20}>
                  <Form.Item id="price" name="price" label={`Price (${currency.toUpperCase()})`}>
                    <InputNumber
                      min={0}
                      disabled={currency === ''}
                      placeholder="Price"
                      className={styles.numericInput}
                    />
                  </Form.Item>
                </Col>
                <Col xs={4} className={styles.textAlignCenter}>
                  <Text strong className={styles.currencyWrapper}>
                    {currency?.toUpperCase() || ''}
                  </Text>
                </Col>
              </Row>
            </Col>
            <Col xs={16}>
              <Form.Item label="Bookable by member with Tag" required {...courseCreatePageLayout}>
                <Form.Item
                  name="courseTagType"
                  rules={validationRules.requiredValidation}
                  onChange={handleCourseTagTypeChange}
                  className={styles.inlineFormItem}
                >
                  <Radio.Group>
                    <Radio value="anyone"> Anyone </Radio>
                    <Radio value="selected"> Selected Member Tags </Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item className={styles.inlineFormItem}>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => showTagOptionsHelperModal('course')}
                    icon={<InfoCircleOutlined />}
                  >
                    Understanding the options
                  </Button>
                </Form.Item>
              </Form.Item>

              <Form.Item
                name="selectedMemberTags"
                id="selectedMemberTags"
                {...courseModalTailLayout}
                hidden={selectedTagType === 'anyone' || creatorMemberTags.length === 0}
              >
                <Select
                  showArrow
                  mode="multiple"
                  maxTagCount={2}
                  placeholder="Select a member tag"
                  disabled={selectedTagType === 'anyone'}
                  options={creatorMemberTags.map((tag) => ({
                    label: (
                      <>
                        {' '}
                        {tag.name} {tag.is_default ? <TagOutlined /> : null}{' '}
                      </>
                    ),
                    value: tag.external_id,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Row justify="end" align="center" gutter={8} className={styles.modalActionRow}>
          <Col xs={12} md={6}>
            <Button block type="default" onClick={() => gotoModulePage()} loading={submitting}>
              Add Modules
            </Button>
          </Col>
          <Col xs={12} md={8}>
            <Button block type="primary" htmlType="submit" loading={submitting}>
              Create Course
            </Button>
          </Col>
        </Row>
      </Form>
    </Loader>
  );
};

export default Course;
