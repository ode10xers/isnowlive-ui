import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import { Row, Col, Button, Form, Input, Typography, Tag, Card, message, InputNumber, Space } from 'antd';
import { DownOutlined, UpOutlined, CheckCircleTwoTone } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Loader from 'components/Loader';
import Table from 'components/Table';
import SignInForm from 'components/SignInForm';
import SessionInventorySelect from 'components/SessionInventorySelect';
import TermsAndConditionsText from 'components/TermsAndConditionsText';
import {
  showErrorModal,
  showBookSessionWithPassSuccessModal,
  showPurchasePassAndBookSessionSuccessModal,
  showBookSingleSessionSuccessModal,
  showAlreadyBookedModal,
  showBookSessionWithSubscriptionSuccessModal,
} from 'components/Modals/modals';

import dateUtil from 'utils/date';
import validationRules from 'utils/validation';
import { getLocalUserDetails } from 'utils/storage';
import { isMobileDevice } from 'utils/device';
import {
  generateUrlFromUsername,
  isUnapprovedUserError,
  isAPISuccess,
  paymentSource,
  orderType,
  productType,
} from 'utils/helper';
import { redirectToSessionsPage, redirectToVideosPage } from 'utils/redirect';

import { sessionRegistrationformLayout, sessionRegistrationTailLayout } from 'layouts/FormLayouts';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const { Title, Text, Paragraph } = Typography;
const { Item } = Form;

const {
  formatDate: { toShortDate, toLongDateWithTime },
  timezoneUtils: { getCurrentLongTimezone, getTimezoneLocation },
  timeCalculation: { isBeforeDate },
} = dateUtil;

const formInitialValues = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
};

const SessionRegistration = ({ availablePasses = [], classDetails, isInventoryDetails = false }) => {
  const {
    state: { userDetails },
    logIn,
    logOut,
    showPaymentPopup,
  } = useGlobalContext();
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [legalsAccepted, setLegalsAccepted] = useState(false);
  const [showLegalsErrorMessage, setShowLegalsErrorMessage] = useState(false);
  const [inputPrice, setInputPrice] = useState(classDetails?.price || 0);

  const [shouldShowSignInForm, setShouldShowSignInForm] = useState(false);
  const [user, setUser] = useState(null);

  const [shouldSetDefaultPass, setShouldSetDefaultPass] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);
  const [userPasses, setUserPasses] = useState([]);
  const [usableUserSubscription, setUsableUserSubscription] = useState(null);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [createFollowUpOrder, setCreateFollowUpOrder] = useState(false);

  //#region START OF Helper Functions

  const getUserPurchasedPass = (getDefault = false) => {
    setShouldSetDefaultPass(false);

    if (userPasses.length) {
      if (selectedPass && !getDefault) {
        return userPasses.filter((userPass) => userPass.id === selectedPass.id)[0];
      }

      return userPasses[0];
    }

    return null;
  };

  const getUsablePassesForUser = async () => {
    setIsLoading(true);
    try {
      const loggedInUserData = getLocalUserDetails();

      if (loggedInUserData && classDetails) {
        const { status, data } = await apis.passes.getAttendeePassesForSession(classDetails.session_id);

        if (isAPISuccess(status) && data) {
          setUserPasses(
            data.active.map((userPass) => ({
              ...userPass,
              id: userPass.pass_id,
              name: userPass.pass_name,
            }))
          );
        }
      }
    } catch (error) {
      if (!isUnapprovedUserError(error.response)) {
        showErrorModal('Something went wrong', error.response?.data?.message);
      }
    }
    setIsLoading(false);
  };

  const getUsableSubscriptionForUser = async () => {
    setIsLoading(true);

    try {
      const loggedInUserData = getLocalUserDetails();
      if (loggedInUserData && classDetails) {
        const { status, data } = await apis.subscriptions.getUserSubscriptionForSession(
          classDetails.session_external_id
        );

        if (isAPISuccess(status) && data) {
          if (data.active.length > 0) {
            // Choose a purchased subscription based on these conditions
            // 1. Should be usable for Session
            // 2. Still have credits to purchase sessions
            // 3. This session can be purchased by this subscription
            const usableSubscription =
              data.active.find(
                (subscription) =>
                  subscription.products['SESSION'] &&
                  subscription.products['SESSION']?.credits > 0 &&
                  subscription.products['SESSION']?.product_ids?.includes(classDetails.session_external_id)
              ) || null;

            setUsableUserSubscription(usableSubscription);
          } else {
            setUsableUserSubscription(null);
          }
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed fetching usable subscription for user');
    }
    setIsLoading(false);
  };

  const hideSignInForm = () => {
    setShouldShowSignInForm(false);
  };

  const showSignInForm = () => {
    setShouldShowSignInForm(true);
    form.resetFields();
    setUser(null);
  };

  const signupUser = async (values) => {
    const referenceCode = JSON.parse(localStorage.getItem('ref'));
    try {
      const { data } = await apis.user.signup({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        is_creator: false,
        referrer: referenceCode,
      });
      if (data) {
        setIsLoading(false);
        logIn(data, true);
        showConfirmPaymentPopup();
        localStorage.removeItem('ref');
      }
    } catch (error) {
      if (error.response?.data?.message && error.response.data.message === 'user already exists') {
        setIsLoading(false);
        message.info('User already exists! Please Sign in');
        showSignInForm();
      } else if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }
  };

  //#endregion END OF Helper Functions

  //#region START OF Use Effects

  // Logic for automatically selecting first available inventory and timeslot
  useEffect(() => {
    if (classDetails) {
      if (isInventoryDetails) {
        setSelectedInventory(classDetails);
      } else {
        const latestInventories = classDetails.inventory
          .filter((inventory) => isBeforeDate(inventory.end_time))
          .filter((inventory) => inventory.num_participants < classDetails.max_participants)
          .sort((a, b) => (a.start_time > b.start_time ? 1 : b.start_time > a.start_time ? -1 : 0));
        setSelectedInventory(latestInventories.length > 0 ? latestInventories[0] : null);
      }
    } else {
      setSelectedInventory(null);
    }
  }, [classDetails, isInventoryDetails]);

  // This logic is for setting default pass right after user logs in from the page
  useEffect(() => {
    if (userPasses.length && shouldSetDefaultPass) {
      setSelectedPass(getUserPurchasedPass(true));
    }
    //eslint-disable-next-line
  }, [userPasses, shouldSetDefaultPass]);

  // This logic is for delaying showing payment popup until certain details are populated
  // For example user usable pass/subscription, etc
  useEffect(() => {
    if (createFollowUpOrder) {
      showConfirmPaymentPopup();
    }

    //eslint-disable-next-line
  }, [createFollowUpOrder]);

  // Logic that runs when user logs in/out
  useEffect(() => {
    if (userDetails) {
      // Set the state in the form properly
      form.setFieldsValue(userDetails);
      setLegalsAccepted(true);
      setShowLegalsErrorMessage(false);
      setUser(userDetails);

      // Fetch user passes and subscriptions
      if (userPasses.length === 0) {
        getUsablePassesForUser();
        setShouldSetDefaultPass(true);
      }

      if (!usableUserSubscription) {
        getUsableSubscriptionForUser();
      }
    } else {
      form.resetFields();
      setUsableUserSubscription(null);
      setUserPasses([]);
      setUser(null);
    }
    //eslint-disable-next-line
  }, [userDetails]);

  //#endregion END OF Use Effects

  //#region START OF Columns and UI Items

  const expandRow = (rowKey) => {
    const tempExpandedRowsArray = expandedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRow = (rowKey) => setExpandedRowKeys(expandedRowKeys.filter((key) => key !== rowKey));

  const singleClassColumns = [
    {
      title: '',
      dataIndex: 'id',
      key: 'id',
      width: '18px',
      render: (text, record) => (
        <div className={selectedPass ? styles.roundBtn : undefined} onClick={() => setSelectedPass(null)}>
          {!selectedPass && <CheckCircleTwoTone twoToneColor="#52c41a" />}
        </div>
      ),
    },
    {
      title: '',
      dataIndex: 'name',
      key: 'name',
      align: 'left',
      width: '50%',
    },
    {
      title: '',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      width: '50%',
      render: (text, record) =>
        record.pay_what_you_want ? (
          <Space>
            <Text>Your fair price</Text>
            <InputNumber
              className={styles.compactNumericalInput}
              size="small"
              defaultValue={record.price}
              min={record.price}
              onChange={(val) => (val ? setInputPrice(val) : setInputPrice(record.price))}
              value={inputPrice}
            />
            <Text> {record.currency.toUpperCase()} </Text>
          </Space>
        ) : (
          `${record.price} ${record.currency.toUpperCase()}`
        ),
    },
  ];

  const passesColumns = [
    {
      title: '',
      dataIndex: 'id',
      key: 'id',
      width: '16px',
      render: (text, record) => (
        <div
          className={selectedPass?.id === record.id ? undefined : styles.roundBtn}
          onClick={() => setSelectedPass(record)}
        >
          {selectedPass?.id === record.id && <CheckCircleTwoTone twoToneColor="#52c41a" />}
        </div>
      ),
    },
    {
      title: 'Pass',
      dataIndex: 'name',
      key: 'name',
      width: '50%',
    },
    {
      title: 'Validity',
      dataIndex: 'validity',
      key: 'validity',
      width: '15%',
      align: 'right',
      render: (text, record) => `${record.validity} days`,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      width: '15%',
      render: (text, record) => (parseInt(text) > 0 ? `${text} ${record.currency.toUpperCase()}` : 'Free'),
    },
    {
      title: 'Credit Count',
      dataIndex: 'class_count',
      key: 'class_count',
      align: 'right',
      render: (text, record) => {
        const btnText = record.limited
          ? record.user_usable
            ? `${record.classes_remaining}/${record.class_count} remaining `
            : `${record.class_count} Credits `
          : 'Unlimited Credits ';

        return expandedRowKeys.includes(record.id) ? (
          <Button className={styles.linkBtn} type="link" onClick={() => collapseRow(record.id)}>
            {btnText} <UpOutlined />
          </Button>
        ) : (
          <Button className={styles.linkBtn} type="link" onClick={() => expandRow(record.id)}>
            {btnText} <DownOutlined />
          </Button>
        );
      },
    },
  ];

  const userPassesColumns = [
    {
      title: '',
      dataIndex: 'id',
      key: 'id',
      width: '18px',
      render: (text, record) => (
        <div
          className={selectedPass?.id === record.id ? undefined : styles.roundBtn}
          onClick={() => setSelectedPass(record)}
        >
          {selectedPass?.id === record.id && <CheckCircleTwoTone twoToneColor="#52c41a" />}
        </div>
      ),
    },
    {
      title: 'Pass',
      dataIndex: 'name',
      key: 'name',
      align: 'left',
    },
    {
      title: 'Credits Left',
      dataIndex: 'classes_remaining',
      key: 'classes_remaining',
      width: '20%',
      render: (text, record) => (record.limited ? `${record.classes_remaining}/${record.class_count}` : 'Unlimited'),
    },
    {
      title: 'Valid Till',
      dataIndex: 'expiry',
      key: 'expiry',
      width: '20%',
      render: (text, record) => toShortDate(record.expiry),
    },
  ];

  const renderPassDetails = (record) => (
    <Row gutter={[8, 8]}>
      {record.sessions?.length > 0 && (
        <>
          <Col xs={24}>
            <Text className={styles.ml20}> Sessions bookable with this pass </Text>
          </Col>
          <Col xs={24}>
            <div className={styles.ml20}>
              {record?.sessions?.map((session) => (
                <Tag
                  key={`${record.id}_${session?.session_id}`}
                  color="blue"
                  onClick={() => redirectToSessionsPage(session)}
                >
                  {session?.name}
                </Tag>
              ))}
            </div>
          </Col>
        </>
      )}
      {record.videos?.length > 0 && (
        <>
          <Col xs={24}>
            <Text className={styles.ml20}> Videos purchasable with this pass </Text>
          </Col>
          <Col xs={24}>
            <div className={styles.ml20}>
              {record?.videos?.map((video) => (
                <Tag
                  key={`${record.id}_${video?.external_id}`}
                  color="volcano"
                  onClick={() => redirectToVideosPage(video)}
                >
                  {video?.title}
                </Tag>
              ))}
            </div>
          </Col>
        </>
      )}
    </Row>
  );

  const renderPassItem = (pass) => {
    const layout = (label, value) => (
      <Row>
        <Col span={9}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={15}>: {value}</Col>
      </Row>
    );

    return (
      <div key={pass.id}>
        <Card
          className={styles.card}
          title={
            <Row>
              <Col xs={4}>
                <div
                  className={selectedPass?.id === pass.id ? undefined : styles.roundBtn}
                  onClick={() => setSelectedPass(pass)}
                >
                  {selectedPass?.id === pass.id && <CheckCircleTwoTone twoToneColor="#52c41a" />}
                </div>
              </Col>
              <Col xs={20}>
                <Text>{pass.name}</Text>
              </Col>
            </Row>
          }
          actions={[
            <Button type="primary" onClick={() => setSelectedPass(pass)}>
              Select Pass
            </Button>,
            expandedRowKeys.includes(pass.id) ? (
              <Button type="link" onClick={() => collapseRow(pass.id)} icon={<UpOutlined />}>
                Close
              </Button>
            ) : (
              <Button type="link" onClick={() => expandRow(pass.id)} icon={<DownOutlined />}>
                More
              </Button>
            ),
          ]}
        >
          {layout('Credit Count', <Text>{pass.limited ? `${pass.class_count} Credits` : 'Unlimited Credits'}</Text>)}
          {layout('Validity', <Text>{`${pass.validity} day`}</Text>)}
          {layout('Price', <Text>{`${pass.price} ${pass.currency.toUpperCase()}`}</Text>)}
        </Card>
        {expandedRowKeys.includes(pass.id) && (
          <Row gutter={[8, 8]} className={styles.cardExpansion}>
            {pass?.sessions?.length > 0 && (
              <>
                <Col xs={24}>
                  <Text className={styles.ml20}> Sessions bookable with this pass </Text>
                </Col>
                <Col xs={24}>
                  <div className={styles.ml20}>
                    {pass?.sessions?.map((session) => (
                      <Tag
                        key={`${pass.id}_${session?.session_id}`}
                        color="blue"
                        onClick={() => redirectToSessionsPage(session)}
                      >
                        {session?.name}
                      </Tag>
                    ))}
                  </div>
                </Col>
              </>
            )}
            {pass?.videos?.length > 0 && (
              <>
                <Col xs={24}>
                  <Text className={styles.ml20}> Videos purchasable with this pass </Text>
                </Col>
                <Col xs={24}>
                  <div className={styles.ml20}>
                    {pass?.videos?.map((video) => (
                      <Tag
                        key={`${pass.id}_${video?.external_id}`}
                        color="volcano"
                        onClick={() => redirectToVideosPage(video)}
                      >
                        {video?.title}
                      </Tag>
                    ))}
                  </div>
                </Col>
              </>
            )}
          </Row>
        )}
      </div>
    );
  };

  const renderUserPassItem = (pass) => {
    const layout = (label, value) => (
      <Row>
        <Col span={9}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={15}>: {value}</Col>
      </Row>
    );

    return (
      <div key={pass.pass_order_id}>
        <Card
          className={styles.card}
          title={
            <Row>
              <Col xs={4}>
                <div
                  className={selectedPass?.id === pass.id ? undefined : styles.roundBtn}
                  onClick={() => setSelectedPass(pass)}
                >
                  {selectedPass?.id === pass.id && <CheckCircleTwoTone twoToneColor="#52c41a" />}
                </div>
              </Col>
              <Col xs={20}>
                <Text>{pass.name}</Text>
              </Col>
            </Row>
          }
          actions={[
            <Button type="primary" onClick={() => setSelectedPass(pass)}>
              Select Pass
            </Button>,
            expandedRowKeys.includes(pass.id) ? (
              <Button type="link" onClick={() => collapseRow(pass.id)} icon={<UpOutlined />}>
                Close
              </Button>
            ) : (
              <Button type="link" onClick={() => expandRow(pass.id)} icon={<DownOutlined />}>
                More
              </Button>
            ),
          ]}
        >
          {layout('Credits Left', <Text>{`${pass.classes_remaining}/${pass.class_count}`}</Text>)}
          {layout('Expiry', <Text>{toShortDate(pass.expiry)}</Text>)}
        </Card>
        {expandedRowKeys.includes(pass.id) && (
          <Row gutter={[8, 8]} className={styles.cardExpansion}>
            {pass?.sessions?.length > 0 && (
              <>
                <Col xs={24}>
                  <Text className={styles.ml20}> Sessions bookable with this pass </Text>
                </Col>
                <Col xs={24}>
                  <div className={styles.ml20}>
                    {pass?.sessions?.map((session) => (
                      <Tag
                        key={`${pass.pass_order_id}_${session?.session_id}`}
                        color="blue"
                        onClick={() => redirectToSessionsPage(session)}
                      >
                        {session?.name}
                      </Tag>
                    ))}
                  </div>
                </Col>
              </>
            )}
            {pass?.videos?.length > 0 && (
              <>
                <Col xs={24}>
                  <Text className={styles.ml20}> Videos purchasable with this pass </Text>
                </Col>
                <Col xs={24}>
                  <div className={styles.ml20}>
                    {pass?.videos?.map((video) => (
                      <Tag
                        key={`${pass.pass_order_id}_${video?.external_id}`}
                        color="volcano"
                        onClick={() => redirectToVideosPage(video)}
                      >
                        {video?.title}
                      </Tag>
                    ))}
                  </div>
                </Col>
              </>
            )}
          </Row>
        )}
      </div>
    );
  };

  //#endregion END OF Columns and UI Items

  //#region START OF Business Logics

  const bookClass = async (payload) => await apis.session.createOrderForUser(payload);
  const buyPass = async (payload) => await apis.passes.createOrderForUser(payload);

  const buySingleClass = async (payload, couponCode = '', priceAmount) => {
    setIsLoading(true);

    try {
      let modifiedPayload = { ...payload, coupon_code: couponCode };

      if (priceAmount !== undefined) {
        modifiedPayload = { ...payload, amount: priceAmount, coupon_code: couponCode };
      }

      const { status, data } = await bookClass(modifiedPayload);

      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        const inventoryId = selectedInventory.inventory_id;

        if (data.payment_required) {
          return {
            ...data,
            payment_order_id: data.order_id,
            payment_order_type: orderType.CLASS,
            inventory_id: inventoryId,
          };
        } else {
          showBookSingleSessionSuccessModal(inventoryId);
          return null;
        }
      }
    } catch (error) {
      setIsLoading(false);
      if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(productType.CLASS);
      } else if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS);
      } else if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }

    return null;
  };

  const buyPassAndBookClass = async (payload, couponCode = '') => {
    setIsLoading(true);

    try {
      const { status, data } = await buyPass(payload);

      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        const inventoryId = parseInt(selectedInventory.inventory_id);

        if (data.payment_required) {
          return {
            ...data,
            payment_order_id: data.pass_order_id,
            payment_order_type: orderType.PASS,
            follow_up_booking_info: {
              productType: 'SESSION',
              productId: selectedInventory.session_external_id,
            },
          };
        } else {
          // If user (for some reason) buys a free pass (if any exists)
          // we then immediately followUp the Booking Process

          // Normally wouldn't trigger
          const followUpBooking = await bookClass({
            inventory_id: inventoryId,
            user_timezone_offset: new Date().getTimezoneOffset(),
            user_timezone_location: getTimezoneLocation(),
            user_timezone: getCurrentLongTimezone(),
            payment_source: paymentSource.PASS,
            source_id: data.pass_order_id,
          });

          if (isAPISuccess(followUpBooking.status)) {
            showPurchasePassAndBookSessionSuccessModal(data.pass_order_id, inventoryId);
          }

          return null;
        }
      }
    } catch (error) {
      setIsLoading(false);
      if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(productType.CLASS);
      } else if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS);
      } else if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }

    return null;
  };

  const bookClassUsingPass = async (payload) => {
    setIsLoading(true);

    try {
      const { status, data } = await bookClass(payload);

      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        showBookSessionWithPassSuccessModal(payload.source_id, payload.inventory_id);
        return null;
      }
    } catch (error) {
      setIsLoading(false);
      if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(productType.CLASS);
      } else if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS);
      } else if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }

    return null;
  };

  const bookClassUsingSubscription = async (payload) => {
    setIsLoading(true);

    try {
      const { status, data } = await bookClass(payload);

      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        showBookSessionWithSubscriptionSuccessModal(payload.inventory_id);
        return null;
      }
    } catch (error) {
      setIsLoading(false);

      if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(productType.CLASS);
      } else if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS);
      } else if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }

    return null;
  };

  const showConfirmPaymentPopup = () => {
    setCreateFollowUpOrder(false);

    if (usableUserSubscription) {
      const payload = {
        inventory_id: parseInt(selectedInventory.inventory_id),
        user_timezone_offset: new Date().getTimezoneOffset(),
        user_timezone_location: getTimezoneLocation(),
        user_timezone: getCurrentLongTimezone(),
        payment_source: paymentSource.SUBSCRIPTION,
        source_id: usableUserSubscription.subscription_order_id,
      };

      const paymentPopupData = {
        productId: classDetails.session_external_id,
        productType: 'SESSION',
        itemList: [
          {
            name: classDetails.name,
            description: toLongDateWithTime(selectedInventory.start_time),
            currency: classDetails.currency,
            price: classDetails.price,
          },
        ],
        paymentInstrumentDetails: {
          type: 'SUBSCRIPTION',
          ...usableUserSubscription,
        },
      };

      showPaymentPopup(paymentPopupData, async () => await bookClassUsingSubscription(payload));
    } else if (selectedPass) {
      const usersPass = getUserPurchasedPass(false);

      if (usersPass) {
        const paymentPopupData = {
          productId: classDetails.session_external_id,
          productType: 'SESSION',
          itemList: [
            {
              name: classDetails.name,
              description: toLongDateWithTime(selectedInventory.start_time),
              currency: classDetails.currency,
              price: classDetails.price,
            },
          ],
          paymentInstrumentDetails: {
            type: 'PASS',
            ...usersPass,
          },
        };

        const payload = {
          inventory_id: parseInt(selectedInventory.inventory_id),
          user_timezone_offset: new Date().getTimezoneOffset(),
          user_timezone_location: getTimezoneLocation(),
          user_timezone: getCurrentLongTimezone(),
          payment_source: paymentSource.PASS,
          source_id: usersPass.pass_order_id,
        };

        showPaymentPopup(paymentPopupData, async () => await bookClassUsingPass(payload));
      } else {
        const paymentPopupData = {
          productId: selectedPass.external_id,
          productType: 'PASS',
          itemList: [
            {
              name: selectedPass.name,
              description: `${selectedPass.class_count} Credits, Valid for ${selectedPass.validity} days`,
              currency: selectedPass.currency,
              price: selectedPass.price,
            },
            {
              name: classDetails.name,
              description: toLongDateWithTime(selectedInventory.start_time),
              currency: classDetails.currency,
              price: 0,
            },
          ],
        };

        const payload = {
          pass_id: selectedPass.id,
          price: selectedPass.price,
          currency: selectedPass.currency.toLowerCase(),
        };

        showPaymentPopup(
          paymentPopupData,
          async (couponCode = '') => await buyPassAndBookClass({ ...payload, coupon_code: couponCode }, couponCode)
        );
      }
    } else {
      let paymentPopupData = null;
      if (!usableUserSubscription && userPasses.length === 0 && availablePasses.length === 0) {
        // In this case, the UI will be simple and won't show some table and input
        // so we need to pass the information to PaymentPopup to tell it that
        // they should handle the price input (if it's a PWYW session)
        let flexiblePaymentDetails = null;

        if (classDetails.pay_what_you_want) {
          flexiblePaymentDetails = {
            enabled: true,
            minimumPrice: classDetails.price,
          };
        }

        paymentPopupData = {
          productId: classDetails.session_external_id,
          productType: 'SESSION',
          itemList: [
            {
              name: classDetails.name,
              description: toLongDateWithTime(selectedInventory.start_time),
              currency: classDetails.currency,
              price: classDetails.price,
              pay_what_you_want: classDetails.pay_what_you_want,
            },
          ],
          flexiblePaymentDetails,
        };
      } else {
        // Else the price input will be handled in the page
        // So just show usual PaymentPopup
        paymentPopupData = {
          productId: classDetails.session_external_id,
          productType: 'SESSION',
          itemList: [
            {
              name: classDetails.name,
              description: toLongDateWithTime(selectedInventory.start_time),
              currency: classDetails.currency,
              price: inputPrice || classDetails.price,
            },
          ],
        };
      }

      // Default case, book single class;
      const payload = {
        inventory_id: parseInt(selectedInventory.inventory_id),
        user_timezone_offset: new Date().getTimezoneOffset(),
        user_timezone_location: getTimezoneLocation(),
        user_timezone: getCurrentLongTimezone(),
        payment_source: paymentSource.GATEWAY,
      };

      showPaymentPopup(
        paymentPopupData,
        async (couponCode = '', priceAmount = undefined) => await buySingleClass(payload, couponCode, priceAmount)
      );
    }
  };

  const submitForm = async (values) => {
    setIsLoading(true);
    try {
      if (userDetails) {
        // User already logged in, proceed to session booking
        showConfirmPaymentPopup();
      } else {
        // Sign Up Process
        signupUser(values);
      }
    } catch (error) {
      if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }

    setIsLoading(false);
  };

  const handleFormSubmit = async (values) => {
    setShowLegalsErrorMessage(false);

    if (!legalsAccepted) {
      setShowLegalsErrorMessage(true);
      return;
    }

    submitForm(values);
  };

  //#endregion END OF Business Logic

  return (
    <Loader loading={isLoading} size="large" text="Processing...">
      <Row justify="space-between" className={styles.mt20} gutter={8}>
        {shouldShowSignInForm ? (
          <Col
            xs={24}
            lg={{ span: 14, offset: isMobileDevice ? 1 : 0 }}
            order={isMobileDevice ? 2 : 1}
            className={isMobileDevice ? styles.mt20 : styles.mt50}
          >
            <SignInForm user={user} hideSignInForm={hideSignInForm} />
          </Col>
        ) : (
          <>
            <Col
              xs={24}
              lg={{ span: 14, offset: isMobileDevice ? 1 : 0 }}
              order={isMobileDevice ? 2 : 1}
              className={isMobileDevice ? styles.mt20 : styles.mt50}
            >
              <div className={classNames(styles.box, styles.p50, styles.mb20)}>
                <Row>
                  <Col xs={24}>
                    <Title level={3}>Registration</Title>
                  </Col>
                  <Col xs={24}>
                    <Text>
                      <a href="https://zoom.us/download"> Zoom </a> details to join will be sent over email and are
                      always available in your
                      <a
                        href={`${generateUrlFromUsername('app')}${Routes.attendeeDashboard.rootPath}${
                          Routes.attendeeDashboard.defaultPath
                        }`}
                      >
                        {' '}
                        dashboard
                      </a>
                      .
                    </Text>
                  </Col>
                  <Col xs={24} className={styles.mt10}>
                    {/* Form used to handle both Sign Up and Session Booking */}
                    <Form
                      form={form}
                      initialValues={formInitialValues}
                      labelAlign="left"
                      {...sessionRegistrationformLayout}
                      onFinish={handleFormSubmit}
                      scrollToFirstError={true}
                    >
                      {!user && (
                        <Item label="Name" className={styles.nameInputWrapper} required>
                          <Item className={styles.nameInput} name="first_name" rules={validationRules.nameValidation}>
                            <Input placeholder="First Name" />
                          </Item>
                          <Item className={styles.nameInput} name="last_name" rules={validationRules.nameValidation}>
                            <Input placeholder="Last Name" />
                          </Item>
                        </Item>
                      )}

                      <Item
                        className={styles.emailInput}
                        label="Email"
                        name="email"
                        rules={validationRules.emailValidation}
                      >
                        <Input placeholder="Enter your email" disabled={user} />
                      </Item>

                      <Row gutter={[8, 8]}>
                        {showLegalsErrorMessage && (
                          <Col xs={24} md={{ offset: 6, span: 18 }} xl={{ offset: 4, span: 20 }}>
                            <Text type="danger" className={styles.smallText}>
                              To proceed, you need to check the checkbox below
                            </Text>
                          </Col>
                        )}
                        <Col xs={24} md={{ offset: 6, span: 18 }} xl={{ offset: 4, span: 20 }}>
                          <TermsAndConditionsText
                            shouldCheck={true}
                            isChecked={legalsAccepted}
                            setChecked={(checked) => setLegalsAccepted(checked)}
                          />
                        </Col>
                      </Row>

                      <Item {...sessionRegistrationTailLayout}>
                        <Button
                          className={styles.linkBtn}
                          type="link"
                          onClick={() => (user ? logOut() : showSignInForm())}
                        >
                          {user ? 'Not this account? Logout' : 'Already have an account? Sign In'}
                        </Button>
                      </Item>

                      {user && usableUserSubscription ? (
                        // Render help text that this session will be booked using user's subscription
                        <Row className={styles.mt10}>
                          <Paragraph>
                            Booking {selectedInventory ? toLongDateWithTime(selectedInventory.start_time) : 'this'}{' '}
                            class for{' '}
                            <Text delete>
                              {classDetails?.price} {classDetails?.currency.toUpperCase()}
                            </Text>
                            <Text strong> {`0 ${classDetails?.currency.toUpperCase()}`} </Text> using your purchased
                            subscription
                            <Text strong> {usableUserSubscription.subscription_name} </Text>
                          </Paragraph>
                        </Row>
                      ) : user && userPasses.length > 0 ? (
                        // Render User's Purchased Passes that's usable to book this session
                        <>
                          <div>
                            <Title level={5}> Purchased pass(es) usable for this class </Title>
                            {isMobileDevice ? (
                              userPasses.map(renderUserPassItem)
                            ) : (
                              <Table
                                size="small"
                                columns={userPassesColumns}
                                data={userPasses}
                                rowKey={(record) => record.pass_order_id}
                              />
                            )}
                          </div>
                          {selectedInventory && selectedPass && (
                            <Row className={styles.mt10}>
                              <Paragraph>
                                Booking {selectedInventory ? toLongDateWithTime(selectedInventory.start_time) : 'this'}{' '}
                                class for{' '}
                                <Text delete>
                                  {classDetails?.price} {classDetails?.currency.toUpperCase()}
                                </Text>
                                <Text strong> {`0 ${classDetails?.currency.toUpperCase()}`} </Text> using your purchased
                                pass
                                <Text strong> {selectedPass.name} </Text>
                              </Paragraph>
                            </Row>
                          )}
                        </>
                      ) : (
                        // Render single session buy option as a separate option
                        // Below that, render Passes that the user can purchase to book this session
                        <>
                          {availablePasses.length > 0 ? (
                            <>
                              <div>
                                <Title level={5}>
                                  {' '}
                                  Book {selectedInventory
                                    ? toLongDateWithTime(selectedInventory.start_time)
                                    : 'this'}{' '}
                                  class{' '}
                                </Title>
                                <Table
                                  size="small"
                                  showHeader={false}
                                  columns={singleClassColumns}
                                  data={[classDetails]}
                                  rowKey={(record) => 'dropIn'}
                                />
                              </div>

                              <div className={styles.mt20}>
                                <Title level={5}>
                                  {' '}
                                  Buy pass & book{' '}
                                  {selectedInventory ? toLongDateWithTime(selectedInventory.start_time) : 'this'} class
                                </Title>
                                {isMobileDevice ? (
                                  availablePasses.map(renderPassItem)
                                ) : (
                                  <Table
                                    size="small"
                                    columns={passesColumns}
                                    data={availablePasses}
                                    rowKey={(record) => record.id}
                                    expandable={{
                                      expandedRowRender: renderPassDetails,
                                      expandIconColumnIndex: -1,
                                      expandedRowKeys: expandedRowKeys,
                                    }}
                                  />
                                )}
                              </div>
                            </>
                          ) : (
                            // Render simple help text if no passes are available for class
                            <Item {...sessionRegistrationTailLayout}>
                              <Title level={5}>
                                Book {selectedInventory ? toLongDateWithTime(selectedInventory.start_time) : 'this'}{' '}
                                class
                              </Title>
                            </Item>
                          )}
                        </>
                      )}

                      <div className={styles.mt10}>
                        <Item {...sessionRegistrationTailLayout}>
                          <Row gutter={[8, 8]}>
                            <Col xs={8} md={8} xl={6}>
                              <Button block size="large" type="primary" htmlType="submit" disabled={!selectedInventory}>
                                {user &&
                                classDetails?.price > 0 &&
                                !(selectedPass && userPasses.length > 0) &&
                                !usableUserSubscription
                                  ? 'Buy'
                                  : 'Register'}
                              </Button>
                            </Col>
                            {!selectedInventory && (
                              <Col xs={24}>
                                <Paragraph>
                                  Please select the date & time for the class you wish to attend
                                  {isMobileDevice ? '' : ', in the calendar on the right'}
                                </Paragraph>
                              </Col>
                            )}
                          </Row>
                        </Item>
                      </div>
                    </Form>
                  </Col>
                </Row>
              </div>
            </Col>
            {!isInventoryDetails && (
              <Col
                xs={24}
                lg={{ span: 9, offset: isMobileDevice ? 0 : 1 }}
                order={isMobileDevice ? 1 : 2}
                className={isMobileDevice ? styles.mt20 : styles.mt50}
              >
                <SessionInventorySelect
                  inventories={
                    classDetails?.inventory.sort((a, b) =>
                      a.start_time > b.start_time ? 1 : b.start_time > a.start_time ? -1 : 0
                    ) || []
                  }
                  selectedSlot={selectedInventory}
                  handleSubmit={(val) => {
                    setSelectedInventory(val);
                  }}
                />
              </Col>
            )}
          </>
        )}
      </Row>
    </Loader>
  );
};

export default SessionRegistration;
