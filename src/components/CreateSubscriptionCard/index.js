import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';

import { Row, Col, Form, Card, List, Button, Input, InputNumber, Typography, Checkbox, Select } from 'antd';
import { BookTwoTone } from '@ant-design/icons';

import apis from 'apis';

import Loader from 'components/Loader';
import { showErrorModal } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { isAPISuccess } from 'utils/helper';

// import { subscriptionModalFormLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';

const formInitialValues = {
  price: 10,
  subscriptionCredits: 5,
  courseCredits: 1,
};

const { Text } = Typography;

const includedProductsList = [
  {
    label: 'Sessions',
    value: 'SESSION',
  },
  {
    label: 'Videos',
    value: 'VIDEO',
  },
];

const productAccessOptions = [
  {
    value: 'PUBLIC',
    label: 'Public',
  },
  {
    value: 'MEMBERSHIP',
    label: 'Members',
  },
];

const CreateSubscriptionCard = ({
  sessions = [],
  videos = [],
  courses = [],
  cancelChanges,
  saveChanges,
  editedSubscription = null,
}) => {
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setIsSubmitting] = useState(false);
  const [isSessionIncluded, setIsSessionIncluded] = useState(false);
  const [isVideoIncluded, setIsVideoIncluded] = useState(false);
  const [isCourseIncluded, setIsCourseIncluded] = useState(false);
  const [currency, setCurrency] = useState('SGD');
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);

  const fetchCreatorCurrency = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.session.getCreatorBalance();

      if (isAPISuccess(status) && data?.currency) {
        setCurrency(data.currency.toUpperCase());
      }
    } catch (error) {
      showErrorModal(
        'Failed to fetch creator currency details',
        error?.response?.data?.message || 'Something went wrong'
      );
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (editedSubscription) {
      //TODO: Adjust with API Format here
      form.setFieldsValue({
        subscriptionName: editedSubscription?.name,
        price: editedSubscription?.price,
        subscriptionCredits: editedSubscription?.base_credits,
        includedProducts: editedSubscription?.product_applicable,
        shouldIncludeCourse: editedSubscription?.include_course,
      });

      setCurrency(editedSubscription?.currency || 'SGD');
      setIsSessionIncluded(false);
      setIsVideoIncluded(false);
      setIsCourseIncluded(false);
    } else {
      form.resetFields();
      setIsSessionIncluded(false);
      setIsVideoIncluded(false);
      setIsCourseIncluded(false);
    }

    fetchCreatorCurrency();
  }, [fetchCreatorCurrency, form, editedSubscription]);

  const onIncludedProductsChange = (values) => {
    setIsSessionIncluded(values.includes('SESSION'));
    setIsVideoIncluded(values.includes('VIDEO'));

    let updatedFormValues = null;

    if (!values.includes('SESSION')) {
      updatedFormValues = {
        ...updatedFormValues,
        includedSessionsType: [],
        includedSessions: [],
      };
    }

    if (!values.includes('VIDEO')) {
      updatedFormValues = {
        ...updatedFormValues,
        includedVideosType: [],
        includedVideos: [],
      };
    }

    if (updatedFormValues) {
      form.setFieldsValue({ ...form.getFieldsValue(), ...updatedFormValues });
    }
  };

  const onShouldIncludeCourseChange = (e) => {
    const shouldIncludeCourse = e.target.checked;

    setIsCourseIncluded(shouldIncludeCourse);

    if (!shouldIncludeCourse) {
      form.setFieldsValue({
        ...form.getFieldValue(),
        includedCourses: [],
        courseCredits: 0,
      });
    }
  };

  const handleFinish = async (values) => {
    setIsSubmitting(true);

    // const response = {
    //   id: 2021,
    //   name: values.subscriptionName,
    //   price: values.price,
    //   currency: currency,
    //   base_credits: values.subscriptionCredits,
    //   product_applicable: values.includedProducts,
    //   included_session_type: 'PUBLIC',
    //   included_video_type: 'MEMBERSHIP',
    //   include_course: false,
    // };
    // saveChanges(response);

    let productsData = {};

    values.includedProducts.forEach((product) => {
      productsData[product] = {
        access_types: product === 'SESSION' ? values.includedSessionsType : values.includedVideosType,
        credits: values.subscriptionCredits,
        product_ids: product === 'SESSION' ? selectedSessions : selectedVideos,
      };
    });

    if (values.shouldIncludeCourse) {
      productsData['COURSE'] = {
        access_types: values.includedCoursesType,
        credits: values.courseCredits,
        product_ids: selectedCourses,
      };
    }

    try {
      let payload = {
        name: values.subscriptionName,
        price: values.price,
        currency: currency,
        validity: 30,
        products: productsData,
      };

      console.log(payload);

      //TODO: Check the response and adjust accordingly
      // const { status, data } = await apis.subscriptions.createSubscription(payload);

      // if (isAPISuccess(status) && data) {
      //   console.log(data);
      // }
    } catch (error) {
      showErrorModal(
        `Failed to ${editedSubscription ? 'update' : 'create'} subscription`,
        error?.response?.data?.message || 'Something went wrong'
      );
    }

    setIsSubmitting(false);
  };

  const handleCancelChange = () => {
    if (editedSubscription) {
      saveChanges(editedSubscription);
    } else {
      cancelChanges();
    }
  };

  return (
    <Form
      layout="horizontal"
      name="SubscriptionForm"
      form={form}
      onFinish={handleFinish}
      initialValues={formInitialValues}
      scrollToFirstError={true}
    >
      <Loader size="large" loading={isLoading || submitting}>
        <Card
          headStyle={{ textAlign: 'center', padding: '0px 10px' }}
          title={
            <Form.Item
              className={styles.compactFormItem}
              id="subscriptionName"
              name="subscriptionName"
              rules={validationRules.nameValidation}
            >
              <Input placeholder="Enter Subscription Name" maxLength={50} />
            </Form.Item>
          }
          bodyStyle={{ padding: '0px 10px' }}
          actions={[
            <Button type="default" onClick={handleCancelChange} loading={submitting}>
              Cancel
            </Button>,
            <Button type="primary" className={styles.saveBtn} htmlType="submit" loading={submitting}>
              Save
            </Button>,
          ]}
        >
          <List itemLayout="vertical">
            <List.Item>
              <Form.Item className={styles.compactFormItem}>
                <Row gutter={4}>
                  <Col xs={16}>
                    <Form.Item
                      id="price"
                      name="price"
                      rules={validationRules.numberValidation('Please Input Subscription Price', 1, false)}
                      noStyle
                    >
                      <InputNumber min={1} placeholder="Enter Price" className={styles.numericInput} />
                    </Form.Item>
                  </Col>
                  <Col xs={8} className={classNames(styles.textAlignCenter, styles.helpTextWrapper)}>
                    <Text strong>{currency?.toUpperCase()}</Text>
                  </Col>
                </Row>
              </Form.Item>
            </List.Item>
            <List.Item>
              <Form.Item className={styles.compactFormItem}>
                <Row gutter={4}>
                  <Col xs={10}>
                    <Form.Item
                      id="subscriptionCredits"
                      name="subscriptionCredits"
                      rules={validationRules.numberValidation('Please Input Base Credits/Month', 1, false)}
                      noStyle
                    >
                      <InputNumber min={1} placeholder="Enter Credits" className={styles.numericInput} />
                    </Form.Item>
                  </Col>
                  <Col xs={14} className={classNames(styles.textAlignCenter, styles.helpTextWrapper)}>
                    <Text strong>Credits/Month</Text>
                  </Col>
                </Row>
              </Form.Item>
            </List.Item>
            <List.Item>
              <Form.Item
                className={styles.compactFormItem}
                id="includedProducts"
                name="includedProducts"
                rules={validationRules.arrayValidation}
              >
                <Checkbox.Group options={includedProductsList} onChange={onIncludedProductsChange} />
              </Form.Item>
            </List.Item>
            <List.Item>
              <Form.Item
                className={classNames(!isSessionIncluded ? styles.disabled : undefined, styles.compactFormItem)}
                id="includedSessionsType"
                name="includedSessionsType"
                rules={isSessionIncluded ? validationRules.arrayValidation : undefined}
              >
                <Checkbox.Group disabled={!isSessionIncluded} options={productAccessOptions} />
              </Form.Item>
            </List.Item>
            <List.Item>
              <Form.Item
                className={classNames(!isSessionIncluded ? styles.disabled : undefined, styles.compactFormItem)}
                id="includedSessions"
                name="includedSessions"
                rules={isSessionIncluded ? validationRules.arrayValidation : undefined}
              >
                <Select
                  showArrow
                  showSearch={false}
                  placeholder="Select included sessions"
                  mode="multiple"
                  maxTagCount={2}
                  value={selectedSessions}
                  onChange={(val) => setSelectedSessions(val)}
                  optionLabelProp="label"
                >
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Visible Publicly </Text>}
                    key="Published Sessions"
                  >
                    {sessions
                      ?.filter((session) => session.is_active)
                      .map((session) => (
                        <Select.Option
                          value={session.external_id}
                          key={session.external_id}
                          label={
                            <>
                              {' '}
                              {session.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {session.name}{' '}
                            </>
                          }
                        >
                          <Row gutter={[8, 8]}>
                            <Col xs={17} className={styles.productName}>
                              {session.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {session.name}
                            </Col>
                            <Col xs={7} className={styles.textAlignRight}>
                              {session.currency?.toUpperCase()} {session.price}
                            </Col>
                          </Row>
                        </Select.Option>
                      ))}
                    {sessions?.filter((session) => session.is_active).length <= 0 && (
                      <Text disabled> No published sessions </Text>
                    )}
                  </Select.OptGroup>
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Hidden from everyone </Text>}
                    key="Unpublished Sessions"
                  >
                    {sessions
                      ?.filter((session) => !session.is_active)
                      .map((session) => (
                        <Select.Option
                          value={session.external_id}
                          key={session.external_id}
                          label={
                            <>
                              {' '}
                              {session.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {session.name}{' '}
                            </>
                          }
                        >
                          <Row gutter={[8, 8]}>
                            <Col xs={17} className={styles.productName}>
                              {session.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {session.name}
                            </Col>
                            <Col xs={7} className={styles.textAlignRight}>
                              {session.currency?.toUpperCase()} {session.price}
                            </Col>
                          </Row>
                        </Select.Option>
                      ))}
                    {sessions?.filter((session) => !session.is_active).length <= 0 && (
                      <Text disabled> No unpublished sessions </Text>
                    )}
                  </Select.OptGroup>
                </Select>
              </Form.Item>
            </List.Item>
            <List.Item>
              <Form.Item
                className={classNames(!isVideoIncluded ? styles.disabled : undefined, styles.compactFormItem)}
                id="includedVideosType"
                name="includedVideosType"
                rules={isVideoIncluded ? validationRules.arrayValidation : undefined}
              >
                <Checkbox.Group disabled={!isVideoIncluded} options={productAccessOptions} />
              </Form.Item>
            </List.Item>
            <List.Item>
              <Form.Item
                className={classNames(!isVideoIncluded ? styles.disabled : undefined, styles.compactFormItem)}
                id="includedVideos"
                name="includedVideos"
                rules={isVideoIncluded ? validationRules.arrayValidation : undefined}
              >
                <Select
                  showArrow
                  showSearch={false}
                  placeholder="Select included videos"
                  mode="multiple"
                  maxTagCount={2}
                  value={selectedVideos}
                  onChange={(val) => setSelectedVideos(val)}
                  optionLabelProp="label"
                >
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Visible Publicly </Text>}
                    key="Published Videos"
                  >
                    {videos
                      ?.filter((video) => video.is_published)
                      .map((video) => (
                        <Select.Option
                          value={video.external_id}
                          key={video.external_id}
                          label={
                            <>
                              {' '}
                              {video.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {video.title}{' '}
                            </>
                          }
                        >
                          <Row gutter={[8, 8]}>
                            <Col xs={17} className={styles.productName}>
                              {video.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {video.title}
                            </Col>
                            <Col xs={7} className={styles.textAlignRight}>
                              {video.currency?.toUpperCase()} {video.price}
                            </Col>
                          </Row>
                        </Select.Option>
                      ))}
                    {videos?.filter((video) => video.is_published).length <= 0 && (
                      <Text disabled> No published video </Text>
                    )}
                  </Select.OptGroup>
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Hidden from everyone </Text>}
                    key="Unpublished Videos"
                  >
                    {videos
                      ?.filter((video) => !video.is_published)
                      .map((video) => (
                        <Select.Option
                          value={video.external_id}
                          key={video.external_id}
                          label={
                            <>
                              {' '}
                              {video.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {video.title}{' '}
                            </>
                          }
                        >
                          <Row gutter={[8, 8]}>
                            <Col xs={17} className={styles.productName}>
                              {video.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {video.title}
                            </Col>
                            <Col xs={7} className={styles.textAlignRight}>
                              {video.currency?.toUpperCase()} {video.price}
                            </Col>
                          </Row>
                        </Select.Option>
                      ))}
                    {videos?.filter((video) => !video.is_published).length <= 0 && (
                      <Text disabled> No unpublished video </Text>
                    )}
                  </Select.OptGroup>
                </Select>
              </Form.Item>
            </List.Item>
            <List.Item>
              <Row justify="center" align="center">
                <Col>
                  <Form.Item
                    className={styles.compactFormItem}
                    id="shouldIncludeCourse"
                    name="shouldIncludeCourse"
                    valuePropName="checked"
                  >
                    <Checkbox onChange={onShouldIncludeCourseChange}>Include Courses</Checkbox>
                  </Form.Item>
                </Col>
              </Row>
            </List.Item>
            <List.Item>
              <Row gutter={4}>
                <Col xs={10}>
                  <Form.Item
                    className={classNames(!isCourseIncluded ? styles.disabled : undefined, styles.compactFormItem)}
                    id="courseCredits"
                    name="courseCredits"
                    rules={
                      isCourseIncluded
                        ? validationRules.numberValidation('Please input course credits', 1, false)
                        : undefined
                    }
                  >
                    <InputNumber
                      disabled={!isCourseIncluded}
                      min={1}
                      placeholder="Course Credits/Month"
                      className={styles.numericInput}
                    />
                  </Form.Item>
                </Col>
                <Col xs={14} className={classNames(styles.helpTextWrapper, styles.textAlignCenter)}>
                  <Text strong>Credits/Month</Text>
                </Col>
              </Row>
            </List.Item>
            <List.Item>
              <Form.Item
                className={classNames(!isCourseIncluded ? styles.disabled : undefined, styles.compactFormItem)}
                id="includedCoursesType"
                name="includedCoursesType"
                rules={isCourseIncluded ? validationRules.arrayValidation : undefined}
              >
                <Checkbox.Group disabled={!isCourseIncluded} options={productAccessOptions} />
              </Form.Item>
            </List.Item>
            <List.Item>
              <Form.Item
                className={classNames(!isCourseIncluded ? styles.disabled : undefined, styles.compactFormItem)}
                id="includedCourses"
                name="includedCourses"
                rules={isCourseIncluded ? validationRules.arrayValidation : undefined}
              >
                <Select
                  showArrow
                  showSearch={false}
                  placeholder="Select included courses"
                  mode="multiple"
                  maxTagCount={2}
                  value={selectedCourses}
                  onChange={(val) => setSelectedCourses(val)}
                  optionLabelProp="label"
                >
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Visible Publicly </Text>}
                    key="Published Courses"
                  >
                    {courses
                      ?.filter((course) => course.is_published)
                      .map((course) => (
                        <Select.Option value={course.id} key={course.id} label={course.name}>
                          {course.name}
                        </Select.Option>
                      ))}
                    {courses?.filter((course) => course.is_published).length <= 0 && (
                      <Text disabled> No published courses </Text>
                    )}
                  </Select.OptGroup>
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Hidden from everyone </Text>}
                    key="Unpublished Courses"
                  >
                    {courses
                      ?.filter((course) => !course.is_published)
                      .map((course) => (
                        <Select.Option value={course.id} key={course.id} label={course.name}>
                          {course.name}
                        </Select.Option>
                      ))}
                    {courses?.filter((course) => !course.is_published).length <= 0 && (
                      <Text disabled> No unpublished courses </Text>
                    )}
                  </Select.OptGroup>
                </Select>
              </Form.Item>
            </List.Item>
          </List>
        </Card>
      </Loader>
    </Form>
  );
};

export default CreateSubscriptionCard;
