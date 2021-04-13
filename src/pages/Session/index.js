import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { BlockPicker } from 'react-color';
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
import { ArrowLeftOutlined, CheckCircleOutlined, VideoCameraOutlined } from '@ant-design/icons';
import moment from 'moment';

import config from 'config';
import apis from 'apis';
import Routes from 'routes';
import Section from 'components/Section';
import Loader from 'components/Loader';
import ImageUpload from 'components/ImageUpload';
import OnboardSteps from 'components/OnboardSteps';
import Scheduler from 'components/Scheduler';
import TextEditor from 'components/TextEditor';
import validationRules from 'utils/validation';
import dateUtil from 'utils/date';
import {
  getCurrencyList,
  convertSchedulesToUTC,
  isAPISuccess,
  scrollToErrorField,
  generateRandomColor,
  isValidFile,
  ZoomAuthType,
} from 'utils/helper';
import { isMobileDevice } from 'utils/device';

import { profileFormItemLayout, profileFormTailLayout } from 'layouts/FormLayouts';

import { useGlobalContext } from 'services/globalContext';
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
  formatDate: { toUtcStartOfDay, toUtcEndOfDay, getTimeDiff, toLocaleDate },
  timeCalculation: { createWeekRange, getRangeDiff, createRange },
  timezoneUtils: { getCurrentLongTimezone },
} = dateUtil;
const { creator } = mixPanelEventTags;

const whiteColor = '#ffffff';
const initialColor = generateRandomColor();

const colorPickerChoices = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#1890ff',
  '#009688',
  '#4caf50',
  '#ffc107',
  '#ff9800',
  '#ff5722',
  '#795548',
  '#607d8b',
];

const initialSession = {
  price: 0,
  currency: 'SGD',
  max_participants: 1,
  group: true,
  name: '',
  description: '',
  session_image_url: '',
  inventory: [],
  document_urls: [],
  beginning: moment().startOf('day').utc().format(),
  expiry: moment().add(1, 'days').startOf('day').utc().format(),
  recurring: false,
  is_refundable: true,
  refund_before_hours: 0,
  prerequisites: '',
  color_code: initialColor,
  is_course: false,
};

const Session = ({ match, history }) => {
  const location = useLocation();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionImageUrl, setSessionImageUrl] = useState(null);
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
  const [colorCode, setColorCode] = useState(initialColor || whiteColor);
  const [isCourseSession, setIsCourseSession] = useState(false);
  const [creatorDocuments, setCreatorDocuments] = useState([]);

  const {
    state: {
      userDetails: { zoom_connected = 'NOT_CONNECTED' },
    },
  } = useGlobalContext();

  const getCreatorStripeDetails = useCallback(
    async (sessionData = null) => {
      try {
        setIsLoading(true);
        const { status, data } = await apis.session.getCreatorBalance();
        if (isAPISuccess(status) && data) {
          setStripeCurrency(data.currency.toUpperCase());
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
          // The session_date gets messed up here, so trying to fix it here
          if (data.inventory.length > 0) {
            data.inventory = data.inventory.map((inventory) => ({
              ...inventory,
              session_date: inventory.start_time,
            }));
          }
          setSession(data);
          form.setFieldsValue({
            ...data,
            type: data?.max_participants >= 2 ? 'Group' : '1-on-1',
            price_type: data?.price === 0 ? 'Free' : 'Paid',
            is_refundable: data?.is_refundable ? 'Yes' : 'No',
            refund_before_hours: data?.refund_before_hours || 0,
            recurring_dates_range: data?.recurring ? [moment(data?.beginning), moment(data?.expiry)] : [],
            color_code: data?.color_code || whiteColor,
            session_course_type: data?.is_course ? 'course' : 'normal',
            document_urls: data?.document_urls?.filter((documentUrl) => documentUrl && isValidFile(documentUrl)) || [],
          });
          setSessionImageUrl(data.session_image_url);
          setIsSessionTypeGroup(data?.max_participants >= 2 ? true : false);
          setIsSessionFree(data?.price === 0 ? true : false);
          setIsSessionRecurring(data?.recurring);
          setSessionRefundable(data?.is_refundable);
          setRefundBeforeHours(data?.refund_before_hours || 0);
          setRecurringDatesRanges(data?.recurring ? [moment(data?.beginning), moment(data?.expiry)] : []);
          setColorCode(data?.color_code || whiteColor);
          setIsCourseSession(data?.is_course || false);
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

  const getCreatorDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.documents.getCreatorDocuments();

      if (isAPISuccess(status) && data) {
        setCreatorDocuments(data.data);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to fetch user documents');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (match.path.includes('manage')) {
      setIsOnboarding(false);
    }
    if (match.params.id) {
      const startDate = location.state.beginning
        ? toUtcStartOfDay(location.state.beginning)
        : toUtcStartOfDay(moment().subtract(1, 'month'));
      const endDate = location.state.expiry
        ? toUtcEndOfDay(location.state.expiry)
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
        refund_before_hours: 0,
        color_code: initialColor || whiteColor,
        session_course_type: 'normal',
      });
      setIsLoading(false);
    }
    getCurrencyList()
      .then((res) => setCurrencyList(res))
      .catch(() => message.error('Failed to load currency list'));
    getCreatorDocuments();
  }, [form, location, getSessionDetails, match.params.id, match.path, getCreatorStripeDetails, getCreatorDocuments]);

  const onSessionImageUpload = (imageUrl) => {
    setSessionImageUrl(imageUrl);
    setSession({ ...session, session_image_url: imageUrl });
  };

  const handleSessionCourseType = (e) => {
    setIsCourseSession(e.target.value === 'course');

    if (e.target.value === 'course') {
      form.setFieldsValue({ ...form.getFieldsValue(), type: 'Group', max_participants: 2 });
      setSession({ ...session, max_participants: 2 });
      setIsSessionTypeGroup(true);
    }
  };

  const handleSessionType = (e) => {
    if (e.target.value === '1-on-1') {
      form.setFieldsValue({ ...form.getFieldsValue(), max_participants: 1 });
      setSession({ ...session, max_participants: 1 });
      setIsSessionTypeGroup(false);
    } else {
      form.setFieldsValue({ ...form.getFieldsValue(), max_participants: 2 });
      setSession({ ...session, max_participants: 2 });
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
          title: `We need your bank account details to send you the earnings. Please add your bank account details and proceed with creating a paid session`,
          okText: 'Setup payment account',
          cancelText: 'Keep it free',
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
      setRefundBeforeHours(0);
      form.setFieldsValue({ ...form.getFieldsValue(), refund_before_hours: 0 });
    }
  };

  const changeSessionRecurrance = (isRecurring) => {
    setIsSessionRecurring(isRecurring);
    setRecurringDatesRanges([]);
  };

  const handleSessionRecurrance = (e) => {
    const isRecurring = e.target.value === 'true';

    if (session.inventory.length > 0) {
      Modal.confirm({
        autoFocusButton: 'cancel',
        mask: true,
        centered: true,
        closable: true,
        maskClosable: true,
        title: 'Keep Existing Slots?',
        content: (
          <Paragraph>
            You are switching from{' '}
            <Text strong>{isRecurring ? 'One-time to Recurring Sessions' : 'Recurring to One-time Sessions'} </Text>,
            would you like to <Text strong> keep your existing time slots </Text> marked on the calendar?
          </Paragraph>
        ),
        okText: 'No, Clear Slots',
        okButtonProps: { type: 'default' },
        cancelText: 'Yes, Keep Slots',
        cancelButtonProps: { type: 'primary' },
        onCancel: () => changeSessionRecurrance(isRecurring),
        onOk: () => {
          changeSessionRecurrance(isRecurring);
          // Mark created inventories for deletion
          session.inventory.forEach((inv) => {
            if (inv.inventory_id) {
              handleSlotDelete(inv.inventory_id);
            }
          });

          // Set current state to empty array
          setSession({ ...session, inventory: [] });
        },
      });
    } else {
      changeSessionRecurrance(isRecurring);
    }
  };

  const disabledDate = (current) => {
    return current && current < moment().startOf('day');
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
    tempDeleteSlots = [...new Set(tempDeleteSlots)];
    setDeleteSlot(tempDeleteSlots);
  };

  const handleDateRangeChange = (value) => {
    const oldDateRange = form.getFieldsValue().recurring_dates_range;
    const newDateRange = value;
    let rangeDiff = [];

    if (oldDateRange && newDateRange) {
      rangeDiff = getRangeDiff(oldDateRange, newDateRange);
    }

    if (rangeDiff.length > 0) {
      Modal.confirm({
        centered: true,
        closable: true,
        mask: true,
        maskClosable: true,
        autoFocusButton: 'cancel',
        title: 'Update Session Schedule?',
        okText: `Copy on new dates`,
        cancelText: 'Leave it as is',
        content: (
          <Text>
            You have changed the date range, would you like us to copy the sessions currently on the calender to this
            date range?
          </Text>
        ),
        onOk: () => handleRecurringDatesRange(value, true),
        onCancel: () => handleRecurringDatesRange(value, false),
      });
    } else {
      handleRecurringDatesRange(value, false);
    }
  };

  const handleRecurringDatesRange = (value, updateInventoriesForNewDate) => {
    const oldDateRange = form.getFieldsValue().recurring_dates_range;
    const newDateRange = value;
    let rangeDiff = [];
    let takeLastWeek = true;

    if (updateInventoriesForNewDate && oldDateRange && newDateRange) {
      if (oldDateRange[1].isSame(newDateRange[1])) {
        takeLastWeek = false;
      }

      rangeDiff = getRangeDiff(oldDateRange, newDateRange);
    }

    setRecurringDatesRanges(value);
    form.setFieldsValue({
      ...form.getFieldsValue(),
      recurring_dates_range: value,
    });

    // For Repeating Sessions, if date range changes remove the inventories which are out of range
    if (value?.length && session?.inventory?.length) {
      const newSlots = [];

      for (let i = 0; i < session.inventory.length; i++) {
        const slot = session.inventory[i];
        if (
          getTimeDiff(toLocaleDate(value[0]), toLocaleDate(slot.start_time), 'days') <= 0 &&
          getTimeDiff(toLocaleDate(value[1]), toLocaleDate(slot.end_time), 'days') >= 0
        ) {
          newSlots.push(slot);
        } else {
          if (slot.inventory_id) {
            handleSlotDelete(slot.inventory_id);
          }
        }
      }

      //Add new inventories here if the date range extends
      if (updateInventoriesForNewDate && rangeDiff.length > 0) {
        const oldRange = createRange(oldDateRange[0], oldDateRange[1]);

        const referenceInventory = session.inventory[takeLastWeek ? session.inventory.length - 1 : 0];
        const copiedRange = createWeekRange(referenceInventory.start_time, takeLastWeek);

        const copiedInventories = session.inventory.filter((inventory) =>
          moment(inventory.start_time).within(copiedRange)
        );

        Array.from(rangeDiff[0].snapTo('day').by('day')).forEach((extraDay) => {
          if (extraDay.within(oldRange)) {
            return;
          }

          copiedInventories.forEach((inventory) => {
            const invStartMoment = moment(inventory.start_time);

            // Skip creating it if the newly copied inventory will exist in the past
            if (extraDay.day() === invStartMoment.day()) {
              const createdDate = [extraDay.year(), extraDay.month(), extraDay.date()];
              if (
                extraDay.isSameOrBefore(moment(), 'day') &&
                moment([...createdDate, invStartMoment.hour(), invStartMoment.minute()]).isSameOrBefore(
                  moment(),
                  'minute'
                )
              ) {
                console.log('Past inventory will be created, skipping...');
                console.log(moment([...createdDate, invStartMoment.hour(), invStartMoment.minute()]).format());
                return;
              }

              const invEndMoment = moment(inventory.end_time);

              const start_time = moment([...createdDate, invStartMoment.hour(), invStartMoment.minute()]).format();
              const end_time = moment([...createdDate, invEndMoment.hour(), invEndMoment.minute()]).format();
              const session_date = start_time;

              newSlots.push({
                num_participants: 0,
                session_date: session_date,
                start_time: start_time,
                end_time: end_time,
              });
            }
          });
        });
      }

      handleSlotsChange(newSlots);
    }
  };

  const handleRefundBeforeHoursChange = (e) => {
    const value = Math.max(0, parseInt(e.target.value));

    setRefundBeforeHours(value);
    form.setFieldsValue({ ...form.getFieldsValue(), refund_before_hours: value });
  };

  const handleColorChange = (color) => {
    setColorCode(color.hex || whiteColor);
    form.setFieldsValue({ ...form.getFieldsValue(), color_code: color.hex || whiteColor });
  };

  const onFinish = async (values) => {
    const eventTagObject = creator.click.sessions.form;

    try {
      setIsLoading(true);
      const data = {
        price: isSessionFree ? 0 : values.price || 0,
        currency: values.currency?.toLowerCase() || stripeCurrency.toLowerCase() || 'sgd',
        max_participants: values.max_participants,
        name: values.name,
        description: values.description,
        prerequisites: values.prerequisites,
        session_image_url: sessionImageUrl || '',
        category: '',
        document_urls: values.document_urls || [],
        recurring: isSessionRecurring,
        is_refundable: sessionRefundable,
        refund_before_hours: refundBeforeHours,
        user_timezone_offset: new Date().getTimezoneOffset(),
        user_timezone: getCurrentLongTimezone(),
        color_code: values.color_code || colorCode || whiteColor,
        is_course: isCourseSession,
      };
      if (isSessionRecurring) {
        data.beginning = moment(values.recurring_dates_range[0]).startOf('day').utc().format();
        data.expiry = moment(values.recurring_dates_range[1]).endOf('day').utc().format();
      } else {
        data.beginning = moment().startOf('day').utc().format();
        data.expiry = moment().endOf('day').utc().format();
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
          const updatedSessionResponse = await apis.session.update(session.session_id, data);
          if (isAPISuccess(updatedSessionResponse.status)) {
            trackSuccessEvent(eventTagObject.submitUpdate, { form_values: values });

            Modal.confirm({
              icon: <CheckCircleOutlined />,
              title: `${data.name} session successfully updated`,
              className: styles.confirmModal,
              okText: 'Done',
              cancelText: 'Add New',
              onCancel: () => {
                trackSimpleEvent(eventTagObject.addNewInModal);
                const startDate = data.beginning || toUtcStartOfDay(moment().subtract(1, 'month'));
                const endDate = data.expiry || toUtcEndOfDay(moment().add(1, 'month'));
                getSessionDetails(match.params.id, startDate, endDate);
                window.location.reload();
                window.scrollTo(0, 0);
              },
              onOk: () => {
                trackSimpleEvent(eventTagObject.doneInModal);
                history.push(`${Routes.creatorDashboard.rootPath}/${Routes.creatorDashboard.createSessions}`);
                window.scrollTo(0, 0);
              },
            });
          }
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
            mandatory and you can also add pre-requisite or a document to make it more descriptive. Then select the days
            and time you want to host this session.
          </Paragraph>
        </Typography>
      </Space>

      <Form
        form={form}
        scrollToFirstError={true}
        {...profileFormItemLayout}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        labelAlign={isMobileDevice ? 'left' : 'right'}
      >
        {/* ========= SESSION INFORMATION ======== */}
        <Section>
          <Title level={4}>1. Primary Information</Title>
          <Form.Item
            id="session_image_url"
            name="session_image_url"
            rules={validationRules.requiredValidation}
            wrapperCol={{ span: 24 }}
          >
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
          </Form.Item>

          {zoom_connected === ZoomAuthType.NOT_CONNECTED && (
            <Form.Item label={<Text type="danger"> Session hosting link </Text>}>
              <Button
                type="primary"
                icon={<VideoCameraOutlined />}
                onClick={() => window.open(config.zoom.oAuthURL, '_self')}
              >
                Link your zoom
              </Button>
            </Form.Item>
          )}

          <Form.Item label="Session Name" id="name" name="name" rules={validationRules.nameValidation}>
            <Input placeholder="Enter Session Name" />
          </Form.Item>

          <Form.Item
            className={classNames(styles.bgWhite, styles.textEditorLayout)}
            label={<Text> Session Description </Text>}
            name="description"
            id="description"
            rules={validationRules.requiredValidation}
          >
            <TextEditor name="description" form={form} placeholder="Please input description" />
          </Form.Item>

          <Form.Item label="Attached Files" id="document_urls" name="document_urls">
            <Select
              className={styles.fileDropdown}
              showArrow
              placeholder="Select documents you want to include"
              mode="multiple"
              maxTagCount={3}
              options={creatorDocuments.map((document) => ({
                label: document.name,
                value: document.url,
              }))}
            />
          </Form.Item>

          <Form.Item
            className={classNames(styles.bgWhite, styles.textEditorLayout)}
            label="Session Pre-requisite"
            name="prerequisites"
          >
            <TextEditor name="prerequisites" form={form} placeholder="  Please input session pre-requisite" />
          </Form.Item>

          {/* ---- Session Course Type ---- */}
          <>
            <Form.Item
              name="session_course_type"
              id="session_course_type"
              label="Session Type"
              rules={validationRules.requiredValidation}
              onChange={handleSessionCourseType}
            >
              <Radio.Group>
                <Radio value="normal">Normal Session</Radio>
                <Radio value="course">Course Session</Radio>
              </Radio.Group>
            </Form.Item>
          </>

          {/* ---- Session Type ---- */}
          <>
            <Form.Item
              name="type"
              id="type"
              label="Attendee Type"
              rules={validationRules.requiredValidation}
              onChange={handleSessionType}
            >
              <Radio.Group>
                <Radio value="Group">Group</Radio>
                <Radio disabled={isCourseSession} value="1-on-1">
                  Individual (1-on-1)
                </Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              {...(!isMobileDevice && profileFormTailLayout)}
              name="max_participants"
              extra="Maximum 100 supported"
              rules={validationRules.requiredValidation}
              hidden={!isSessionTypeGroup}
            >
              {isSessionTypeGroup && <InputNumber min={2} max={100} />}
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
              name="currency"
              label="Currency"
              rules={validationRules.requiredValidation}
              hidden={isSessionFree}
            >
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
              extra="Set your price"
              rules={validationRules.requiredValidation}
              hidden={isSessionFree}
            >
              <InputNumber min={1} placeholder="Amount" />
            </Form.Item>

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
                  extra="A customer can cancel and get a refund for this order if they cancel before the hours you have inputed above"
                  rules={validationRules.requiredValidation}
                  onChange={handleRefundBeforeHoursChange}
                >
                  <InputNumber value={refundBeforeHours} min={0} placeholder="Hours limit" />
                  <span className="ant-form-text"> hour(s) before the session starts </span>
                </Form.Item>
              </>
            )}
          </>
          <Form.Item
            name="color_code"
            label="Color Tag"
            rules={validationRules.requiredValidation}
            style={{ marginTop: 32 }}
          >
            <BlockPicker
              color={colorCode}
              onChangeComplete={handleColorChange}
              triangle="hide"
              width={144}
              colors={colorPickerChoices}
            />
          </Form.Item>
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
                onChange={handleDateRangeChange}
                onFocus={handleCalenderPop}
              />
            </Form.Item>
          )}

          <Scheduler
            sessionSlots={session?.inventory?.length ? session.inventory : []}
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
