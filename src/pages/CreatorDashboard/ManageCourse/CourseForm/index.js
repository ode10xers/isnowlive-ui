import React, { useState, useEffect, useCallback } from 'react';
import { generatePath } from 'react-router';
import classNames from 'classnames';
import moment from 'moment';

import {
  Row,
  Col,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  Tooltip,
  Modal,
  Radio,
  PageHeader,
  Image,
  message,
} from 'antd';
import { TagOutlined, InfoCircleOutlined, PlusOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Loader from 'components/Loader';
import ImageUpload from 'components/ImageUpload';
import TextEditor from 'components/TextEditor';
import PriceInputCalculator from 'components/PriceInputCalculator';
import {
  showErrorModal,
  showSuccessModal,
  showTagOptionsHelperModal,
  showWaitlistHelperModal,
} from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import validationRules from 'utils/validation';
import { fetchCreatorCurrency } from 'utils/payment';
import { defaultPlatformFeePercentage } from 'utils/constants';

import { courseCreatePageLayout, coursePageTailLayout } from 'layouts/FormLayouts';

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

const formInitialValues = {
  courseImageUrl: '',
  courseName: '',
  description: '',
  summary: '',
  topic: [],
  faqs: [],
  priceType: coursePriceTypes.FREE.name,
  waitlist: false,
  price: 10,
  courseTagType: 'anyone',
  selectedMemberTags: [],
};

const { Title, Text } = Typography;
// const { TextArea } = Input;

const CourseForm = ({ match, history }) => {
  const [form] = Form.useForm();

  const courseId = match.params.course_id;

  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currency, setCurrency] = useState('');
  const [courseImageUrl, setCourseImageUrl] = useState(null);
  const [previewImageUrls, setPreviewImageUrls] = useState([]);
  const [selectedTagType, setSelectedTagType] = useState('anyone');
  const [coursePriceType, setCoursePriceType] = useState(coursePriceTypes.FREE.name);

  const [courseDetails, setCourseDetails] = useState(null);
  const [creatorMemberTags, setCreatorMemberTags] = useState([]);
  const [creatorAbsorbsFees, setCreatorAbsorbsFees] = useState(true);
  const [creatorFeePercentage, setCreatorFeePercentage] = useState(defaultPlatformFeePercentage);

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
  }, [form, history]);

  const fetchCreatorSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.user.getCreatorSettings();

      if (isAPISuccess(status) && data) {
        setCreatorMemberTags(data.tags ?? []);
        setCreatorAbsorbsFees(data.creator_owns_fee ?? true);
        setCreatorFeePercentage(data.platform_fee_percentage ?? defaultPlatformFeePercentage);
      }
    } catch (error) {
      showErrorModal('Failed to fetch creator tags', error?.response?.data?.message || 'Something went wrong.');
    }
  }, []);

  const fetchCourseDetails = useCallback(
    async (courseExternalId) => {
      setIsLoading(true);

      try {
        const { status, data } = await apis.courses.getCreatorCourseDetailsById(courseExternalId);

        if (isAPISuccess(status) && data) {
          setCourseDetails(data);
          form.setFieldsValue({
            courseImageUrl: data.course_image_url,
            courseName: data.name,
            description: data.description,
            summary: data.summary,
            topic: data.topic,
            faqs: data.faqs,
            priceType: data.price === 0 ? coursePriceTypes.FREE.name : coursePriceTypes.PAID.name,
            price: data.price,
            courseTagType: data.tag?.length > 0 ? 'selected' : 'anyone',
            selectedMemberTags: data.tag?.map((tagData) => tagData.external_id),
            preview_video_urls: data.preview_video_urls ?? [],
            waitlist: data.waitlist ?? false,
          });

          if (data.currency) {
            setCurrency(data.currency);
          }

          setCourseImageUrl(data.course_image_url);
          setPreviewImageUrls(data.preview_image_url);
          setSelectedTagType(data.tag?.length > 0 ? 'selected' : 'anyone');
          setCoursePriceType(data.price === 0 ? coursePriceTypes.FREE.name : coursePriceTypes.PAID.name);
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
    fetchCreatorSettings();
    getCreatorCurrencyDetails();

    if (courseId) {
      fetchCourseDetails(courseId);
    } else {
      setIsLoading(false);
    }
  }, [fetchCreatorSettings, getCreatorCurrencyDetails, fetchCourseDetails, courseId]);

  const handleAddPreviewImageUrl = (newPreviewImageUrl) => {
    setPreviewImageUrls((imageUrls) => [...imageUrls, newPreviewImageUrl]);
  };

  const removePreviewImageUrl = (targetImageUrl) => {
    setPreviewImageUrls(previewImageUrls.filter((imageUrl) => imageUrl !== targetImageUrl));
  };

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

  const setFreeCourse = () => {
    form.setFieldsValue({
      ...form.getFieldsValue(),
      priceType: coursePriceTypes.FREE.name,
      price: 0,
    });
    setCoursePriceType(coursePriceTypes.FREE.name);
  };

  const handleCoursePriceTypeChange = (e) => {
    const priceType = e.target.value;

    if (priceType === coursePriceTypes.FREE.name) {
      setFreeCourse();
    } else {
      if (currency) {
        const values = form.getFieldsValue();
        form.setFieldsValue({
          ...values,
          priceType: priceType,
          price: priceType === coursePriceTypes.FREE.name ? 0 : values.price || 10,
        });
        setCoursePriceType(priceType);
      } else {
        Modal.confirm({
          title: `We need your bank account details to send you the earnings. Please add your bank account details and proceed with creating a paid session`,
          okText: 'Setup payment account',
          cancelText: 'Keep it free',
          onCancel: () => setFreeCourse(),
          onOk: () => {
            setFreeCourse();
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

  const handleFinish = async (values, shouldRedirect = true) => {
    setSubmitting(true);

    const modulesData = courseDetails
      ? {
          type: courseDetails?.type ?? 'VIDEO',
          max_participants: courseDetails?.max_participants ?? 1,
          start_date: courseDetails?.start_date ?? moment().startOf('day').utc().format(),
          end_date: courseDetails?.end_date ?? moment().endOf('day').add(10, 'day').utc().format(),
          validity: courseDetails?.validity ?? 1,
        }
      : {
          type: 'VIDEO',
          max_participants: 0,
          validity: 1,
        };

    const payload = {
      name: values.courseName,
      course_image_url: courseImageUrl || values.courseImageUrl,
      summary: values.summary ?? '',
      description: values.description ?? '',
      topic: values.topic ?? [],
      faqs: values.faqs ?? [],
      price: coursePriceType === coursePriceTypes.FREE.name ? 0 : currency ? values.price ?? 1 : 0,
      currency: currency?.toLowerCase() || '',
      tag_ids: selectedTagType === 'anyone' ? [] : values.selectedMemberTags || [],
      preview_image_url: previewImageUrls ?? [],
      preview_video_urls: values.preview_video_urls ?? [],
      waitlist: values.waitlist ?? false,
      ...modulesData,
    };

    try {
      const { status, data } = courseId
        ? await apis.courses.updateCourse(courseId, payload)
        : await apis.courses.createCourse(payload);

      if (isAPISuccess(status)) {
        setSubmitting(false);
        showSuccessModal(`${payload.name} successfully ${courseId ? 'updated' : 'created'}`);

        if (shouldRedirect) {
          history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.courses);
        }

        if (courseId) {
          return courseId;
        } else if (data?.id) {
          return data?.id;
        }
      }
    } catch (error) {
      setSubmitting(false);
      console.error(error);
      showErrorModal(
        `Failed to ${courseId ? 'update' : 'create'} course`,
        error?.response?.data?.message || 'Something went wrong.'
      );
    }

    return null;
  };

  const gotoModulePage = async () => {
    try {
      await form.validateFields();

      const courseExternalId = await handleFinish(form.getFieldsValue(), false);
      if (courseExternalId) {
        history.push(
          Routes.creatorDashboard.rootPath +
            generatePath(Routes.creatorDashboard.createCourseModule, { course_id: courseExternalId })
        );
      }
    } catch (error) {
      form.scrollToField(error.errorFields[0].name);
      message.error('Please fill all the required fields!');
      console.error(error);
    }
  };

  return (
    <Loader size="large" loading={isLoading}>
      <Form
        layout="horizontal"
        name="courseForm"
        form={form}
        onFinish={handleFinish}
        initialValues={formInitialValues}
        scrollToFirstError={true}
        key={courseDetails?.id ? courseDetails?.id : 'newForm'}
      >
        <Row gutter={[8, 10]}>
          {/* Section Header */}
          <Col xs={24}>
            <PageHeader
              title={courseId ? 'Edit Course' : 'Create New Course'}
              onBack={() => history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.courses)}
            />
          </Col>

          {/* Course Details */}
          <Col xs={24} className={styles.courseSection}>
            <Row gutter={[8, 16]}>
              <Col xs={24}>
                <Title level={4}>1. Basic Course Information</Title>
              </Col>
              <Col xs={24}>
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
                      label={
                        <>
                          {' '}
                          <Text type="danger">*</Text>Course Image (size of Facebook Cover Image)
                        </>
                      }
                      overlayHelpText="Click to change image (size of Facebook Cover Image)"
                    />
                  </div>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  {...courseCreatePageLayout}
                  id="courseName"
                  name="courseName"
                  label="Course Name"
                  rules={validationRules.requiredValidation}
                >
                  <Input placeholder="Enter Course Name" maxLength={100} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  {...courseCreatePageLayout}
                  className={classNames(styles.bgWhite, styles.textEditorLayout)}
                  label="Short summary of the course"
                  name="description"
                  id="description"
                >
                  <div>
                    <TextEditor
                      key={courseDetails?.id ? courseDetails?.id : 'new_description'}
                      name={['description']}
                      form={form}
                      placeholder="  Describe this course briefly"
                    />
                  </div>
                  {/* <TextArea
                    showCount={true}
                    placeholder="Describe this course briefly (max 280 characters)"
                    maxLength={280}
                    className={styles.textAreaInput}
                  /> */}
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  {...courseCreatePageLayout}
                  className={classNames(styles.bgWhite, styles.textEditorLayout)}
                  id="summary"
                  name="summary"
                  label="Details of what students will learn"
                  fieldKey={courseDetails?.id ? `${courseDetails.id}_summary` : 'new_summary'}
                >
                  <div>
                    <TextEditor
                      fieldKey={courseDetails?.id ? `${courseDetails.id}_summary` : 'new_summary'}
                      name="summary"
                      form={form}
                      placeholder="  Describe what will the students learn"
                    />
                  </div>
                  {/* <TextArea
                    placeholder="Describe what will the students learn from this course (max 800 characters)"
                    maxLength={800}
                    showCount={true}
                    className={styles.textAreaInput}
                  /> */}
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item {...courseCreatePageLayout} label="Any images you want to add (Course Preview/Testimonial)">
                  <Row gutter={[10, 10]}>
                    <Col xs={12} md={8} lg={6}>
                      <div className={styles.previewImageUploaderContainer}>
                        <ImageUpload
                          className={styles.previewImageUploader}
                          aspect={1}
                          label="Click to upload"
                          action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                          onChange={handleAddPreviewImageUrl}
                        />
                      </div>
                    </Col>
                    {previewImageUrls?.length > 0 &&
                      previewImageUrls.map((previewUrl) => (
                        <Col xs={12} md={8} lg={6} key={previewUrl}>
                          <div className={styles.previewImageContainer}>
                            <div className={styles.previewImageButtonContainer}>
                              <Button
                                danger
                                ghost
                                type="primary"
                                icon={<CloseOutlined />}
                                onClick={() => removePreviewImageUrl(previewUrl)}
                              />
                            </div>
                            <Image loading="lazy" preview={false} src={previewUrl} className={styles.previewImage} />
                          </div>
                        </Col>
                      ))}
                  </Row>
                </Form.Item>
              </Col>
            </Row>
          </Col>

          {/* Course Topics */}
          <Col xs={24} className={styles.courseSection}>
            <Row gutter={[8, 16]}>
              <Col xs={24}>
                <Title level={4}>2. Who should attend this course (Optional)</Title>
              </Col>
              <Col xs={24}>
                <Form.List name="topic">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, fieldKey, ...restField }) => (
                        <Row key={key}>
                          <Col xs={24}>
                            <Form.Item {...courseCreatePageLayout} label="Student type heading" required={true}>
                              <Form.Item
                                {...restField}
                                id="heading"
                                name={[name, 'heading']}
                                fieldKey={[fieldKey, 'heading']}
                                rules={validationRules.requiredValidation}
                                noStyle
                              >
                                <Input placeholder="Enter heading" maxLength={100} className={styles.inputWithButton} />
                              </Form.Item>
                              {fields.length > 0 ? (
                                <span className="ant-form-text">
                                  <Tooltip title="Remove this item">
                                    <DeleteOutlined
                                      className={styles.deleteItemIconButton}
                                      onClick={() => remove(name)}
                                    />
                                  </Tooltip>
                                </span>
                              ) : null}
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Form.Item
                              {...restField}
                              {...courseCreatePageLayout}
                              id="topic_description"
                              label="Student Type Description"
                              name={[name, 'description']}
                              fieldKey={[fieldKey, 'description']}
                              rules={validationRules.requiredValidation}
                              className={classNames(styles.bgWhite, styles.textEditorLayout)}
                            >
                              <div>
                                <TextEditor
                                  name={['topic', name, 'description']}
                                  form={form}
                                  placeholder="  Describe who is this course for"
                                />
                              </div>
                            </Form.Item>
                          </Col>
                        </Row>
                      ))}
                      {fields.length < 3 && (
                        <Row>
                          <Col xs={24} md={{ span: 6, offset: 8 }}>
                            <Button block size="large" type="primary" onClick={() => add()} icon={<PlusOutlined />}>
                              Add Attendee Types
                            </Button>
                          </Col>
                        </Row>
                      )}
                    </>
                  )}
                </Form.List>
              </Col>
            </Row>
          </Col>

          {/* Course Preview */}
          <Col xs={24} className={styles.courseSection}>
            <Row gutter={[8, 16]}>
              <Col xs={24}>
                <Title level={4}>3. Course Preview (Optional)</Title>
              </Col>
              <Col xs={24}>
                <Form.List name="preview_video_urls">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, fieldKey, ...restField }) => (
                        <Row key={key}>
                          <Col xs={24}>
                            <Form.Item {...courseCreatePageLayout} label="Preview Title" required={true}>
                              <Form.Item
                                {...restField}
                                id="title"
                                name={[name, 'title']}
                                fieldKey={[fieldKey, 'title']}
                                rules={validationRules.requiredValidation}
                                noStyle
                              >
                                <Input
                                  placeholder="Enter preview title"
                                  maxLength={100}
                                  className={styles.inputWithButton}
                                />
                              </Form.Item>
                              {fields.length > 0 ? (
                                <span className="ant-form-text">
                                  <Tooltip title="Remove this item">
                                    <DeleteOutlined
                                      className={styles.deleteItemIconButton}
                                      onClick={() => remove(name)}
                                    />
                                  </Tooltip>
                                </span>
                              ) : null}
                            </Form.Item>
                          </Col>
                          <Col xs={0}>
                            {/* TODO: Currently this input is hidden, but later when we support more types we can show this as radio button */}
                            <Form.Item
                              initialValue="YOUTUBE"
                              hidden
                              id="preview_type"
                              name={[name, 'type']}
                              fieldKey={[fieldKey, 'type']}
                              rules={validationRules.requiredValidation}
                            >
                              <Input disabled />
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Form.Item
                              {...restField}
                              {...courseCreatePageLayout}
                              id="preview_url"
                              label="Preview YouTube URL"
                              name={[name, 'url']}
                              fieldKey={[fieldKey, 'url']}
                              rules={validationRules.youtubeLinkValidation}
                            >
                              <Input placeholder="Put YouTube video link here" maxLength={100} />
                            </Form.Item>
                          </Col>
                        </Row>
                      ))}
                      {fields.length < 1 && (
                        <Row>
                          <Col xs={24} md={{ span: 6, offset: 8 }}>
                            <Button block size="large" type="primary" onClick={() => add()} icon={<PlusOutlined />}>
                              Add Preview
                            </Button>
                          </Col>
                        </Row>
                      )}
                    </>
                  )}
                </Form.List>
              </Col>
            </Row>
          </Col>

          {/* FAQs */}
          <Col xs={24} className={styles.courseSection}>
            <Row gutter={[8, 16]}>
              <Col xs={24}>
                <Title level={4}>4. Frequently Asked Questions (Optional)</Title>
              </Col>
              <Col xs={24}>
                <Form.List name="faqs">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, fieldKey, ...restField }) => (
                        <Row key={key}>
                          <Col xs={24}>
                            <Form.Item {...courseCreatePageLayout} label="Question" required={true}>
                              <Form.Item
                                {...restField}
                                id="question"
                                name={[name, 'question']}
                                fieldKey={[fieldKey, 'question']}
                                rules={validationRules.requiredValidation}
                                noStyle
                              >
                                <Input
                                  placeholder="Enter the question"
                                  maxLength={100}
                                  className={styles.inputWithButton}
                                />
                              </Form.Item>
                              {fields.length > 0 ? (
                                <span className="ant-form-text">
                                  <Tooltip title="Remove this item">
                                    <DeleteOutlined
                                      className={styles.deleteItemIconButton}
                                      onClick={() => remove(name)}
                                    />
                                  </Tooltip>
                                </span>
                              ) : null}
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Form.Item
                              {...restField}
                              {...courseCreatePageLayout}
                              id="answer"
                              label="Answer"
                              name={[name, 'answer']}
                              fieldKey={[fieldKey, 'answer']}
                              rules={validationRules.requiredValidation}
                              className={classNames(styles.bgWhite, styles.textEditorLayout)}
                            >
                              <div>
                                <TextEditor
                                  name={['faqs', name, 'answer']}
                                  form={form}
                                  placeholder="  Describe the answer to the question above"
                                />
                              </div>
                            </Form.Item>
                          </Col>
                        </Row>
                      ))}
                      {fields.length < 3 && (
                        <Row>
                          <Col xs={24} md={{ span: 6, offset: 8 }}>
                            <Button block size="large" type="primary" onClick={() => add()} icon={<PlusOutlined />}>
                              Add FAQs
                            </Button>
                          </Col>
                        </Row>
                      )}
                    </>
                  )}
                </Form.List>
              </Col>
            </Row>
          </Col>

          {/* Pricing Details */}
          <Col xs={24} className={styles.courseSection}>
            <Row gutter={[8, 16]}>
              <Col xs={24}>
                <Title level={4}>5. Course Pricing</Title>
              </Col>
              <Col xs={24}>
                <Row gutter={8}>
                  <Col xs={24}>
                    <Form.Item
                      {...courseCreatePageLayout}
                      id="priceType"
                      name="priceType"
                      label="Course Pricing"
                      rules={validationRules.requiredValidation}
                      onChange={handleCoursePriceTypeChange}
                    >
                      <Radio.Group
                        options={Object.values(coursePriceTypes).map((pType) => ({
                          label: pType.label,
                          value: pType.name,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                  {coursePriceType === coursePriceTypes.PAID.name && (
                    <Col xs={24}>
                      <Form.Item label="Price" required={true} {...courseCreatePageLayout}>
                        <Form.Item
                          id="price"
                          name="price"
                          rules={validationRules.numberValidation('Please input course price', 0)}
                          noStyle
                        >
                          {creatorAbsorbsFees || currency === '' ? (
                            <InputNumber
                              min={0}
                              disabled={currency === ''}
                              placeholder="Course Price"
                              className={styles.numericInput}
                            />
                          ) : (
                            <PriceInputCalculator
                              name="price"
                              form={form}
                              minimalPrice={0}
                              initialValue={0}
                              feePercentage={creatorFeePercentage}
                            />
                          )}
                        </Form.Item>
                        {(creatorAbsorbsFees || currency === '') && (
                          <span className="ant-form-text"> {currency?.toUpperCase() || ''} </span>
                        )}
                      </Form.Item>
                    </Col>
                  )}
                </Row>
              </Col>
              <Col xs={24}>
                <Form.Item required label="Buying Method" {...courseCreatePageLayout} hidden={courseId}>
                  <Form.Item
                    id="waitlist"
                    name="waitlist"
                    className={styles.inlineFormItem}
                    rules={validationRules.requiredValidation}
                  >
                    <Radio.Group>
                      <Radio value={false}>Direct Buy</Radio>
                      <Radio value={true}>Waitlist</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item className={styles.inlineFormItem}>
                    <Button
                      size="small"
                      type="link"
                      onClick={() => showWaitlistHelperModal('course')}
                      icon={<InfoCircleOutlined />}
                    >
                      What is waitlist?
                    </Button>
                  </Form.Item>
                </Form.Item>
              </Col>
              <Col xs={24}>
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
                  {...coursePageTailLayout}
                  name="selectedMemberTags"
                  id="selectedMemberTags"
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
          </Col>

          {/* CTA Buttons */}
          <Col xs={24}>
            <Row justify="end" align="center" gutter={[8, 8]}>
              <Col xs={12} md={8} lg={6}>
                <Button block type="default" htmlType="submit" loading={submitting}>
                  {courseId ? 'Update' : 'Create'} Course
                </Button>
              </Col>
              <Col xs={12} md={6} lg={6}>
                <Button block type="primary" onClick={() => gotoModulePage()} loading={submitting}>
                  Continue to {courseId ? 'Edit' : 'Add'} Modules
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Form>
    </Loader>
  );
};

export default CourseForm;
