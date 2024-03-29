import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { TwitterPicker } from 'react-color';
import classNames from 'classnames';

import {
  Row,
  Col,
  Form,
  Card,
  List,
  Button,
  Input,
  Radio,
  Tooltip,
  InputNumber,
  Typography,
  Checkbox,
  Select,
  Modal,
  message,
} from 'antd';
import { BookTwoTone, InfoCircleOutlined, TagOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Loader from 'components/Loader';
import PriceInputCalculator from 'components/PriceInputCalculator';
import { showErrorModal, showSuccessModal, showTagOptionsHelperModal } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { isAPISuccess } from 'utils/helper';
import { generateRandomColor } from 'utils/colors';
import { fetchCreatorCurrency } from 'utils/payment';
import { defaultPlatformFeePercentage, UNLIMITED_SUBSCRIPTION_CREDIT_COUNT } from 'utils/constants';

import styles from './styles.module.scss';
import { isUnlimitedMembership } from 'utils/subscriptions';

const initialColor = generateRandomColor();

const formInitialValues = {
  subscriptionName: '',
  subscriptionTagType: 'anyone',
  selectedMemberTag: null,
  price: 10,
  includedProducts: [],
  subscriptionCredits: 5,
  includedSessions: [],
  includedVideos: [],
  courseCredits: 5,
  includedCourses: [],
  colorCode: initialColor,
};

const defaultBorderColor = '#f0f0f0';

const colorPickerChoices = ['#f44336', '#e91e63', '#673ab7', '#1890ff', '#4caf50', '#ffc107', '#f379b2', '#34727c'];

const { Text } = Typography;

export const includedProductsList = [
  {
    label: 'Sessions',
    value: 'SESSION',
  },
  {
    label: 'Videos',
    value: 'VIDEO',
  },
  {
    label: 'Courses',
    value: 'COURSE',
  },
];

const CreateSubscriptionCard = ({
  cancelChanges,
  saveChanges,
  editedSubscription = null,
  creatorMemberTags = [],
  creatorAbsorbsFees = true,
  creatorFeePercentage = defaultPlatformFeePercentage,
}) => {
  const [form] = Form.useForm();
  const history = useHistory();

  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setIsSubmitting] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [isSessionIncluded, setIsSessionIncluded] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [videos, setVideos] = useState([]);
  const [isVideoIncluded, setIsVideoIncluded] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isCourseIncluded, setIsCourseIncluded] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [currency, setCurrency] = useState('');
  const [colorCode, setColorCode] = useState(initialColor);
  const [selectedTagType, setSelectedTagType] = useState('anyone');
  const [selectedMemberTag, setSelectedMemberTag] = useState(null);

  const [isUnlimitedSessionVideoCredit, setIsUnlimitedSessionVideoCredit] = useState(false);
  const [isUnlimitedCourseCredit, setIsUnlimitedCourseCredit] = useState(false);

  const getCreatorProducts = useCallback(async () => {
    try {
      const { status, data } = await apis.session.getSession();

      if (isAPISuccess(status) && data) {
        setSessions(data);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to load sessions');
    }

    try {
      const { status, data } = await apis.videos.getCreatorVideos();

      if (isAPISuccess(status) && data) {
        setVideos(data);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to load videos');
    }

    try {
      const { status, data } = await apis.courses.getCreatorCourses();

      if (isAPISuccess(status) && data) {
        setCourses(data);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to load courses');
    }
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
  }, [history, form]);

  useEffect(() => {
    getCreatorProducts();

    if (editedSubscription) {
      const formData = {
        subscriptionName: editedSubscription?.name,
        price: editedSubscription?.price,
        subscriptionTagType: editedSubscription?.tag?.external_id ? 'selected' : 'anyone',
        selectedMemberTag: editedSubscription?.tag?.external_id || null,
        subscriptionPeriod: editedSubscription?.validity || 30,
        subscriptionCredits:
          editedSubscription?.products['VIDEO'] || editedSubscription?.products['SESSION']
            ? editedSubscription?.product_credits ?? 1
            : 0,
        includedProducts: Object.keys(editedSubscription?.products),
        includedSessions: editedSubscription?.products['SESSION']
          ? editedSubscription?.products['SESSION'].product_ids || []
          : [],
        includedVideos: editedSubscription?.products['VIDEO']
          ? editedSubscription?.products['VIDEO'].product_ids || []
          : [],
        courseCredits: editedSubscription?.products['COURSE'] ? editedSubscription?.course_credits ?? 1 : 0,
        includedCourses: editedSubscription?.products['COURSE']
          ? editedSubscription?.products['COURSE'].product_ids || []
          : [],
        colorCode: editedSubscription?.color_code || initialColor,
      };

      form.setFieldsValue(formData);

      setIsUnlimitedCourseCredit(isUnlimitedMembership(editedSubscription, true));
      setIsUnlimitedSessionVideoCredit(isUnlimitedMembership(editedSubscription, false));

      setCurrency(editedSubscription?.currency || 'SGD');
      setSelectedTagType(formData.subscriptionTagType);
      setSelectedMemberTag(formData.selectedMemberTag);
      setColorCode(formData.colorCode);
      setIsSessionIncluded(formData.includedProducts.includes('SESSION'));
      setSelectedSessions(formData.includedSessions);
      setIsVideoIncluded(formData.includedProducts.includes('VIDEO'));
      setSelectedVideos(formData.includedVideos);
      setIsCourseIncluded(formData.includedProducts.includes('COURSE'));
      setSelectedCourses(formData.includedCourses);
    } else {
      form.resetFields();
      setIsUnlimitedCourseCredit(false);
      setIsUnlimitedSessionVideoCredit(false);
      setIsSessionIncluded(false);
      setIsVideoIncluded(false);
      setIsCourseIncluded(false);
      setSelectedSessions([]);
      setSelectedVideos([]);
      setSelectedCourses([]);
      setColorCode(initialColor);
      setSelectedTagType('anyone');
      setSelectedMemberTag(null);
      setCurrency('');
    }

    getCreatorCurrencyDetails();
  }, [getCreatorCurrencyDetails, getCreatorProducts, form, editedSubscription]);

  const handleSubscriptionTagTypeChange = (e) => {
    if (creatorMemberTags.length > 0) {
      setSelectedTagType(e.target.value);

      if (e.target.value === 'anyone') {
        setSelectedMemberTag(null);
        form.setFieldsValue({ ...form.getFieldsValue(), selectedMemberTag: null });
      }
    } else {
      setSelectedTagType('anyone');
      form.setFieldsValue({ ...form.getFieldsValue(), subscriptionTagType: 'anyone', selectedMemberTag: null });
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

  const onSelectedTagChange = (selectedTagExternalId) => {
    setSelectedMemberTag(selectedTagExternalId ?? null);

    if (selectedTagExternalId) {
      const tempFormValues = form.getFieldsValue();

      const refilteredSessions = tempFormValues.includedProducts.includes('SESSION')
        ? sessions
            .filter((session) => tempFormValues.includedSessions.includes(session.session_external_id))
            .filter((session) => session.tags?.map((tag) => tag.external_id).includes(selectedTagExternalId) || false)
            .map((session) => session.session_external_id) || []
        : [];
      const refilteredVideos = tempFormValues.includedProducts.includes('VIDEO')
        ? videos
            .filter((video) => tempFormValues.includedVideos.includes(video.external_id))
            .filter((video) => video.tags?.map((tag) => tag.external_id).includes(selectedTagExternalId) || false)
            .map((video) => video.external_id) || []
        : [];
      const refilteredCourses = tempFormValues.includedProducts.includes('COURSE')
        ? courses
            .filter((course) => tempFormValues.includedCourses.includes(course.id))
            .filter((course) => course.tags?.map((tag) => tag.external_id).includes(selectedTagExternalId) || false)
        : [];

      setSelectedSessions(refilteredSessions);
      setSelectedVideos(refilteredVideos);
      setSelectedCourses(refilteredCourses);

      form.setFieldsValue({
        ...tempFormValues,
        includedSessions: refilteredSessions,
        includedVideos: refilteredVideos,
        includedCourses: refilteredCourses,
      });
    }
  };

  const onIncludedProductsChange = (values) => {
    setIsSessionIncluded(values.includes('SESSION'));
    setIsVideoIncluded(values.includes('VIDEO'));
    setIsCourseIncluded(values.includes('COURSE'));

    let updatedFormValues = null;

    if (!values.includes('SESSION')) {
      setSelectedSessions([]);
      updatedFormValues = {
        ...updatedFormValues,
        includedSessions: [],
      };
    }

    if (!values.includes('VIDEO')) {
      setSelectedVideos([]);
      updatedFormValues = {
        ...updatedFormValues,
        includedVideos: [],
      };
    }

    if (!values.includes('VIDEO') && !values.includes('SESSION')) {
      setIsUnlimitedSessionVideoCredit(false);
      updatedFormValues = {
        ...updatedFormValues,
        subscriptionCredits: 0,
      };
    }

    if (!values.includes('COURSE')) {
      setSelectedCourses([]);
      setIsUnlimitedCourseCredit(false);
      updatedFormValues = {
        ...updatedFormValues,
        includedCourses: [],
        courseCredits: 0,
      };
    }

    if (updatedFormValues) {
      form.setFieldsValue({ ...form.getFieldsValue(), ...updatedFormValues });
    }
  };

  const handleCancelChange = () => {
    if (editedSubscription) {
      saveChanges();
    } else {
      cancelChanges();
    }
  };

  const handleColorChange = (color) => {
    setColorCode(color.hex || defaultBorderColor);
    form.setFieldsValue({ ...form.getFieldsValue(), colorCode: color.hex || defaultBorderColor });
  };

  const handleUnlimitedSessionVideoCreditChange = (e) => {
    const isChecked = e.target.checked;

    setIsUnlimitedSessionVideoCredit(isChecked);
    form.setFieldsValue({
      ...form.getFieldsValue(),
      subscriptionCredits: isChecked ? UNLIMITED_SUBSCRIPTION_CREDIT_COUNT : 5,
    });
  };

  const handleUnlimitedCourseCreditChange = (e) => {
    const isChecked = e.target.checked;

    setIsUnlimitedCourseCredit(isChecked);
    form.setFieldsValue({
      ...form.getFieldsValue(),
      courseCredits: isChecked ? UNLIMITED_SUBSCRIPTION_CREDIT_COUNT : 5,
    });
  };

  const handleFinish = async (values) => {
    setIsSubmitting(true);

    let productsData = {};

    values.includedProducts.forEach((product) => {
      productsData[product] = {
        product_ids: product === 'SESSION' ? selectedSessions : product === 'VIDEO' ? selectedVideos : selectedCourses,
      };
    });

    try {
      let payload = {
        name: values.subscriptionName,
        price: values.price,
        validity: values.subscriptionPeriod,
        tag_id: selectedTagType === 'anyone' ? '' : values.selectedMemberTag || selectedMemberTag || '',
        color_code: values.colorCode || colorCode || defaultBorderColor,
        product_credits:
          values.includedProducts.includes('SESSION') || values.includedProducts.includes('VIDEO')
            ? isUnlimitedSessionVideoCredit
              ? UNLIMITED_SUBSCRIPTION_CREDIT_COUNT
              : values.subscriptionCredits ?? 0
            : 0,
        course_credits: values.includedProducts.includes('COURSE')
          ? isUnlimitedCourseCredit
            ? UNLIMITED_SUBSCRIPTION_CREDIT_COUNT
            : values.courseCredits ?? 0
          : 0,
        products: productsData,
      };

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
          style={{ border: `2px solid ${colorCode || defaultBorderColor}` }}
          headStyle={{
            textAlign: 'center',
            padding: '0px 10px',
            borderBottom: `2px solid ${colorCode || defaultBorderColor}`,
          }}
          title={
            <Form.Item
              className={styles.compactFormItem}
              id="subscriptionName"
              name="subscriptionName"
              rules={validationRules.nameValidation}
            >
              <Input placeholder="Enter Subscription Name" maxLength={30} />
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
                <Form.Item
                  id="price"
                  name="price"
                  rules={validationRules.numberValidation('Please Input Subscription Price', 0, false)}
                  noStyle
                >
                  {currency !== '' && !creatorAbsorbsFees ? (
                    <PriceInputCalculator
                      name="price"
                      form={form}
                      minimalPrice={1}
                      initialValue={1}
                      feePercentage={creatorFeePercentage}
                    />
                  ) : (
                    <InputNumber
                      min={1}
                      placeholder="Enter Price"
                      className={styles.numericInput}
                      disabled={currency === ''}
                    />
                  )}
                </Form.Item>
              </Form.Item>
            </List.Item>
            <List.Item>
              {/* For selecting tag */}
              <Form.Item className={styles.compactFormItem}>
                <Form.Item
                  name="subscriptionTagType"
                  rules={validationRules.requiredValidation}
                  onChange={handleSubscriptionTagTypeChange}
                  style={{ marginBottom: 8 }}
                  className={styles.inlineFormItem}
                >
                  <Radio.Group>
                    <Radio value="anyone"> Anyone </Radio>
                    <Radio value="selected"> Selected Tag </Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item className={styles.inlineFormItem}>
                  <Tooltip title="Understanding the tag options">
                    <Button
                      size="small"
                      type="link"
                      onClick={() => showTagOptionsHelperModal('subscription')}
                      icon={<InfoCircleOutlined />}
                    />
                  </Tooltip>
                </Form.Item>
              </Form.Item>
              <Form.Item
                className={styles.compactFormItem}
                name="selectedMemberTag"
                id="selectedMemberTag"
                hidden={selectedTagType === 'anyone' || creatorMemberTags.length === 0}
              >
                <Select
                  showArrow
                  allowClear
                  placeholder="Select a member tag"
                  disabled={selectedTagType === 'anyone'}
                  onChange={onSelectedTagChange}
                  options={creatorMemberTags.map((tag) => ({
                    label: (
                      <>
                        {tag.name} {tag.is_default ? <TagOutlined /> : null}
                      </>
                    ),
                    value: tag.external_id,
                  }))}
                />
              </Form.Item>
            </List.Item>
            <List.Item>
              <Form.Item className={styles.compactFormItem}>
                <Row gutter={4}>
                  <Col xs={18}>
                    <Form.Item
                      id="subscriptionPeriod"
                      name="subscriptionPeriod"
                      rules={validationRules.numberValidation('Please Input membership period duration', 1, false)}
                      noStyle
                    >
                      <InputNumber min={1} placeholder="Enter duration" className={styles.numericInput} />
                    </Form.Item>
                  </Col>
                  <Col xs={6} className={classNames(styles.textAlignCenter, styles.helpTextWrapper)}>
                    <Text strong> days </Text>
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
                className={classNames(
                  !isSessionIncluded && !isVideoIncluded ? styles.disabled : undefined,
                  styles.compactFormItem
                )}
              >
                <Row gutter={4} align="middle">
                  <Col xs={6}>
                    <Form.Item
                      id="subscriptionCredits"
                      name="subscriptionCredits"
                      rules={
                        (isSessionIncluded || isVideoIncluded) && !isUnlimitedSessionVideoCredit
                          ? validationRules.numberValidation('Please input Session/Video credits/period', 1, false)
                          : []
                      }
                      noStyle
                    >
                      <InputNumber
                        disabled={(!isVideoIncluded && !isSessionIncluded) || isUnlimitedSessionVideoCredit}
                        min={(!isVideoIncluded && !isSessionIncluded) || isUnlimitedSessionVideoCredit ? 0 : 1}
                        placeholder="Enter Session/Video credits"
                        className={styles.numericInput}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={9} className={classNames(styles.textAlignCenter, styles.helpTextWrapper)}>
                    <Text strong>credits/period</Text>
                  </Col>
                  <Col xs={9}>
                    <Checkbox
                      disabled={!isVideoIncluded && !isSessionIncluded}
                      className={styles.unlimitedCheckbox}
                      checked={isUnlimitedSessionVideoCredit}
                      onChange={handleUnlimitedSessionVideoCreditChange}
                    >
                      Unlimited?
                    </Checkbox>
                  </Col>
                </Row>
              </Form.Item>
            </List.Item>
            <List.Item>
              <Form.Item
                id="includedSessions"
                className={classNames(!isSessionIncluded ? styles.disabled : undefined, styles.compactFormItem)}
                name="includedSessions"
                rules={isSessionIncluded ? validationRules.arrayValidation : undefined}
              >
                <Select
                  showArrow
                  showSearch={false}
                  placeholder="Select included sessions"
                  mode="multiple"
                  maxTagCount={1}
                  dropdownMatchSelectWidth={false}
                  value={selectedSessions}
                  disabled={!isSessionIncluded}
                  onChange={(val) => setSelectedSessions(val)}
                  optionLabelProp="label"
                >
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Visible Publicly </Text>}
                    key="Published Sessions"
                  >
                    {sessions
                      .filter((session) => session.is_active)
                      .filter((session) =>
                        !selectedMemberTag
                          ? true
                          : session.tags?.map((tag) => tag.external_id).includes(selectedMemberTag)
                      )
                      .map((session) => (
                        <Select.Option
                          value={session.session_external_id}
                          key={session.session_external_id}
                          label={
                            <>
                              {session.bundle_only ? <BookTwoTone twoToneColor="#1890ff" /> : null} {session.name}
                            </>
                          }
                        >
                          <Row gutter={[8, 8]}>
                            <Col xs={17} className={styles.productName}>
                              {session.bundle_only ? <BookTwoTone twoToneColor="#1890ff" /> : null} {session.name}
                            </Col>
                            <Col xs={7} className={styles.textAlignRight}>
                              {session.pay_what_you_want
                                ? `min. ${session.price}`
                                : session.price > 0
                                ? `${session.currency?.toUpperCase()} ${session.price}`
                                : 'Free'}
                            </Col>
                          </Row>
                        </Select.Option>
                      ))}
                    {sessions
                      .filter((session) => session.is_active)
                      .filter((session) =>
                        !selectedMemberTag
                          ? true
                          : session.tags?.map((tag) => tag.external_id).includes(selectedMemberTag)
                      ).length <= 0 && (
                      <Select.Option disabled value="no_published_session">
                        <Text disabled> No published sessions </Text>
                      </Select.Option>
                    )}
                  </Select.OptGroup>

                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Hidden from anyone </Text>}
                    key="Unpublished Sessions"
                  >
                    {sessions
                      .filter((session) => !session.is_active)
                      .filter((session) =>
                        !selectedMemberTag
                          ? true
                          : session.tags?.map((tag) => tag.external_id).includes(selectedMemberTag)
                      )
                      .map((session) => (
                        <Select.Option
                          value={session.session_external_id}
                          key={session.session_external_id}
                          label={
                            <>
                              {session.bundle_only ? <BookTwoTone twoToneColor="#1890ff" /> : null} {session.name}
                            </>
                          }
                        >
                          <Row gutter={[8, 8]}>
                            <Col xs={17} className={styles.productName}>
                              {session.bundle_only ? <BookTwoTone twoToneColor="#1890ff" /> : null} {session.name}
                            </Col>
                            <Col xs={7} className={styles.textAlignRight}>
                              {session.pay_what_you_want
                                ? `min. ${session.price}`
                                : session.price > 0
                                ? `${session.currency?.toUpperCase()} ${session.price}`
                                : 'Free'}
                            </Col>
                          </Row>
                        </Select.Option>
                      ))}
                    {sessions
                      .filter((session) => !session.is_active)
                      .filter((session) =>
                        !selectedMemberTag
                          ? true
                          : session.tags?.map((tag) => tag.external_id).includes(selectedMemberTag)
                      ).length <= 0 && (
                      <Select.Option disabled value="no_unpublished_session">
                        <Text disabled> No unpublished sessions </Text>
                      </Select.Option>
                    )}
                  </Select.OptGroup>
                </Select>
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
                  maxTagCount={1}
                  dropdownMatchSelectWidth={false}
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
                      .filter((video) =>
                        !selectedMemberTag
                          ? true
                          : video.tags?.map((tag) => tag.external_id).includes(selectedMemberTag)
                      )
                      .map((video) => (
                        <Select.Option
                          value={video.external_id}
                          key={video.external_id}
                          label={
                            <>
                              {video.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {video.title}
                            </>
                          }
                        >
                          <Row gutter={[8, 8]}>
                            <Col xs={17} className={styles.productName}>
                              {video.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {video.title}
                            </Col>
                            <Col xs={7} className={styles.textAlignRight}>
                              {video.pay_what_you_want
                                ? `min. ${video.price}`
                                : video.price > 0
                                ? `${video.currency?.toUpperCase()} ${video.price}`
                                : 'Free'}
                            </Col>
                          </Row>
                        </Select.Option>
                      ))}
                    {videos
                      ?.filter((video) => video.is_published)
                      .filter((video) =>
                        !selectedMemberTag
                          ? true
                          : video.tags?.map((tag) => tag.external_id).includes(selectedMemberTag)
                      ).length <= 0 && (
                      <Select.Option disabled value="no_published_video">
                        <Text disabled> No published videos </Text>
                      </Select.Option>
                    )}
                  </Select.OptGroup>
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Hidden from anyone </Text>}
                    key="Unpublished Videos"
                  >
                    {videos
                      ?.filter((video) => !video.is_published)
                      .filter((video) =>
                        !selectedMemberTag
                          ? true
                          : video.tags?.map((tag) => tag.external_id).includes(selectedMemberTag)
                      )
                      .map((video) => (
                        <Select.Option
                          value={video.external_id}
                          key={video.external_id}
                          label={
                            <>
                              {video.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {video.title}
                            </>
                          }
                        >
                          <Row gutter={[8, 8]}>
                            <Col xs={17} className={styles.productName}>
                              {video.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {video.title}
                            </Col>
                            <Col xs={7} className={styles.textAlignRight}>
                              {video.pay_what_you_want
                                ? `min. ${video.price}`
                                : video.price > 0
                                ? `${video.currency?.toUpperCase()} ${video.price}`
                                : 'Free'}
                            </Col>
                          </Row>
                        </Select.Option>
                      ))}
                    {videos
                      ?.filter((video) => !video.is_published)
                      .filter((video) =>
                        !selectedMemberTag
                          ? true
                          : video.tags?.map((tag) => tag.external_id).includes(selectedMemberTag)
                      ).length <= 0 && (
                      <Select.Option disabled value="no_unpublished_video">
                        <Text disabled> No unpublished videos </Text>
                      </Select.Option>
                    )}
                  </Select.OptGroup>
                </Select>
              </Form.Item>
            </List.Item>
            <List.Item>
              <Row gutter={4} align="middle">
                <Col xs={6}>
                  <Form.Item
                    className={classNames(!isCourseIncluded ? styles.disabled : undefined, styles.compactFormItem)}
                    id="courseCredits"
                    name="courseCredits"
                    rules={
                      isCourseIncluded && !isUnlimitedCourseCredit
                        ? validationRules.numberValidation('Please input course credits', 1, false)
                        : []
                    }
                  >
                    <InputNumber
                      disabled={!isCourseIncluded || isUnlimitedCourseCredit}
                      min={!isCourseIncluded || isUnlimitedCourseCredit ? 0 : 1}
                      placeholder="Course credits/period"
                      className={styles.numericInput}
                    />
                  </Form.Item>
                </Col>
                <Col xs={9} className={classNames(styles.helpTextWrapper, styles.textAlignCenter)}>
                  <Text strong>courses/period</Text>
                </Col>
                <Col xs={9}>
                  <Checkbox
                    disabled={!isCourseIncluded}
                    className={styles.unlimitedCheckbox}
                    checked={isUnlimitedCourseCredit}
                    onChange={handleUnlimitedCourseCreditChange}
                  >
                    Unlimited?
                  </Checkbox>
                </Col>
              </Row>
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
                  maxTagCount={1}
                  dropdownMatchSelectWidth={false}
                  value={selectedCourses}
                  onChange={(val) => setSelectedCourses(val)}
                  optionLabelProp="label"
                >
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Visible Publicly </Text>}
                    key="Published Courses"
                  >
                    {courses
                      .filter((course) => course.is_published)
                      .filter((course) =>
                        !selectedMemberTag
                          ? true
                          : course.tag?.map((tag) => tag.external_id).includes(selectedMemberTag)
                      )
                      .map((course) => (
                        <Select.Option value={course.id} key={course.id} label={course.name}>
                          <Row gutter={[8, 8]}>
                            <Col xs={17}>
                              <Text ellipsis={true}>{course.name}</Text>
                            </Col>
                            <Col xs={7} className={styles.textAlignRight}>
                              {course.price > 0 ? `${course.currency.toUpperCase()} ${course.price}` : 'Free'}
                            </Col>
                          </Row>
                        </Select.Option>
                      ))}
                    {courses
                      .filter((course) => course.is_published)
                      .filter((course) =>
                        !selectedMemberTag
                          ? true
                          : course.tag?.map((tag) => tag.external_id).includes(selectedMemberTag)
                      ).length <= 0 && (
                      <Select.Option disabled value="no_published_course">
                        <Text disabled> No published courses </Text>
                      </Select.Option>
                    )}
                  </Select.OptGroup>
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Hidden from anyone </Text>}
                    key="Unpublished Courses"
                  >
                    {courses
                      .filter((course) => !course.is_published)
                      .filter((course) =>
                        !selectedMemberTag
                          ? true
                          : course.tag?.map((tag) => tag.external_id).includes(selectedMemberTag)
                      )
                      .map((course) => (
                        <Select.Option value={course.id} key={course.id} label={course.name}>
                          <Row gutter={[8, 8]}>
                            <Col xs={17}>
                              <Text ellipsis={true}>{course.name}</Text>
                            </Col>
                            <Col xs={7} className={styles.textAlignRight}>
                              {course.price > 0 ? `${course.currency.toUpperCase()} ${course.price}` : 'Free'}
                            </Col>
                          </Row>
                        </Select.Option>
                      ))}
                    {courses
                      .filter((course) => !course.is_published)
                      .filter((course) =>
                        !selectedMemberTag
                          ? true
                          : course.tag?.map((tag) => tag.external_id).includes(selectedMemberTag)
                      ).length <= 0 && (
                      <Select.Option disabled value="no_unpublished_course">
                        <Text disabled> No unpublished courses </Text>
                      </Select.Option>
                    )}
                  </Select.OptGroup>
                </Select>
              </Form.Item>
            </List.Item>
            <List.Item>
              <Form.Item className={styles.compactFormItem} id="colorCode" name="colorCode">
                <TwitterPicker
                  className={styles.colorPicker}
                  color={colorCode}
                  onChangeComplete={handleColorChange}
                  triangle="hide"
                  colors={colorPickerChoices}
                />
              </Form.Item>
            </List.Item>
          </List>
        </Card>
      </Loader>
    </Form>
  );
};

export default CreateSubscriptionCard;
