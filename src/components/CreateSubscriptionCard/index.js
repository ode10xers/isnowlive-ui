import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';

import { Row, Col, Form, Card, List, Button, Input, InputNumber, Typography, Checkbox, Select } from 'antd';
import { BookTwoTone } from '@ant-design/icons';

import apis from 'apis';

import Loader from 'components/Loader';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { isAPISuccess, productAccessOptions } from 'utils/helper';

// import { subscriptionModalFormLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';

const formInitialValues = {
  subscriptionName: '',
  price: 10,
  subscriptionCredits: 5,
  includedProducts: [],
  includedSessionsType: [],
  includedSessions: [],
  includedVideosType: [],
  includedVideos: [],
  shouldIncludeCourse: false,
  courseCredits: 1,
  includedCoursesType: [],
  includedCourses: [],
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
  const [includedSessionsType, setIncludedSessionsType] = useState([]);
  const [includedVideosType, setIncludedVideosType] = useState([]);
  const [includedCoursesType, setIncludedCoursesType] = useState([]);

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
      const formData = {
        subscriptionName: editedSubscription?.name,
        price: editedSubscription?.price,
        subscriptionCredits: editedSubscription?.products['SESSION']
          ? editedSubscription?.products['SESSION'].credits
          : editedSubscription?.products['VIDEO'].credits,
        includedProducts: Object.entries(editedSubscription?.products).map(([key, val]) => key),
        includedSessionsType: editedSubscription?.products['SESSION']
          ? editedSubscription?.products['SESSION'].access_types
          : [],
        includedSessions: editedSubscription?.products['SESSION']
          ? editedSubscription?.products['SESSION'].product_ids
          : [],
        includedVideosType: editedSubscription?.products['VIDEO']
          ? editedSubscription?.products['VIDEO'].access_types
          : [],
        includedVideos: editedSubscription?.products['VIDEO'] ? editedSubscription?.products['VIDEO'].product_ids : [],
        shouldIncludeCourse: editedSubscription?.products['COURSE'] ? true : false,
        courseCredits: editedSubscription?.products['COURSE'] ? editedSubscription?.products['COURSE'].credits : 1,
        includedCoursesType: editedSubscription?.products['COURSE']
          ? editedSubscription?.products['COURSE'].access_types
          : [],
        includedCourses: editedSubscription?.products['COURSE']
          ? editedSubscription?.products['COURSE'].product_ids
          : [],
      };

      form.setFieldsValue(formData);

      setCurrency(editedSubscription?.currency || 'SGD');
      setIsSessionIncluded(editedSubscription?.products['SESSION'] ? true : false);
      setIsVideoIncluded(editedSubscription?.products['VIDEO'] ? true : false);
      setIsCourseIncluded(editedSubscription?.products['COURSE'] ? true : false);
      setSelectedSessions(
        editedSubscription?.products['SESSION'] ? editedSubscription?.products['SESSION'].product_ids : []
      );
      setSelectedVideos(editedSubscription?.products['VIDEO'] ? editedSubscription?.products['VIDEO'].product_ids : []);
      setSelectedCourses(
        editedSubscription?.products['COURSE'] ? editedSubscription?.products['COURSE'].product_ids : []
      );
      setIncludedSessionsType(
        editedSubscription?.products['SESSION'] ? editedSubscription?.products['SESSION'].access_types : []
      );
      setIncludedVideosType(
        editedSubscription?.products['VIDEO'] ? editedSubscription?.products['VIDEO'].access_types : []
      );
      setIncludedCoursesType(
        editedSubscription?.products['COURSE'] ? editedSubscription?.products['COURSE'].access_types : []
      );
    } else {
      form.resetFields();
      setIsSessionIncluded(false);
      setIsVideoIncluded(false);
      setIsCourseIncluded(false);
      setSelectedSessions([]);
      setSelectedVideos([]);
      setSelectedCourses([]);
      setIncludedSessionsType([]);
      setIncludedVideosType([]);
      setIncludedCoursesType([]);
    }

    fetchCreatorCurrency();
  }, [fetchCreatorCurrency, form, editedSubscription]);

  const onIncludedProductsChange = (values) => {
    setIsSessionIncluded(values.includes('SESSION'));
    setIsVideoIncluded(values.includes('VIDEO'));

    let updatedFormValues = null;

    if (!values.includes('SESSION')) {
      setIncludedSessionsType([]);
      updatedFormValues = {
        ...updatedFormValues,
        includedSessionsType: [],
        includedSessions: [],
      };
    }

    if (!values.includes('VIDEO')) {
      setIncludedVideosType([]);
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
      setIncludedCoursesType([]);
      form.setFieldsValue({
        ...form.getFieldValue(),
        includedCourses: [],
        courseCredits: 0,
      });
    }
  };

  const handleFinish = async (values) => {
    setIsSubmitting(true);

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

      const { status, data } = editedSubscription?.external_id
        ? await apis.subscriptions.updateSubscription(editedSubscription?.external_id, payload)
        : await apis.subscriptions.createSubscription(payload);

      if (isAPISuccess(status) && data) {
        showSuccessModal(`Subscription ${editedSubscription ? 'updated' : 'created'} successfully`);
        saveChanges();
      }
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

  const handleIncludedSessionsTypeChange = (values) => {
    const currSelectedSessions = sessions.filter((session) => selectedSessions.includes(session.external_id));
    const filteredSelectedSessions = currSelectedSessions
      .filter((session) => values.includes(session.access))
      .map((session) => session.external_id);
    form.setFieldsValue({ ...form.getFieldsValue(), includedSessions: filteredSelectedSessions });
    setSelectedSessions(filteredSelectedSessions);
    setIncludedSessionsType(values);
  };

  const handleIncludedVideosTypeChange = (values) => {
    const currSelectedVideos = videos.filter((video) => selectedVideos.includes(videos.external_id));
    const filteredSelectedVideos = currSelectedVideos
      .filter((video) => values.includes(video.access))
      .map((video) => video.external_id);
    form.setFieldsValue({ ...form.getFieldValue(), includedVideos: filteredSelectedVideos });
    setSelectedVideos(filteredSelectedVideos);
    setIncludedVideosType(values);
  };

  const handleIncludedCoursesTypeChange = (values) => {
    const currSelectedCourses = courses.filter((course) => selectedCourses.includes(course.id));
    const filteredSelectedCourses = currSelectedCourses
      .filter((course) => values.includes(course.access))
      .map((course) => course.id);
    form.setFieldsValue({ ...form.getFieldsValue(), includedCourses: filteredSelectedCourses });
    setSelectedCourses(filteredSelectedCourses);
    setIncludedCoursesType(values);
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
                value={includedSessionsType}
              >
                <Checkbox.Group
                  disabled={!isSessionIncluded}
                  options={productAccessOptions}
                  onChange={handleIncludedSessionsTypeChange}
                />
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
                  maxTagCount="responsive"
                  dropdownMatchSelectWidth={false}
                  value={selectedSessions}
                  disabled={!isSessionIncluded}
                  onChange={(val) => setSelectedSessions(val)}
                  optionLabelProp="label"
                >
                  {includedSessionsType.includes('PUBLIC') && (
                    <Select.OptGroup
                      label={<Text className={styles.optionSeparatorText}> Public sessions </Text>}
                      key="Public Sessions"
                    >
                      {sessions
                        ?.filter((session) => session.access === 'PUBLIC')
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
                      {sessions?.filter((session) => session.access === 'PUBLIC').length <= 0 && (
                        <Text disabled> No public sessions </Text>
                      )}
                    </Select.OptGroup>
                  )}
                  {includedSessionsType.includes('MEMBERSHIP') && (
                    <Select.OptGroup
                      label={<Text className={styles.optionSeparatorText}> Members only sessions </Text>}
                      key="Members Sessions"
                    >
                      {sessions
                        ?.filter((session) => session.access === 'MEMBERSHIP')
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
                      {sessions?.filter((session) => session.access === 'MEMBERSHIP').length <= 0 && (
                        <Text disabled> No members only sessions </Text>
                      )}
                    </Select.OptGroup>
                  )}
                </Select>
              </Form.Item>
            </List.Item>
            <List.Item>
              <Form.Item
                className={classNames(!isVideoIncluded ? styles.disabled : undefined, styles.compactFormItem)}
                id="includedVideosType"
                name="includedVideosType"
                rules={isVideoIncluded ? validationRules.arrayValidation : undefined}
                value={includedVideosType}
              >
                <Checkbox.Group
                  disabled={!isVideoIncluded}
                  options={productAccessOptions}
                  onChange={handleIncludedVideosTypeChange}
                />
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
                  disabled={!isVideoIncluded}
                  placeholder="Select included videos"
                  mode="multiple"
                  maxTagCount="responsive"
                  dropdownMatchSelectWidth={false}
                  value={selectedVideos}
                  onChange={(val) => setSelectedVideos(val)}
                  optionLabelProp="label"
                >
                  {includedVideosType.includes('PUBLIC') && (
                    <Select.OptGroup
                      label={<Text className={styles.optionSeparatorText}> Public videos </Text>}
                      key="Public Videos"
                    >
                      {videos
                        ?.filter((video) => video.access === 'PUBLIC')
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
                      {videos?.filter((video) => video.access === 'PUBLIC').length <= 0 && (
                        <Text disabled> No public video </Text>
                      )}
                    </Select.OptGroup>
                  )}
                  {includedVideosType.includes('MEMBERSHIP') && (
                    <Select.OptGroup
                      label={<Text className={styles.optionSeparatorText}> Members only videos </Text>}
                      key="Members Videos"
                    >
                      {videos
                        ?.filter((video) => video.access === 'MEMBERSHIP')
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
                      {videos?.filter((video) => video.access === 'MEMBERSHIP').length <= 0 && (
                        <Text disabled> No members only videos </Text>
                      )}
                    </Select.OptGroup>
                  )}
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
                value={includedCoursesType}
              >
                <Checkbox.Group
                  disabled={!isCourseIncluded}
                  options={productAccessOptions}
                  onChange={handleIncludedCoursesTypeChange}
                />
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
                  disabled={!isCourseIncluded}
                  placeholder="Select included courses"
                  mode="multiple"
                  maxTagCount="responsive"
                  dropdownMatchSelectWidth={false}
                  value={selectedCourses}
                  onChange={(val) => setSelectedCourses(val)}
                  optionLabelProp="label"
                >
                  {includedCoursesType.includes('PUBLIC') && (
                    <Select.OptGroup
                      label={<Text className={styles.optionSeparatorText}> Public courses </Text>}
                      key="Public Courses"
                    >
                      {courses
                        ?.filter((course) => course.access === 'PUBLIC')
                        .map((course) => (
                          <Select.Option value={course.id} key={course.id} label={course.name}>
                            <Row gutter={[8, 8]}>
                              <Col xs={17} className={styles.productName}>
                                {course.name}
                              </Col>
                              <Col xs={7} className={styles.textAlignRight}>
                                {course.currency?.toUpperCase()} {course.price}
                              </Col>
                            </Row>
                          </Select.Option>
                        ))}
                      {courses?.filter((course) => course.access === 'PUBLIC').length <= 0 && (
                        <Text disabled> No public courses </Text>
                      )}
                    </Select.OptGroup>
                  )}
                  {includedCoursesType.includes('MEMBERSHIP') && (
                    <Select.OptGroup
                      label={<Text className={styles.optionSeparatorText}> Members only courses </Text>}
                      key="Members Courses"
                    >
                      {courses
                        ?.filter((course) => course.access === 'MEMBERSHIP')
                        .map((course) => (
                          <Select.Option value={course.id} key={course.id} label={course.name}>
                            <Row gutter={[8, 8]}>
                              <Col xs={17} className={styles.productName}>
                                {course.name}
                              </Col>
                              <Col xs={7} className={styles.textAlignRight}>
                                {course.currency?.toUpperCase()} {course.price}
                              </Col>
                            </Row>
                          </Select.Option>
                        ))}
                      {courses?.filter((course) => course.access === 'MEMBERSHIP').length <= 0 && (
                        <Text disabled> No members only courses </Text>
                      )}
                    </Select.OptGroup>
                  )}
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
