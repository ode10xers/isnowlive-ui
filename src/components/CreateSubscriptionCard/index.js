import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Form, Card, List, Button, Select, Input, InputNumber, Typography } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import { showErrorModal } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { isAPISuccess } from 'utils/helper';

import { subscriptionModalFormLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';

const formInitialValues = {};

const { Text, Paragraph } = Typography;

//TODO: Refactor this to be a card
const CreateSubscriptionCard = ({ cancelChanges, editedSubscription = null }) => {
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

  const handleFinish = async (values) => {
    setIsSubmitting(true);
    console.log(values);
    setIsSubmitting(false);
  };

  const generateProductTypeOptions = (type) => [
    {
      value: 'public',
      label: `Public ${type}`,
    },
    {
      value: 'member',
      label: `Members Only ${type}`,
    },
  ];

  const productInclusionSelection = [
    {
      key: 'Session',
      name: 'Sessions',
      formName: 'includedSessions',
    },
    {
      key: 'Video',
      name: 'Videos',
      formName: 'includedVideos',
    },
    {
      key: 'Course',
      name: 'Courses',
      formName: 'includedCourse',
    },
  ];

  return (
    <Card
      headStyle={{ textAlign: 'center' }}
      title={<Text strong> {editedSubscription ? 'Edit' : 'Create'} Subscription </Text>}
      bodyStyle={{ padding: '0px 10px' }}
      actions={[
        <Button type="default" onClick={() => cancelChanges()} loading={isLoading}>
          Cancel
        </Button>,
        <Button type="primary" className={styles.saveBtn} htmlType="submit" loading={isLoading}>
          Save
        </Button>,
      ]}
    >
      <Loader size="large" loading={isLoading}>
        <Form
          layout="horizontal"
          name="SubscriptionForm"
          form={form}
          onFinish={handleFinish}
          initialValues={formInitialValues}
          scrollToFirstError={true}
        >
          <List size="large" itemLayout="vertical">
            <List.Item>
              <Form.Item
                {...subscriptionModalFormLayout}
                id="subscriptionName"
                name="subscriptionName"
                rules={validationRules.nameValidation}
              >
                <Input placeholder="Enter Subscription Name" maxLength={50} />
              </Form.Item>
            </List.Item>
            <List.Item>
              <Form.Item {...subscriptionModalFormLayout} required={true}>
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
                      This will be the price charged to the customer{' '}
                      <Text className={styles.blueText} strong>
                        {' '}
                        every 30 days{' '}
                      </Text>{' '}
                      if they choose to buy this subscription.
                    </Paragraph>
                  </Col>
                </Row>
              </Form.Item>
            </List.Item>
            <List.Item>
              <Form.Item
                {...subscriptionModalFormLayout}
                id="subscriptionCredits"
                name="subscriptionCredits"
                rules={validationRules.numberValidation('Please Input Base Credits/Month', 1, false)}
              >
                <InputNumber min={1} placeholder="Credits/Month" className={styles.numericInput} />
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
        </Form>
      </Loader>
    </Card>
  );
};

export default CreateSubscriptionCard;
