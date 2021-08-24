import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import { Row, Col, Button, Form, Input, Typography, Tag, Card, message, InputNumber } from 'antd';
import { DownOutlined, UpOutlined, CheckCircleTwoTone } from '@ant-design/icons';

import Routes from 'routes';

import Table from 'components/Table';
import SignInForm from 'components/SignInForm';
import SessionInventorySelect from 'components/SessionInventorySelect';
import TermsAndConditionsText from 'components/TermsAndConditionsText';

import dateUtil from 'utils/date';
import validationRules from 'utils/validation';
import { isMobileDevice } from 'utils/device';
import { generateUrlFromUsername, getUsernameFromUrl } from 'utils/helper';
import { redirectToSessionsPage, redirectToVideosPage } from 'utils/redirect';

import { sessionRegistrationformLayout, sessionRegistrationTailLayout } from 'layouts/FormLayouts';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const { Title, Text, Paragraph } = Typography;
const { Item } = Form;

const {
  formatDate: { toLongDateWithTime },
  timeCalculation: { isBeforeDate },
} = dateUtil;

const formInitialValues = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  pwyw_price: null,
};

// NOTE : Mostly similar to SessionRegistration Component
// The difference is buy logic is removed, and no fetching user passes/subscriptions
const SessionRegistrationPreview = ({
  availablePasses = [],
  classDetails,
  isInventoryDetails = false,
  fullWidth = false,
}) => {
  const {
    state: { userDetails },
    logOut,
  } = useGlobalContext();
  const [form] = Form.useForm();

  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [legalsAccepted, setLegalsAccepted] = useState(false);
  const [showLegalsErrorMessage, setShowLegalsErrorMessage] = useState(false);
  const [inputPrice, setInputPrice] = useState(null);

  const [shouldShowSignInForm, setShouldShowSignInForm] = useState(false);
  const [user, setUser] = useState(null);

  const [selectedPass, setSelectedPass] = useState(null);
  const [selectedInventory, setSelectedInventory] = useState(null);

  //#region START OF Helper Functions

  const hideSignInForm = () => {
    setShouldShowSignInForm(false);
  };

  const showSignInForm = () => {
    setShouldShowSignInForm(true);
    form.resetFields();
    setUser(null);
  };
  //#endregion END OF Helper Functions

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

  // Logic that runs when user logs in/out
  useEffect(() => {
    if (userDetails) {
      // Set the state in the form properly
      form.setFieldsValue(userDetails);
      setLegalsAccepted(true);
      setShowLegalsErrorMessage(false);
      setUser(userDetails);
    } else {
      form.resetFields();
      setUser(null);
    }
    //eslint-disable-next-line
  }, [userDetails]);

  //#region START OF Columns and UI Items

  const expandRow = (rowKey) => {
    const tempExpandedRowsArray = expandedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRow = (rowKey) => setExpandedRowKeys(expandedRowKeys.filter((key) => key !== rowKey));

  const handlePWYWInputPriceChange = async (value) => {
    form.setFieldsValue({ ...form.getFieldsValue(), pwyw_price: value });
    setInputPrice(value);
    await form.validateFields(['pwyw_price']);
  };

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
      width: '180px',
      render: (text, record) => (record.pay_what_you_want ? 'Pay what you value this session' : text),
    },
    {
      title: '',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      width: '50%',
      render: (text, record) =>
        record.pay_what_you_want ? (
          <Item wrapperCol={24} className={styles.pwywInputWrapper}>
            <Item
              wrapperCol={24}
              name="pywy_price"
              noStyle
              rules={
                !selectedPass
                  ? validationRules.numberValidation(
                      `Please input valid price (min. ${record.price})`,
                      record.price,
                      false
                    )
                  : []
              }
            >
              <InputNumber
                min={1}
                size="small"
                value={inputPrice}
                className={classNames(styles.compactNumericalInput, inputPrice ? undefined : styles.highlightInput)}
                onChange={handlePWYWInputPriceChange}
              />
            </Item>
            <span className="ant-form-text"> {record.currency.toUpperCase()} </span>
          </Item>
        ) : record.total_price > 0 ? (
          `${record.total_price} ${record.currency.toUpperCase()}`
        ) : (
          'Free'
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
      render: (text, record) =>
        record.total_price > 0 ? `${record.total_price} ${record.currency.toUpperCase()}` : 'Free',
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
          {layout('Price', <Text>{`${pass.total_price} ${pass.currency.toUpperCase()}`}</Text>)}
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

  //#endregion END OF Columns and UI Items

  const submitForm = async (values) => {
    message.info('This page is just a preview, so you cannot buy this product');
  };

  const handleFormSubmit = async (values) => {
    setShowLegalsErrorMessage(false);

    if (!legalsAccepted) {
      setShowLegalsErrorMessage(true);
      return;
    }

    submitForm(values);
  };

  return (
    <Row justify="space-between" className={styles.mt20} gutter={8}>
      {shouldShowSignInForm ? (
        <Col
          xs={24}
          lg={fullWidth ? 24 : { span: 14, offset: isMobileDevice ? 1 : 0 }}
          order={isMobileDevice ? 2 : 1}
          className={isMobileDevice ? styles.mt20 : styles.mt50}
        >
          <SignInForm user={user} hideSignInForm={hideSignInForm} />
        </Col>
      ) : (
        <>
          <Col
            xs={24}
            lg={fullWidth ? 24 : { span: 14, offset: isMobileDevice ? 1 : 0 }}
            order={isMobileDevice ? 2 : 1}
            className={isMobileDevice ? styles.mt20 : styles.mt50}
          >
            <div className={styles.sessionRegistrationWrapper}>
              <Row>
                <Col xs={24}>
                  <Title level={3} className={styles.registrationTitle}>
                    Registration
                  </Title>
                </Col>
                <Col xs={24}>
                  <Text className={styles.registrationHelpText}>
                    <a href="https://zoom.us/download"> Zoom </a> details to join will be sent over email and are always
                    available in your
                    <a
                      href={`${generateUrlFromUsername(
                        classDetails?.creator_username ?? classDetails?.username ?? getUsernameFromUrl()
                      )}${Routes.attendeeDashboard.rootPath}${Routes.attendeeDashboard.defaultPath}`}
                    >
                      {' '}
                      dashboard
                    </a>
                    .
                  </Text>
                </Col>
                <Col xs={24} className={styles.formContainer}>
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

                    {/* Render single session buy option as a separate option
                      Below that, render Passes that the user can purchase to book this session */}
                    {availablePasses.length > 0 ? (
                      <>
                        <div>
                          <Title level={5}>
                            {' '}
                            Book {selectedInventory
                              ? toLongDateWithTime(selectedInventory.start_time)
                              : 'this'} class{' '}
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
                        <Title level={5} className={styles.bookingHelpText}>
                          Book {selectedInventory ? toLongDateWithTime(selectedInventory.start_time) : 'this'} class
                        </Title>
                      </Item>
                    )}

                    <div className={styles.mt10}>
                      <Item {...sessionRegistrationTailLayout}>
                        <Row gutter={[8, 8]}>
                          <Col xs={fullWidth ? 24 : 8} md={fullWidth ? 24 : 8} xl={fullWidth ? 24 : 6}>
                            <Button
                              block
                              className={styles.bookBtn}
                              size="large"
                              type="primary"
                              htmlType="submit"
                              disabled={!selectedInventory}
                            >
                              {user && classDetails?.total_price > 0 ? 'Buy' : 'Register'}
                            </Button>
                          </Col>
                          {!selectedInventory && (
                            <Col xs={24}>
                              <Paragraph>
                                Please select the date & time for the class you wish to attend
                                {isMobileDevice ? '' : ', in the calendar on the side'}
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
  );
};

export default SessionRegistrationPreview;
