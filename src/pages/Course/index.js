import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import classNames from 'classnames';
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
} from 'antd';
import { TagOutlined, InfoCircleOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Loader from 'components/Loader';
import ImageUpload from 'components/ImageUpload';
import { showErrorModal, showSuccessModal, showTagOptionsHelperModal } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { fetchCreatorCurrency } from 'utils/payment';
import { isAPISuccess } from 'utils/helper';

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

// TODO: Match these keys with the form item names
const formInitialValues = {
  courseImageUrl: '',
  courseName: '',
  courseDescription: '',
  summary: '',
  topic: [
    {
      heading: '',
      description: '',
    },
  ],
  faqs: [
    {
      question: '',
      answer: '',
    },
  ],
  priceType: coursePriceTypes.FREE.name,
  price: 10,
  courseTagType: 'anyone',
  selectedMemberTags: [],
};

const { Title } = Typography;
const { TextArea } = Input;

const Course = ({ match, history }) => {
  const [form] = Form.useForm();

  const courseId = match.params.course_id;

  const [currency, setCurrency] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [courseImageUrl, setCourseImageUrl] = useState(null);
  const [selectedTagType, setSelectedTagType] = useState('anyone');
  const [coursePriceType, setCoursePriceType] = useState(coursePriceTypes.FREE.name);

  const [courseDetails, setCourseDetails] = useState(null);
  const [creatorMemberTags, setCreatorMemberTags] = useState([]);

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

  useEffect(() => {
    fetchCreatorMemberTags();
    getCreatorCurrencyDetails();
  }, [fetchCreatorMemberTags, getCreatorCurrencyDetails]);

  // TODO: Implement State initialization and Edit Flow here

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

  const handleFinish = async (values) => {
    setSubmitting(true);

    const payload = {
      name: values.courseName,
      course_image_url: courseImageUrl || values.courseImageUrl,
      summary: values.summary,
      description: values.description,
      topic: values.topic,
      faqs: values.faqs,
      price: currency ? values.price ?? 1 : 0,
      currency: currency?.toLowerCase() || '',
      tag_ids: selectedTagType === 'anyone' ? [] : values.selectedMemberTags || [],
      // TODO: Implement Multiple Image Upload later
      preview_image_url: [],
      // NOTE : The values below are hard coded for now because they should be changed in the next page
      modules: [],
      type: 'MIXED',
      max_participants: 20,
      start_date: moment().startOf('day').utc().format(),
      end_date: moment().endOf('day').utc().format(),
    };

    try {
      const { status } = courseId
        ? await apis.courses.updateCourse(courseId, payload)
        : await apis.courses.createCourse(payload);

      if (isAPISuccess(status)) {
        showSuccessModal(`${payload.name} successfully ${courseId ? 'updated' : 'created'}`);
      }
    } catch (error) {
      console.error(error);
      showErrorModal(
        `Failed to ${courseId ? 'update' : 'create'} course`,
        error?.response?.data?.message || 'Something went wrong.'
      );
    }

    setSubmitting(false);
  };

  const gotoModulePage = async () => {
    await handleFinish(form.getFieldsValue());
    history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.createCourseModule);
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
                <Title level={4}>1. Course Information</Title>
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
                      label="Course Image (size of Facebook Cover Image)"
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
                  rules={validationRules.nameValidation}
                >
                  <Input placeholder="Enter Course Name" maxLength={50} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  {...courseCreatePageLayout}
                  className={classNames(styles.bgWhite, styles.textEditorLayout)}
                  label="Course Description"
                  name="description"
                  id="description"
                  rules={validationRules.requiredValidation}
                >
                  <TextArea placeholder="Describe this course briefly" className={styles.textAreaInput} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  {...courseCreatePageLayout}
                  className={classNames(styles.bgWhite, styles.textEditorLayout)}
                  id="summary"
                  name="summary"
                  label="What will students learn"
                  rules={validationRules.requiredValidation}
                >
                  {/* <TextEditor name="summary" form={form} placeholder="  Describe what will the students learn from this course" /> */}
                  <TextArea
                    placeholder="Describe what will the students learn from this course"
                    className={styles.textAreaInput}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Col>

          {/* Course Topics */}
          <Col xs={24} className={styles.courseSection}>
            <Row gutter={[8, 16]}>
              <Col xs={24}>
                <Title level={3}>2. Who is this course for</Title>
              </Col>
              <Col xs={24}>
                <Form.List name="topic">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, fieldKey, ...restField }) => (
                        <Row key={key}>
                          <Col xs={24}>
                            <Form.Item
                              {...restField}
                              {...courseCreatePageLayout}
                              id="heading"
                              label="Heading"
                              name={[name, 'heading']}
                              fieldKey={[fieldKey, 'heading']}
                              rules={validationRules.requiredValidation}
                            >
                              <Input
                                placeholder="Enter heading (max. 50 characters)"
                                maxLength={50}
                                suffix={
                                  fields.length > 0 ? (
                                    <Tooltip title="Remove this item">
                                      <MinusCircleOutlined className={styles.redText} onClick={() => remove(name)} />
                                    </Tooltip>
                                  ) : null
                                }
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Form.Item
                              {...restField}
                              {...courseCreatePageLayout}
                              id="topic_description"
                              label="Description"
                              name={[name, 'description']}
                              fieldKey={[fieldKey, 'description']}
                              rules={validationRules.requiredValidation}
                              className={classNames(styles.bgWhite, styles.textEditorLayout)}
                            >
                              {/* <TextEditor name={[name, 'description']} form={form} placeholder="  Describe who is this course for" /> */}
                              <TextArea
                                className={styles.textAreaInput}
                                placeholder="Describe who is this course for"
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      ))}
                      {fields.length < 3 && (
                        <Row>
                          <Col xs={24} md={{ span: 8, offset: 8 }}>
                            <Button block size="large" type="primary" onClick={() => add()} icon={<PlusOutlined />}>
                              Add More Item
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
                <Title level={3}>3. Frequently Asked Questions</Title>
              </Col>
              <Col xs={24}>
                <Form.List name="faqs">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, fieldKey, ...restField }) => (
                        <Row key={key}>
                          <Col xs={24}>
                            <Form.Item
                              {...restField}
                              {...courseCreatePageLayout}
                              id="question"
                              label="Question"
                              name={[name, 'question']}
                              fieldKey={[fieldKey, 'question']}
                              rules={validationRules.requiredValidation}
                            >
                              <Input placeholder="Enter Question" maxLength={50} />
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
                              {/* <TextEditor name={[name, 'answer']} form={form} placeholder="  Describe answer to the question" /> */}
                              <TextArea
                                className={styles.textAreaInput}
                                placeholder="Describe the answer to the question above"
                              />
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
          </Col>

          {/* Pricing Details */}
          <Col xs={24} className={styles.courseSection}>
            <Row gutter={[8, 16]}>
              <Col xs={24}>
                <Title level={4}>4. Pricing and details</Title>
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
                      <Form.Item
                        {...courseCreatePageLayout}
                        id="price"
                        name="price"
                        label="Price"
                        rules={validationRules.numberValidation('Please input course price', 0)}
                      >
                        <InputNumber
                          min={0}
                          disabled={currency === ''}
                          placeholder="Course Price"
                          className={styles.numericInput}
                        />
                        <span className="ant-form-text"> {currency?.toUpperCase() || ''} </span>
                      </Form.Item>
                    </Col>
                  )}
                </Row>
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
              <Col xs={12} md={8}>
                <Button block type="default" htmlType="submit" loading={submitting}>
                  Create Course
                </Button>
              </Col>
              <Col xs={12} md={6}>
                <Button block type="primary" onClick={() => gotoModulePage()} loading={submitting}>
                  Add Modules
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Form>
    </Loader>
  );
};

export default Course;
