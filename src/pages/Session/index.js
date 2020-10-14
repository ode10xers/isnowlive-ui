import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import {
  Form,
  Typography,
  Button,
  Space,
  Row,
  Col,
  Input,
  Radio,
  Upload,
  InputNumber,
  Select,
  message,
  DatePicker,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import moment from 'moment';
import apis from 'apis';

import Section from '../../components/Section';
import Loader from '../../components/Loader';
import ImageUpload from '../../components/ImageUpload';
import OnboardSteps from '../../components/OnboardSteps';
import Scheduler from '../../components/Scheduler';
import validationRules from '../../utils/validation';
import { getCurrencyList } from '../../utils/helper';
import { profileFormItemLayout, profileFormTailLayout } from '../../layouts/FormLayouts';
import Routes from '../../routes';

import styles from './style.module.scss';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const initialSession = {
  price: 0,
  currency: 'USD',
  max_participants: 0,
  group: true,
  name: '',
  description: '',
  session_image_url: '',
  category: '',
  sub_category: '',
  duration: 0,
  schedules: [],
  document_url: '',
  beginning: '',
  expiry: '',
  recurring: false,
  rating: 0,
  total_ratings: 0,
  prerequisites: '',
  total_bookings: 0,
  package_available: true,
  is_under_membership: false,
};

const Session = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [sessionImageUrl, setSessionImageUrl] = useState(null);
  const [isSessionTypeGroup, setIsSessionTypeGroup] = useState(true);
  const [isSessionFree, setIsSessionFree] = useState(true);
  const [currencyList, setCurrencyList] = useState(null);
  const [isSessionRecurring, setIsSessionRecurring] = useState(false);
  const [recurringDatesRanges, setRecurringDatesRanges] = useState([]);
  const [session, setSession] = useState(initialSession);
  const [form] = Form.useForm();

  const getSessionDetails = useCallback(
    async (sessionId) => {
      try {
        const { data } = await apis.session.getDetails(sessionId);
        if (data?.session) {
          setSession(data.session);
          form.setFieldsValue({
            ...data.session,
            type: data?.session?.max_participants >= 2 ? 'Group' : '1-on-1',
            price_type: data?.session?.price === 0 ? 'Free' : 'Paid',
            recurring_dates_range: data?.session?.recurring
              ? [moment(data?.session?.beginning), moment(data?.session?.expiry)]
              : [],
          });
          setSessionImageUrl(data.session.session_image_url);
          setIsSessionTypeGroup(data?.session?.max_participants >= 2 ? true : false);
          setIsSessionFree(data?.session?.price === 0 ? true : false);
          setIsSessionRecurring(data?.session?.recurring);
          setRecurringDatesRanges(
            data?.session?.recurring ? [moment(data?.session?.beginning), moment(data?.session?.expiry)] : []
          );
          setIsLoading(false);
        }
      } catch (error) {
        message.error(error.response?.data?.message || 'Something went wrong.');
        setIsLoading(false);
        history.push(Routes.session);
      }
    },
    [form, history]
  );

  useEffect(() => {
    if (match.params.id) {
      getSessionDetails(match.params.id);
    } else {
      form.setFieldsValue({
        ...form.getFieldsValue(),
        type: 'Group',
        max_participants: 2,
        price_type: 'Free',
        recurring: false,
        price: 0,
        currency: 'USD',
      });
      setIsLoading(false);
    }
    getCurrencyList()
      .then((res) => setCurrencyList(res))
      .catch(() => message.error('Failed to load currency list'));
  }, [form, getSessionDetails, match.params.id]);

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

  const handleSessionRecurrance = (e) => {
    if (e.target.value === 'true') {
      setIsSessionRecurring(true);
    } else {
      setIsSessionRecurring(false);
    }
    setRecurringDatesRanges([]);
  };

  const disabledDate = (current) => {
    return current && current < moment().startOf('day');
  };

  const handleRecurringDatesRange = (value) => {
    setRecurringDatesRanges(value);
  };

  const handleSlotsChange = (schedules) => {
    setSession({
      ...session,
      schedules,
    });
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
                    <Option value={key} key={key}>
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
            onChange={handleSessionRecurrance}
          >
            <Radio.Group>
              <Radio value={false}>One Time Session</Radio>
              <Radio value={true}>Repeating Sessions</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            hidden={!isSessionRecurring}
            rules={isSessionRecurring ? validationRules.requiredValidation : null}
            name="recurring_dates_range"
            {...profileFormTailLayout}
            layout="vertical"
          >
            <Text>First Session Date: </Text>
            <Text className={styles.ml30}> Last Session Date:</Text> <br />
            <RangePicker
              defaultValue={recurringDatesRanges}
              disabledDate={disabledDate}
              onChange={handleRecurringDatesRange}
            />
          </Form.Item>
          <Scheduler
            sessionSlots={session.schedules}
            recurring={isSessionRecurring}
            recurringDatesRange={recurringDatesRanges}
            handleSlotsChange={handleSlotsChange}
          />
        </Section>

        {/* ========= CREATE SESSION ============= */}
        <Section>
          <Row justify="center">
            <Col flex={4}>
              <Title level={4} className={styles.scheduleCount}>
                {session?.schedules.length} Schedules will be created
              </Title>
            </Col>
            <Col flex={1}>
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
