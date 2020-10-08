import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { Form, Typography, Button, Space, Row, Col, Input, Radio, Upload, InputNumber, Select, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

import Section from '../../components/Section';
import Loader from '../../components/Loader';
import ImageUpload from '../../components/ImageUpload';
import OnboardSteps from '../../components/OnboardSteps';
import Scheduler from '../../components/Scheduler';
import validationRules from '../../utils/validation';
import { getCurrencyList } from '../../utils/helper';
import { profileFormItemLayout, profileFormTailLayout } from '../../layouts/FormLayouts';

import styles from './style.module.scss';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const Session = () => {
  const [isLoading] = useState(false);
  const [sessionImageUrl, setSessionImageUrl] = useState(null);
  const [isSessionTypeGroup, setIsSessionTypeGroup] = useState(true);
  const [isSessionFree, setIsSessionFree] = useState(true);
  const [currencyList, setCurrencyList] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      ...form.getFieldsValue(),
      type: 'Group',
      max_participants: 2,
      price_type: 'Free',
      recurring: false,
    });
    getCurrencyList()
      .then((res) => setCurrencyList(res))
      .catch(() => message.error('Failed to load currency list'));
  }, [form]);

  const onFinish = (values) => {
    console.log(values);
  };

  const onSessionImageUpload = ({ fileList: newFileList }) => {
    setSessionImageUrl(newFileList[0]);
  };

  const normFile = (e) => {
    console.log('Upload event:', e);
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  const handleSessionType = (e) => {
    if (e.target.value === '1-on-1') {
      form.setFieldsValue({ ...form.getFieldsValue(), max_participants: 1 });
      setIsSessionTypeGroup(false);
    } else {
      form.setFieldsValue({ ...form.getFieldsValue(), max_participants: 2 });
      setIsSessionTypeGroup(true);
    }
  };

  const handleSessionPriceType = (e) => {
    if (e.target.value === 'Free') {
      form.setFieldsValue({ ...form.getFieldsValue(), price: 0 });
      setIsSessionFree(true);
    } else {
      setIsSessionFree(false);
    }
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading profile">
      <OnboardSteps current={2} />
      <Space size="middle">
        <Typography>
          <Title>Create Session</Title>
          <Paragraph>
            Ornare ipsum cras non egestas risus, tincidunt malesuada potenti suspendisse mauris id consectetur sit
            ultrices nunc, ut ac montes, proin diam elit, tristique vitae
          </Paragraph>
        </Typography>
      </Space>

      <Form form={form} {...profileFormItemLayout} onFinish={onFinish}>
        {/* ========= SESSION INFORMATION ======== */}
        <Section>
          <Title level={4}>1. Primary Information</Title>

          <div className={styles.imageWrapper}>
            <ImageUpload
              aspect={2}
              className={classNames('avatar-uploader', styles.coverImage)}
              name="session_image_url"
              action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
              onChange={onSessionImageUpload}
              value={sessionImageUrl}
              label="Session Image"
            />
          </div>

          <Form.Item label="Session Name" name="name" rules={validationRules.nameValidation}>
            <Input placeholder="Enter Session Name" />
          </Form.Item>

          <Form.Item label="Session Description" name="description" rules={validationRules.requiredValidation}>
            <Input.TextArea rows={4} placeholder="Please input description" />
          </Form.Item>
          <Form.Item
            name="document_url"
            {...profileFormTailLayout}
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Text>or upload a session pre-requisite document</Text>
            <br />
            <br />
            <Upload name="document_url" action="https://www.mocky.io/v2/5cc8019d300000980a055e76" listType="text">
              <Button icon={<UploadOutlined />}>Upload a PDF file</Button>
            </Upload>
          </Form.Item>

          <Form.Item label="Session Pre-requisite" name="prerequisites">
            <Input.TextArea rows={4} placeholder="Please input session pre-requisite" />
          </Form.Item>

          {/* ---- Session Type ---- */}
          <>
            <Form.Item
              name="type"
              label="Session Type"
              rules={validationRules.requiredValidation}
              onChange={handleSessionType}
            >
              <Radio.Group>
                <Radio value="Group">Group Session</Radio>
                <Radio value="1-on-1">1-on-1 Session</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              hidden={!isSessionTypeGroup}
              {...profileFormTailLayout}
              name="max_participants"
              help="Maximum 100 supported"
              rules={validationRules.requiredValidation}
            >
              <InputNumber min={2} max={100} />
            </Form.Item>
          </>

          {/* ---- Session Price ---- */}
          <>
            <Form.Item
              name="price_type"
              label="Session Price"
              rules={validationRules.requiredValidation}
              onChange={handleSessionPriceType}
            >
              <Radio.Group>
                <Radio value="Paid">Paid</Radio>
                <Radio value="Free">Free</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              hidden={isSessionFree}
              name="currency"
              label="Currency"
              rules={validationRules.requiredValidation}
            >
              <Select value={form.getFieldsValue().currency}>
                {currencyList &&
                  Object.entries(currencyList).map(([key, value], i) => (
                    <Option value={key}>
                      ({key}) {value}
                    </Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item
              hidden={isSessionFree}
              {...profileFormTailLayout}
              name="price"
              help="Set your price"
              rules={validationRules.requiredValidation}
            >
              <InputNumber min={1} placeholder="Amount" />
            </Form.Item>
          </>
        </Section>

        {/* ========= SESSION SCHEDULE =========== */}
        <Section>
          <Title level={4}>2. Session Schedule</Title>

          <Form.Item
            name="recurring"
            label="Session Recurrance"
            rules={validationRules.requiredValidation}
            onChange={handleSessionType}
          >
            <Radio.Group>
              <Radio value={false}>Single One Time Session</Radio>
              <Radio value={true}>Repeating Multiple Sessions</Radio>
            </Radio.Group>
          </Form.Item>

          <Scheduler />
        </Section>

        {/* ========= CREATE SESSION ============= */}
        <Section>
          <Row justify="center">
            <Col>
              <Form.Item>
                <Button htmlType="submit" type="primary">
                  Publish
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Section>
      </Form>
    </Loader>
  );
};

export default Session;
