import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';

import { Row, Col, Form, Card, List, Button, Input, InputNumber, Typography, Checkbox } from 'antd';

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
    value: 'session',
  },
  {
    label: 'Videos',
    value: 'video',
  },
];

const productAccessOptions = [
  {
    value: 'public',
    label: 'Public',
  },
  {
    value: 'membership',
    label: 'Members',
  },
];

const CreateSubscriptionCard = ({ cancelChanges, saveChanges, editedSubscription = null }) => {
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setIsSubmitting] = useState(false);
  const [isSessionIncluded, setIsSessionIncluded] = useState(false);
  const [isVideoIncluded, setIsVideoIncluded] = useState(false);
  const [isCourseIncluded, setIsCourseIncluded] = useState(false);
  const [currency, setCurrency] = useState('SGD');

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
    fetchCreatorCurrency();
  }, [fetchCreatorCurrency]);

  const onIncludedProductsChange = (values) => {
    setIsSessionIncluded(values.includes('session'));
    setIsVideoIncluded(values.includes('video'));

    let updatedFormValues = null;

    if (!values.includes('session')) {
      updatedFormValues = {
        ...updatedFormValues,
        includedSessions: [],
      };
    }

    if (!values.includes('video')) {
      updatedFormValues = {
        ...updatedFormValues,
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
    console.log(values);

    const response = {
      id: 2021,
      name: values.subscriptionName,
      price: values.price,
      currency: currency,
      base_credits: values.subscriptionCredits,
      product_applicable: values.includedProducts,
      included_session_type: 'PUBLIC',
      included_video_type: 'MEMBERSHIP',
      include_course: false,
    };

    saveChanges(response);
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
            <Button type="default" onClick={() => cancelChanges()} loading={submitting}>
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
                <Row gutter={8}>
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
                  <Col xs={8} className={styles.textAlignCenter}>
                    <Text strong className={styles.currencyWrapper}>
                      {currency?.toUpperCase()}
                    </Text>
                  </Col>
                </Row>
              </Form.Item>
            </List.Item>
            <List.Item>
              <Form.Item
                className={styles.compactFormItem}
                id="subscriptionCredits"
                name="subscriptionCredits"
                rules={validationRules.numberValidation('Please Input Base Credits/Month', 1, false)}
              >
                <InputNumber min={1} placeholder="Credits/Month" className={styles.numericInput} />
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
                id="includedSessions"
                name="includedSessions"
                rules={isSessionIncluded ? validationRules.arrayValidation : undefined}
              >
                <Checkbox.Group disabled={!isSessionIncluded} options={productAccessOptions} />
              </Form.Item>
            </List.Item>
            <List.Item>
              <Form.Item
                className={classNames(!isVideoIncluded ? styles.disabled : undefined, styles.compactFormItem)}
                id="includedVideos"
                name="includedVideos"
                rules={isVideoIncluded ? validationRules.arrayValidation : undefined}
              >
                <Checkbox.Group disabled={!isVideoIncluded} options={productAccessOptions} />
              </Form.Item>
            </List.Item>
            <List.Item>
              <Row justify="center" align="center">
                <Col>
                  <Form.Item className={styles.compactFormItem} id="shouldIncludeCourse" name="shouldIncludeCourse">
                    <Checkbox defaultChecked={false} onChange={onShouldIncludeCourseChange}>
                      Include Courses
                    </Checkbox>
                  </Form.Item>
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
                <Checkbox.Group disabled={!isCourseIncluded} options={productAccessOptions} />
              </Form.Item>
            </List.Item>
            <List.Item>
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
            </List.Item>
          </List>
          {/* <Row className={styles.subsRow} gutter={[8, 16]}>
            <Col xs={24}>
              <Form.Item
                {...subscriptionModalFormLayout}
                id="subscriptionName"
                name="subscriptionName"
                label="Subscription Name"
                rules={validationRules.nameValidation}
              >
                <Input placeholder="Enter Subscription Name" maxLength={50} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item {...subscriptionModalFormLayout} label="Subscription Price" required={true}>
                <Row gutter={8}>
                  <Col xs={20}>
                    <Form.Item
                      id="price"
                      name="price"
                      rules={validationRules.numberValidation('Please Input Subscription Price', 1, false)}
                      noStyle
                    >
                      <InputNumber min={1} placeholder="Subscription Price" className={styles.numericInput} />
                    </Form.Item>
                  </Col>
                  <Col xs={4} className={styles.textAlignCenter}>
                    <Text strong className={styles.currencyWrapper}>
                      {currency?.toUpperCase()}
                    </Text>
                  </Col>
                  <Col xs={24}>
                    <Paragraph className={styles.blueText}>
                      This will be the price charged to the customer <Text className={styles.blueText} strong> every 30 days </Text> if they
                      choose to buy this subscription.
                    </Paragraph>
                  </Col>
                </Row>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item 
                {...subscriptionModalFormLayout}
                id="subscriptionCredits"
                name="subscriptionCredits"
                label="Subscription Credits/Month"
                rules={validationRules.numberValidation('Please Input Base Credits/Month', 1, false)}
              >
                <InputNumber min={1} placeholder="Credits/Month" className={styles.numericInput} />
              </Form.Item>
            </Col>
            {productInclusionSelection.map((productType) => (
              <Col xs={24}>
                <Form.Item
                  {...subscriptionModalFormLayout}
                  id={productType.formName}
                  name={productType.formName}
                  label={`Included ${productType.key} Type(s)`}
                >
                  <Select 
                    showArrow
                    showSearch={false}
                    mode="multiple"
                    maxTagCount={2}
                    options={generateProductTypeOptions(productType.name)}
                    placeholder={`Select ${productType.key} Type(s)`}
                  />
                </Form.Item>
              </Col>
            ))}
          </Row> */}
          {/* <Row justify="end" align="center" gutter={8} className={styles.modalActionRow}>
            <Col xs={12} md={6}>
              <Button block type="default" onClick={() => closeModal(false)} loading={submitting}>
                Cancel
              </Button>
            </Col>
            <Col xs={12} md={8}>
              <Button block type="primary" htmlType="submit" loading={submitting}>
                {editedSubscription ? 'Update' : 'Create'} Subscription
              </Button>
            </Col>
          </Row> */}
        </Card>
      </Loader>
    </Form>
  );
};

export default CreateSubscriptionCard;
