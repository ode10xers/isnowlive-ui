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
  InputNumber,
  Select,
  message,
  DatePicker,
  Modal,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import moment from 'moment';

import apis from 'apis';
import Routes from 'routes';
import Section from 'components/Section';
import Loader from 'components/Loader';
import ImageUpload from 'components/ImageUpload';
import FileUpload from 'components/FileUpload';
import OnboardSteps from 'components/OnboardSteps';
import Scheduler from 'components/Scheduler';
import TextEditor from 'components/TextEditor';
import validationRules from 'utils/validation';
import dateUtil from 'utils/date';
import { getCurrencyList, convertSchedulesToUTC, isAPISuccess, scrollToErrorField } from 'utils/helper';
import { profileFormItemLayout, profileFormTailLayout } from 'layouts/FormLayouts';
import { isMobileDevice } from 'utils/device';

import styles from './style.module.scss';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const {
  formatDate: { toUtcStartOfDay, toUtcEndOfDay, getTimeDiff },
} = dateUtil;

const initialSession = {
  price: 10,
  currency: 'SGD',
  max_participants: 0,
  group: true,
  name: '',
  description: '',
  session_image_url: '',
  inventory: [],
  document_url: '',
  beginning: moment().startOf('day').utc().format(),
  expiry: moment().add(1, 'days').startOf('day').utc().format(),
  recurring: false,
  is_refundable: true,
  refund_before_hours: 24,
  prerequisites: '',
};

const Session = ({ match, history }) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionImageUrl, setSessionImageUrl] = useState(null);
  const [sessionDocumentUrl, setSessionDocumentUrl] = useState(null);
  const [isSessionTypeGroup, setIsSessionTypeGroup] = useState(true);
  const [isSessionFree, setIsSessionFree] = useState(false);
  const [currencyList, setCurrencyList] = useState(null);
  const [sessionRefundable, setSessionRefundable] = useState(true);
  const [refundBeforeHours, setRefundBeforeHours] = useState(24);
  const [isSessionRecurring, setIsSessionRecurring] = useState(false);
  const [recurringDatesRanges, setRecurringDatesRanges] = useState([]);
  const [session, setSession] = useState(initialSession);
  const [deleteSlot, setDeleteSlot] = useState([]);
  const [isOnboarding, setIsOnboarding] = useState(true);

  const getSessionDetails = useCallback(
    async (sessionId, startDate, endDate) => {
      try {
        const { data } = await apis.session.getDetails(sessionId, startDate, endDate);
        if (data) {
          setSession(data);
          form.setFieldsValue({
            ...data,
            type: data?.max_participants >= 2 ? 'Group' : '1-on-1',
            price_type: data?.price === 0 ? 'Free' : 'Paid',
            is_refundable: data?.is_refundable ? 'Yes' : 'No',
            refund_before_hours: data?.refund_before_hours || 24,
            recurring_dates_range: data?.recurring ? [moment(data?.beginning), moment(data?.expiry)] : [],
          });
          setSessionImageUrl(data.session_image_url);
          setSessionDocumentUrl(data.document_url);
          setIsSessionTypeGroup(data?.max_participants >= 2 ? true : false);
          setIsSessionFree(data?.price === 0 ? true : false);
          setIsSessionRecurring(data?.recurring);
          setSessionRefundable(data?.is_refundable);
          setRefundBeforeHours(data?.refund_before_hours || 24);
          setRecurringDatesRanges(data?.recurring ? [moment(data?.beginning), moment(data?.expiry)] : []);
          setIsLoading(false);
        }
      } catch (error) {
        message.error(error.response?.data?.message || 'Something went wrong.');
        setIsLoading(false);
        if (isOnboarding) {
          history.push(Routes.session);
        } else {
          history.push('/creator/dashboard' + Routes.creatorDashboard.createSessions);
        }
      }
    },
    [form, history, isOnboarding]
  );

  useEffect(() => {
    if (match.path.includes('manage')) {
      setIsOnboarding(false);
    }
    if (match.params.id) {
      const startDate = toUtcStartOfDay(moment().subtract(1, 'month'));
      const endDate = toUtcEndOfDay(moment().add(1, 'month'));
      getSessionDetails(match.params.id, startDate, endDate);
    } else {
      form.setFieldsValue({
        ...form.getFieldsValue(),
        type: 'Group',
        max_participants: 2,
        price_type: 'Paid',
        recurring: false,
        price: 10,
        currency: 'SGD',
        is_refundable: 'Yes',
        refund_before_hours: 24,
      });
      setIsLoading(false);
    }
    getCurrencyList()
      .then((res) => setCurrencyList(res))
      .catch(() => message.error('Failed to load currency list'));
  }, [form, getSessionDetails, match.params.id, match.path]);

  const onSessionImageUpload = (imageUrl) => {
    setSessionImageUrl(imageUrl);
    setSession({ ...session, session_image_url: imageUrl });
  };

  const handleDocumentUrlUpload = (imageUrl) => {
    setSessionDocumentUrl(imageUrl);
    setSession({ ...session, document_url: imageUrl });
  };

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  const handleSessionType = (e) => {
    if (e.target.value === '1-on-1') {
      form.setFieldsValue({ ...form.getFieldsValue(), max_participants: 1 });
      setSession({ ...session, max_participants: 1 });
      setIsSessionTypeGroup(false);
    } else {
      form.setFieldsValue({ ...form.getFieldsValue(), max_participants: 2 });
      setIsSessionTypeGroup(true);
    }
  };

  const handleSessionPriceType = (e) => {
    if (e.target.value === 'Free') {
      form.setFieldsValue({ ...form.getFieldsValue(), price: 0 });
      setSession({ ...session, price: 0 });
      setIsSessionFree(true);
    } else {
      setIsSessionFree(false);
    }
  };

  const handleSessionRefundable = (e) => {
    if (e.target.value === 'Yes') {
      setSessionRefundable(true);
    } else {
      setSessionRefundable(false);
      setRefundBeforeHours(24);
      form.setFieldsValue({ ...form.getFieldsValue(), refund_before_hours: 24 });
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
    form.setFieldsValue({ ...form.getFieldsValue(), recurring_dates_range: value });
  };

  const handleSlotsChange = (inventory) => {
    setSession({
      ...session,
      inventory,
    });
  };

  const handleSlotDelete = (value) => {
    let tempDeleteSlots = deleteSlot;
    tempDeleteSlots.push(value);
    tempDeleteSlots = tempDeleteSlots.filter((item, index) => tempDeleteSlots.indexOf(item) === index);
    setDeleteSlot(tempDeleteSlots);
  };

  const handleRefundBeforeHoursChange = (e) => {
    setRefundBeforeHours(e.target.value);
    form.setFieldsValue({ ...form.getFieldsValue(), refund_before_hours: e.target.value });
  };

  //TODO: Will have to change here to match new API payload
  const onFinish = async (values) => {
    try {
      setIsLoading(true);
      const data = {
        price: values.price,
        currency: values.currency,
        max_participants: values.max_participants,
        name: values.name,
        description: values.description,
        prerequisites: values.prerequisites,
        session_image_url: sessionImageUrl || '',
        category: '',
        document_url: sessionDocumentUrl || '',
        recurring: isSessionRecurring,
        is_refundable: sessionRefundable,
        refund_before_hours: refundBeforeHours,
      };
      console.log(data);
      if (isSessionRecurring) {
        data.beginning = moment(values.recurring_dates_range[0]).utc().format();
        data.expiry = moment(values.recurring_dates_range[1]).utc().format();
      }

      if (session?.inventory?.length) {
        let allInventoryList = convertSchedulesToUTC(session.inventory);
        data.inventory = allInventoryList.filter((slot) => getTimeDiff(slot.session_date, moment(), 'minutes') > 0);
        if (deleteSlot && deleteSlot.length) {
          await apis.session.delete(JSON.stringify(deleteSlot));
        }
        if (session.session_id) {
          await apis.session.update(session.session_id, data);
          message.success('Session successfully updated.');
          const startDate = toUtcStartOfDay(moment().subtract(1, 'month'));
          const endDate = toUtcEndOfDay(moment().add(1, 'month'));
          getSessionDetails(match.params.id, startDate, endDate);
        } else {
          const newSessionResponse = await apis.session.create(data);

          if (isAPISuccess(newSessionResponse.status)) {
            Modal.confirm({
              title: `${newSessionResponse.data.name} session successfully created`,
              className: styles.confirmModal,
              okText: 'Add New',
              cancelText: 'Done',
              onOk: () => {
                window.location.reload();
                window.scrollTo(0, 0);
              },
              onCancel: () => history.push(`${Routes.creatorDashboard.rootPath}/${newSessionResponse.defaultPath}`),
            });
          }
        }
        setIsLoading(false);
      } else {
        setIsLoading(false);
        message.error('Need at least 1 sesssion to publish');
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  const onFinishFailed = ({ errorFields }) => {
    scrollToErrorField(errorFields);
  };

  const handleCalenderPop = () => {
    if (isMobileDevice && document.getElementsByClassName('ant-picker-panels')[0]) {
      document.getElementsByClassName('ant-picker-panels')[0].style.display = 'block';
      document.getElementsByClassName('ant-picker-panels')[0].style['text-align'] = 'center';
    }
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading profile">
      {isOnboarding ? (
        <OnboardSteps current={2} />
      ) : (
        <Row>
          <Col span={24}>
            <Button
              className={styles.headButton}
              onClick={() => history.push('/creator/dashboard/manage/sessions')}
              icon={<ArrowLeftOutlined />}
            >
              Sessions
            </Button>
          </Col>
        </Row>
      )}
      <Space size="middle" className={!isOnboarding && styles.mt30}>
        <Typography>
          <Title>{session.session_id ? 'Update' : 'Create'} Session</Title>
          <Paragraph>
            Ornare ipsum cras non egestas risus, tincidunt malesuada potenti suspendisse mauris id consectetur sit
            ultrices nunc, ut ac montes, proin diam elit, tristique vitae
          </Paragraph>
        </Typography>
      </Space>

      <Form form={form} {...profileFormItemLayout} onFinish={onFinish} onFinishFailed={onFinishFailed}>
        {/* ========= SESSION INFORMATION ======== */}
        <Section>
          <Title level={4}>1. Primary Information</Title>

          <div className={styles.imageWrapper}>
            <ImageUpload
              aspect={4}
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

          <Form.Item
            className={styles.bgWhite}
            label="Session Description"
            name="description"
            rules={validationRules.requiredValidation}
          >
            <TextEditor name="description" form={form} placeholder="Please input description" />
          </Form.Item>
          <Form.Item
            name="document_url"
            {...(!isMobileDevice && profileFormTailLayout)}
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Text>or upload a session pre-requisite document</Text>
            <br />
            <br />
            <FileUpload
              name="document_url"
              value={sessionDocumentUrl}
              onChange={handleDocumentUrlUpload}
              listType="text"
              label="Upload a PDF file"
            />
          </Form.Item>

          <Form.Item className={styles.bgWhite} label="Session Pre-requisite" name="prerequisites">
            <TextEditor name="prerequisites" form={form} placeholder="Please input session pre-requisite" />
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

            {isSessionTypeGroup && (
              <Form.Item
                {...(!isMobileDevice && profileFormTailLayout)}
                name="max_participants"
                help="Maximum 100 supported"
                rules={validationRules.requiredValidation}
              >
                <InputNumber min={2} max={100} />
              </Form.Item>
            )}
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

            {!isSessionFree && (
              <>
                <Form.Item name="currency" label="Currency" rules={validationRules.requiredValidation}>
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
                  {...(!isMobileDevice && profileFormTailLayout)}
                  name="price"
                  help="Set your price"
                  rules={validationRules.requiredValidation}
                >
                  <InputNumber min={1} placeholder="Amount" />
                </Form.Item>
              </>
            )}

            {!isSessionFree && (
              <Form.Item
                name="is_refundable"
                label="Refundable"
                rules={validationRules.requiredValidation}
                onChange={handleSessionRefundable}
              >
                <Radio.Group>
                  <Radio value="Yes">Yes</Radio>
                  <Radio value="No">No</Radio>
                </Radio.Group>
              </Form.Item>
            )}

            {!isSessionFree && sessionRefundable && (
              <>
                <Form.Item
                  {...(!isMobileDevice && profileFormItemLayout)}
                  label="Cancellable Before"
                  name="refund_before_hours"
                  help="A customer can cancel and get a refund for this order if they cancel before the hours you have inputed above"
                  rules={validationRules.requiredValidation}
                  onChange={handleRefundBeforeHoursChange}
                >
                  <InputNumber value={refundBeforeHours} min={0} placeholder="Hours limit" />
                  <span className="ant-form-text"> hour(s) before the session starts </span>
                </Form.Item>
              </>
            )}
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

          {isSessionRecurring && (
            <Form.Item
              rules={isSessionRecurring ? validationRules.requiredValidation : null}
              name="recurring_dates_range"
              {...(!isMobileDevice && profileFormTailLayout)}
              layout="vertical"
            >
              <Text>First Session Date: </Text>
              <Text className={isMobileDevice ? styles.ml5 : styles.ml30}> Last Session Date:</Text> <br />
              <RangePicker
                className={styles.rangePicker}
                defaultValue={recurringDatesRanges}
                disabledDate={disabledDate}
                onChange={handleRecurringDatesRange}
                onFocus={handleCalenderPop}
              />
            </Form.Item>
          )}
          <Scheduler
            sessionSlots={session?.inventory || []}
            recurring={isSessionRecurring}
            recurringDatesRange={recurringDatesRanges}
            handleSlotsChange={handleSlotsChange}
            handleSlotDelete={handleSlotDelete}
          />
        </Section>

        {/* ========= CREATE SESSION ============= */}
        <Section>
          <Row justify="center">
            <Col flex={4}>
              <Title level={4} className={styles.scheduleCount}>
                {session?.inventory?.length || 0} Schedules will be created
              </Title>
            </Col>
            <Col className={styles.publishBtnWrapper} flex={isMobileDevice ? 'auto' : 1}>
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
