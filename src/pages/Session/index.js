import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
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

import {
  mixPanelEventTags,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';

import styles from './style.module.scss';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const {
  formatDate: { toUtcStartOfDay, toUtcEndOfDay, getTimeDiff },
  timezoneUtils: { getCurrentLongTimezone },
} = dateUtil;
const { creator } = mixPanelEventTags;

const initialSession = {
  price: 0,
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
  const location = useLocation();
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
  const [stripeCurrency, setStripeCurrency] = useState(null);

  const getCreatorStripeDetails = useCallback(
    async (sessionData = null) => {
      try {
        setIsLoading(true);
        const { status, data } = await apis.session.getCreatorBalance();
        if (isAPISuccess(status) && data) {
          setStripeCurrency(data.currency);
          if (!sessionData) {
            form.setFieldsValue({
              ...form.getFieldsValue(),
              price_type: 'Paid',
              currency: data?.currency?.toUpperCase() || 'SGD',
              price: 10,
            });
            setIsSessionFree(false);
          }
        }
        setIsLoading(false);
      } catch (error) {
        if (error.response?.data?.message === 'unable to fetch user payment details') {
          setStripeCurrency(null);
          form.setFieldsValue({
            ...form.getFieldsValue(),
            price_type: 'Free',
            price: 0,
            currency: 'SGD',
          });
          setIsSessionFree(true);
        } else {
          message.error(error.response?.data?.message || 'Something went wrong.');
        }
        setIsLoading(false);
      }
    },
    [form]
  );

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
          await getCreatorStripeDetails(data);
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
    [form, history, isOnboarding, getCreatorStripeDetails]
  );

  useEffect(() => {
    if (match.path.includes('manage')) {
      setIsOnboarding(false);
    }
    if (match.params.id) {
      const startDate = location.state.beginning
        ? toUtcStartOfDay(moment(location.state.beginning))
        : toUtcStartOfDay(moment().subtract(1, 'month'));
      const endDate = location.state.expiry
        ? toUtcEndOfDay(moment(location.state.expiry))
        : toUtcEndOfDay(moment().add(1, 'month'));
      getSessionDetails(match.params.id, startDate, endDate);
    } else {
      getCreatorStripeDetails();
      form.setFieldsValue({
        ...form.getFieldsValue(),
        type: 'Group',
        max_participants: 2,
        recurring: false,
        is_refundable: 'Yes',
        refund_before_hours: 24,
      });
      setIsLoading(false);
    }
    getCurrencyList()
      .then((res) => setCurrencyList(res))
      .catch(() => message.error('Failed to load currency list'));
  }, [form, location, getSessionDetails, match.params.id, match.path, getCreatorStripeDetails]);

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
    const setFreeSession = () => {
      form.setFieldsValue({ ...form.getFieldsValue(), price_type: 'Free', price: 0 });
      setSession({ ...session, price: 0 });
      setIsSessionFree(true);
    };

    if (e.target.value === 'Free') {
      setFreeSession();
    } else {
      if (stripeCurrency) {
        setIsSessionFree(false);
      } else {
        Modal.confirm({
          title: `The session cannot be paided untill you setup stripe account. Would you like to setup stripe account now?`,
          okText: 'Yes, Setup stripe account now',
          cancelText: 'No',
          onCancel: () => setFreeSession(),
          onOk: () => {
            history.push(`${Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount}`);
          },
        });
      }
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
    const value = Math.max(1, parseInt(e.target.value));

    setRefundBeforeHours(value);
    form.setFieldsValue({ ...form.getFieldsValue(), refund_before_hours: value });
  };

  const onFinish = async (values) => {
    const eventTagObject = creator.click.sessions.form;

    try {
      setIsLoading(true);
      const data = {
        price: values.price || 0,
        currency: values.currency || stripeCurrency || 'SGD',
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
        user_timezone_offset: new Date().getTimezoneOffset(),
        user_timezone: getCurrentLongTimezone(),
      };
      if (isSessionRecurring) {
        data.beginning = moment(values.recurring_dates_range[0]).utc().format();
        data.expiry = moment(values.recurring_dates_range[1]).utc().format();
      }

      if (session?.inventory?.length) {
        let allInventoryList = convertSchedulesToUTC(session.inventory);
        data.inventory = allInventoryList.filter(
          (slot) => getTimeDiff(slot.session_date, moment(), 'minutes') > 0 && slot.num_participants === 0
        );
        if (deleteSlot && deleteSlot.length) {
          await apis.session.delete(JSON.stringify(deleteSlot));
        }
        if (session.session_id) {
          await apis.session.update(session.session_id, data);
          trackSuccessEvent(eventTagObject.submitUpdate, { form_values: values });
          message.success('Session successfully updated.');
          const startDate = data.beginning || toUtcStartOfDay(moment().subtract(1, 'month'));
          const endDate = data.expiry || toUtcEndOfDay(moment().add(1, 'month'));
          getSessionDetails(match.params.id, startDate, endDate);
        } else {
          const newSessionResponse = await apis.session.create(data);

          if (isAPISuccess(newSessionResponse.status)) {
            trackSuccessEvent(eventTagObject.submitNewSession, { form_values: values });

            Modal.confirm({
              icon: <CheckCircleOutlined />,
              title: `${newSessionResponse.data.name} session successfully created`,
              className: styles.confirmModal,
              okText: 'Done',
              cancelText: 'Add New',
              onCancel: () => {
                trackSimpleEvent(eventTagObject.addNewInModal);
                window.location.reload();
                window.scrollTo(0, 0);
              },
              onOk: () => {
                trackSimpleEvent(eventTagObject.doneInModal);
                history.push(`${Routes.creatorDashboard.rootPath}/${newSessionResponse.defaultPath}`);
              },
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

      trackFailedEvent(session.session_id ? eventTagObject.submitUpdate : eventTagObject.submitNewSession, error, {
        form_values: values,
      });
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

  const trackAndNavigate = (destination, eventTag) => {
    trackSimpleEvent(eventTag);
    history.push(destination);
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
              onClick={() =>
                trackAndNavigate(
                  '/creator/dashboard/manage/sessions',
                  creator.click.sessions.manage.backToManageSessionsList
                )
              }
              icon={<ArrowLeftOutlined />}
            >
              Sessions
            </Button>
          </Col>
        </Row>
      )}
      <Space size="middle" className={!isOnboarding && styles.mt30}>
        <Typography>
          <Title level={isMobileDevice ? 3 : 1} className={styles.titleText}>
            {session.session_id ? 'Update' : 'Create'} Session
          </Title>
          {isOnboarding && <a href={Routes.creatorDashboard.rootPath}>Do it later</a>}
          <Paragraph className={styles.mt10} type="secondary">
            Setup the event you plan to host. Adding a name, session image and description for the attendees is
            mandatory and you can also add pre-requisit or a document to make it more descriptive. Then select the days
            and time you want to host this session.
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
            className={classNames(styles.bgWhite, styles.textEditorLayout)}
            label="Session Description"
            name="description"
            rules={validationRules.requiredValidation}
          >
            <TextEditor name="description" form={form} placeholder="  Please input description" />
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

          <Form.Item
            className={classNames(styles.bgWhite, styles.textEditorLayout)}
            label="Session Pre-requisite"
            name="prerequisites"
          >
            <TextEditor name="prerequisites" form={form} placeholder="  Please input session pre-requisite" />
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
                  <Select value={form.getFieldsValue().currency} disabled={stripeCurrency !== null ? true : false}>
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
