import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { useLocation } from 'react-router-dom';
import { BlockPicker } from 'react-color';
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
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  VideoCameraOutlined,
  TagOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
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
import { showErrorModal, showCourseOptionsHelperModal, showTagOptionsHelperModal } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import dateUtil from 'utils/date';
import {
  getCurrencyList,
  convertSchedulesToUTC,
  isAPISuccess,
  generateRandomColor,
  isValidFile,
  ZoomAuthType,
} from 'utils/helper';
import { isMobileDevice } from 'utils/device';
import { fetchCreatorCurrency } from 'utils/payment';

import { profileFormItemLayout, profileFormTailLayout } from 'layouts/FormLayouts';

import { useGlobalContext } from 'services/globalContext';
import {
  mixPanelEventTags,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';

import { pushToDataLayer, gtmTriggerEvents, customNullValue } from 'services/integrations/googleTagManager';

import styles from './style.module.scss';

const { Title, Text, Paragraph, Link } = Typography;
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
  currency: '',
  max_participants: 1,
  group: true,
  name: '',
  description: '',
  session_image_url: '',
  session_course_type: 'normal',
  inventory: [],
  document_urls: [],
  beginning: moment().startOf('day').utc().format(),
  expiry: moment().add(1, 'days').startOf('day').utc().format(),
  recurring: true,
  is_refundable: true,
  refund_before_hours: 0,
  prerequisites: '',
  color_code: initialColor,
  is_course: false,
  session_tag_type: 'anyone',
  is_offline: 'false',
  offline_event_address: '',
};

const priceTypes = {
  FREE: 'Free',
  PAID: 'Paid',
  FLEXIBLE: 'Flexible',
};

const Session = ({ match, history }) => {
  const location = useLocation();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionImageUrl, setSessionImageUrl] = useState(null);
  const [isSessionTypeGroup, setIsSessionTypeGroup] = useState(true);
  const [sessionPaymentType, setSessionPaymentType] = useState(priceTypes.PAID);
  const [currencyList, setCurrencyList] = useState(null);
  const [sessionRefundable, setSessionRefundable] = useState(true);
  const [refundBeforeHours, setRefundBeforeHours] = useState(24);
  const [isSessionRecurring, setIsSessionRecurring] = useState(true);
  const [recurringDatesRanges, setRecurringDatesRanges] = useState([]);
  const [session, setSession] = useState(initialSession);
  const [deleteSlot, setDeleteSlot] = useState([]);
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [stripeCurrency, setStripeCurrency] = useState(null);
  const [colorCode, setColorCode] = useState(initialColor || whiteColor);
  const [isCourseSession, setIsCourseSession] = useState(false);
  const [creatorDocuments, setCreatorDocuments] = useState([]);
  const [selectedTagType, setSelectedTagType] = useState('anyone');
  const [creatorMemberTags, setCreatorMemberTags] = useState([]);
  const [isOfflineSession, setIsOfflineSession] = useState(false);

  const {
    state: {
      userDetails: {
        profile: { zoom_connected = 'NOT_CONNECTED' },
      },
    },
  } = useGlobalContext();

  const fetchCreatorMemberTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.user.getCreatorUserPreferences();

      if (isAPISuccess(status) && data) {
        setCreatorMemberTags(data.tags);
      }
    } catch (error) {
      showErrorModal('Failed to fetch creator tags', error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }, []);

  // Reworked the fetch currency mechanic
  const getCreatorCurrencyDetails = useCallback(
    async (sessionData = null) => {
      setIsLoading(true);
      try {
        const creatorCurrency = await fetchCreatorCurrency();

        if (creatorCurrency) {
          setStripeCurrency(creatorCurrency.toUpperCase());
          if (!sessionData) {
            form.setFieldsValue({
              ...form.getFieldsValue(),
              price_type: priceTypes.PAID,
              currency: creatorCurrency.toUpperCase() || '',
              price: 10,
            });
            setSessionPaymentType(priceTypes.PAID);
          } else {
            form.setFieldsValue({
              ...form.getFieldsValue(),
              currency: creatorCurrency.toUpperCase() || sessionData.currency?.toUpperCase() || '',
            });
          }
        } else {
          setStripeCurrency(null);
          form.setFieldsValue({
            ...form.getFieldsValue(),
            price_type: priceTypes.FREE,
            price: 0,
            currency: '',
          });
          setSessionPaymentType(priceTypes.FREE);
        }
      } catch (error) {
        message.error(error.response?.data?.message || 'Something went wrong.');
      }
      setIsLoading(false);
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
            price_type: data?.pay_what_you_want
              ? priceTypes.FLEXIBLE
              : data?.price > 0
              ? priceTypes.PAID
              : priceTypes.FREE,
            is_refundable: data?.is_refundable ? 'Yes' : 'No',
            refund_before_hours: data?.refund_before_hours || 0,
            recurring_dates_range: data?.recurring ? [moment(data?.beginning), moment(data?.expiry)] : [],
            color_code: data?.color_code || whiteColor,
            session_course_type: data?.is_course ? 'course' : 'normal',
            document_urls: data?.document_urls?.filter((documentUrl) => documentUrl && isValidFile(documentUrl)) || [],
            session_tag_type: data?.tags?.length > 0 ? 'selected' : 'anyone',
            selected_member_tags: data?.tags?.map((tag) => tag.external_id) || [],
            is_offline: `${data?.is_offline}`,
          });
          setIsOfflineSession(data?.is_offline);
          setSessionImageUrl(data.session_image_url);
          setIsSessionTypeGroup(data?.max_participants >= 2 ? true : false);
          setSessionPaymentType(
            data?.pay_what_you_want ? priceTypes.FLEXIBLE : data?.price > 0 ? priceTypes.PAID : priceTypes.FREE
          );
          setIsSessionRecurring(data?.recurring);
          setSessionRefundable(data?.is_refundable);
          setRefundBeforeHours(data?.refund_before_hours || 0);
          setRecurringDatesRanges(data?.recurring ? [moment(data?.beginning), moment(data?.expiry)] : []);
          setColorCode(data?.color_code || whiteColor);
          setIsCourseSession(data?.is_course || false);
          setIsLoading(false);
          setSelectedTagType(data?.tags?.length > 0 ? 'selected' : 'anyone');
          await getCreatorCurrencyDetails(data);
        }
      } catch (error) {
        message.error(error.response?.data?.message || 'Something went wrong.');
        setIsLoading(false);
        if (isOnboarding) {
          history.push(Routes.sessionCreate);
        } else {
          history.push('/creator/dashboard' + Routes.creatorDashboard.createSessions);
        }
      }
    },
    [form, history, isOnboarding, getCreatorCurrencyDetails]
  );

  const fetchCreatorDocuments = useCallback(async () => {
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
    fetchCreatorMemberTags();
    fetchCreatorDocuments();

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
      getCreatorCurrencyDetails();
      form.setFieldsValue({
        ...form.getFieldsValue(),
        type: 'Group',
        max_participants: 2,
        recurring: true,
        is_refundable: 'Yes',
        refund_before_hours: 0,
        color_code: initialColor || whiteColor,
        session_course_type: 'normal',
        session_tag_type: 'anyone',
        selected_member_tags: [],
        is_offline: 'false',
        offline_event_address: '',
      });
      setIsLoading(false);
    }
    getCurrencyList()
      .then((res) => setCurrencyList(res))
      .catch(() => message.error('Failed to load currency list'));
  }, [
    form,
    location,
    getSessionDetails,
    match.params.id,
    match.path,
    getCreatorCurrencyDetails,
    fetchCreatorDocuments,
    fetchCreatorMemberTags,
  ]);

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

  const handleSessionTagType = (e) => {
    if (creatorMemberTags.length > 0) {
      setSelectedTagType(e.target.value);
    } else {
      setSelectedTagType('anyone');
      form.setFieldsValue({ ...form.getFieldsValue(), session_tag_type: 'anyone' });
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
      form.setFieldsValue({ ...form.getFieldsValue(), price_type: priceTypes.FREE, price: 0 });
      setSession({ ...session, price: 0 });
      setSessionPaymentType(priceTypes.FREE);
    };

    if (e.target.value === priceTypes.FREE) {
      setFreeSession();
    } else {
      if (stripeCurrency) {
        setSessionPaymentType(e.target.value);
      } else {
        Modal.confirm({
          title: `We need your bank account details to send you the earnings. Please add your bank account details and proceed with creating a paid session`,
          okText: 'Setup payment account',
          cancelText: 'Keep it free',
          onCancel: () => setFreeSession(),
          onOk: () => {
            const newWindow = window.open(
              `${Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount}`
            );
            newWindow.blur();
            window.focus();
            setFreeSession();
            // history.push(`${Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount}`);
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

  const changeSessionRecurrence = (isRecurring) => {
    setIsSessionRecurring(isRecurring);
    setRecurringDatesRanges([]);
  };

  const handleSessionRecurrence = (e) => {
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
        onCancel: () => changeSessionRecurrence(isRecurring),
        onOk: () => {
          changeSessionRecurrence(isRecurring);
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
      changeSessionRecurrence(isRecurring);
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

  const handleSessionOfflineTypeChange = (e) => {
    setIsOfflineSession(e.target.value === 'true');
    form.setFieldsValue({ ...form.getFieldsValue(), is_offline: e.target.value });
  };

  const onFinish = async (values) => {
    const eventTagObject = creator.click.sessions.form;

    try {
      setIsLoading(true);
      const data = {
        price:
          sessionPaymentType === priceTypes.FREE
            ? 0
            : values.price || (sessionPaymentType === priceTypes.FLEXIBLE ? 5 : 0), // Setting Default to 5 for Flexible payment
        pay_what_you_want: sessionPaymentType === priceTypes.FLEXIBLE,
        currency: values.currency?.toLowerCase() || stripeCurrency?.toLowerCase() || '',
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
        tag_ids:
          selectedTagType === 'anyone'
            ? []
            : values.selected_member_tags || session?.tags?.map((tag) => tag.external_id) || [],
        is_offline: isOfflineSession,
        offline_event_address: values.offline_event_address,
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
            pushToDataLayer(gtmTriggerEvents.CREATOR_CREATE_SESSION, {
              session_name: newSessionResponse.data.name,
              session_price: newSessionResponse.data.price,
              session_currency: newSessionResponse.data.currency || customNullValue,
              session_id: newSessionResponse.data.session_external_id,
              session_creator_username: newSessionResponse.data.creator_username,
            });

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
        message.error('Need at least 1 session to publish');
      }
    } catch (error) {
      setIsLoading(false);

      trackFailedEvent(session.session_id ? eventTagObject.submitUpdate : eventTagObject.submitNewSession, error, {
        form_values: values,
      });
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
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
        <OnboardSteps current={1} />
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
                className={classNames('avatar-uploader', styles.coverImage)}
                name="session_image_url"
                action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                onChange={onSessionImageUpload}
                value={sessionImageUrl}
                label="Session Image (size of Facebook Cover Image)"
                overlayHelpText="Click to change image (size of Facebook Cover Image)"
              />
            </div>
          </Form.Item>

          <Form.Item wrapperCol={24} hidden={match?.params?.id}>
            <Form.Item
              {...profileFormItemLayout}
              label="Session Hosting Type"
              name="is_offline"
              id="is_offline"
              rules={validationRules.requiredValidation}
              onChange={handleSessionOfflineTypeChange}
            >
              <Radio.Group>
                <Radio value="false"> Online </Radio>
                <Radio value="true"> Offline </Radio>
              </Radio.Group>
            </Form.Item>
            {!isOfflineSession ? (
              zoom_connected === ZoomAuthType.NOT_CONNECTED ? (
                <Form.Item {...profileFormItemLayout} label={<Text type="danger"> Session hosting link </Text>}>
                  <Button
                    type="primary"
                    icon={<VideoCameraOutlined />}
                    onClick={() => window.open(config.zoom.oAuthURL, '_self')}
                    className="connect-your-zoom-btn"
                  >
                    Connect your zoom account
                  </Button>
                </Form.Item>
              ) : (
                <Form.Item {...profileFormTailLayout}>
                  <Text>
                    {' '}
                    We will automatically generate the meeting link for each event. If you wish to input the meeting
                    details for each event, you can do so in the{' '}
                    <Link href={Routes.creatorDashboard.rootPath + Routes.creatorDashboard.defaultPath} target="_blank">
                      Upcoming Sessions
                    </Link>
                    .
                  </Text>
                </Form.Item>
              )
            ) : null}
          </Form.Item>

          <Form.Item
            label="Event Address/Location"
            name="offline_event_address"
            id="offline_event_address"
            hidden={!isOfflineSession}
            rules={isOfflineSession ? validationRules.requiredValidation : []}
          >
            <Input placeholder="Input the event address/location" />
          </Form.Item>

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
            <div>
              <TextEditor name="description" form={form} placeholder="Please input description" />
            </div>
          </Form.Item>

          <Form.Item
            label="Attached Files"
            id="document_urls"
            name="document_urls"
            extra={
              <Paragraph type="secondary">
                Your documents uploaded in your{' '}
                <Link href={Routes.creatorDashboard.rootPath + Routes.creatorDashboard.documents} target="_blank">
                  {' '}
                  document drive{' '}
                </Link>{' '}
                will show up here. You can add a new doc in the{' '}
                <Link href={Routes.creatorDashboard.rootPath + Routes.creatorDashboard.documents} target="_blank">
                  {' '}
                  document drive{' '}
                </Link>
              </Paragraph>
            }
          >
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
            <Form.Item label="Session Type" required>
              <Form.Item
                name="session_course_type"
                id="session_course_type"
                rules={validationRules.requiredValidation}
                onChange={handleSessionCourseType}
                className={styles.inlineFormItem}
              >
                <Radio.Group>
                  <Radio value="normal">Normal Session</Radio>
                  <Radio value="course">Course Session</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item className={styles.inlineFormItem}>
                <Button
                  size="small"
                  type="link"
                  onClick={() => showCourseOptionsHelperModal('session')}
                  icon={<InfoCircleOutlined />}
                >
                  Understanding the options
                </Button>
              </Form.Item>
            </Form.Item>
          </>

          {/* ---- Session Tag Type ---- */}
          <>
            <Form.Item label="Bookable by member with Tag" required hidden={creatorMemberTags.length === 0}>
              <Form.Item
                name="session_tag_type"
                id="session_tag_type"
                rules={validationRules.requiredValidation}
                onChange={handleSessionTagType}
                className={styles.inlineFormItem}
              >
                <Radio.Group>
                  <Radio value="anyone"> Anyone </Radio>
                  <Radio value="selected"> Selected Member Tags </Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item className={styles.inlineFormItem}>
                <Button
                  size="small"
                  type="link"
                  onClick={() => showTagOptionsHelperModal('session')}
                  icon={<InfoCircleOutlined />}
                >
                  Understanding the tag options
                </Button>
              </Form.Item>
            </Form.Item>
            <Form.Item
              name="selected_member_tags"
              id="selected_member_tags"
              hidden={selectedTagType === 'anyone' || creatorMemberTags.length === 0}
              {...(!isMobileDevice && profileFormTailLayout)}
            >
              <Select
                showArrow
                mode="multiple"
                maxTagCount={3}
                placeholder="Select a member tag"
                disabled={selectedTagType === 'anyone'}
                options={creatorMemberTags.map((tag) => ({
                  label: (
                    <>
                      {' '}
                      {tag.name} {tag.is_default ? <TagOutlined /> : null}{' '}
                    </>
                  ),
                  value: tag.external_id,
                }))}
              />
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
                  Private (1 individual)
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
                <Radio value={priceTypes.FREE}>Free</Radio>
                <Radio value={priceTypes.PAID}>Paid</Radio>
                <Radio value={priceTypes.FLEXIBLE}>Let attendees pay what they can</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item name="currency" label="Currency" hidden={sessionPaymentType === priceTypes.FREE}>
              <Select value={form.getFieldsValue().currency} disabled={stripeCurrency !== null ? true : false}>
                {currencyList &&
                  Object.entries(currencyList).map(([key, value], i) => (
                    <Option value={key} key={key}>
                      ({key}) {value}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
            {/* NOTE : Currently the minimum for PWYW is 5, adjust when necessary */}
            <Form.Item
              {...(!isMobileDevice && profileFormTailLayout)}
              name="price"
              extra={
                sessionPaymentType === priceTypes.FLEXIBLE
                  ? `Choose your minimum price. We default to 5 ${form
                      .getFieldsValue()
                      .currency.toUpperCase()} as default`
                  : 'Set your price'
              }
              rules={validationRules.numberValidation(
                `Please input the price ${sessionPaymentType === priceTypes.FLEXIBLE ? '(min. 5)' : ''}`,
                sessionPaymentType === priceTypes.FLEXIBLE ? 5 : 0,
                false
              )}
              hidden={sessionPaymentType === priceTypes.FREE}
            >
              <InputNumber min={sessionPaymentType === priceTypes.FLEXIBLE ? 5 : 0} placeholder="Amount" />
            </Form.Item>

            {sessionPaymentType !== priceTypes.FREE && (
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

            {sessionPaymentType !== priceTypes.FREE && sessionRefundable && (
              <>
                <Form.Item
                  {...(!isMobileDevice && profileFormItemLayout)}
                  label="Cancellable Before"
                  name="refund_before_hours"
                  extra="A customer can cancel and get a refund for this order if they cancel before the hours you have inputted above"
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
            label="Session Recurrence"
            rules={validationRules.requiredValidation}
            onChange={handleSessionRecurrence}
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
