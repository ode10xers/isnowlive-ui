import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import MobileDetect from 'mobile-detect';

import { Row, Col, Button, Form, Input, Typography, Tag, Card } from 'antd';
import { DownOutlined, UpOutlined, CheckCircleTwoTone } from '@ant-design/icons';

import Routes from 'routes';

import Table from 'components/Table';

import dateUtil from 'utils/date';
import validationRules from 'utils/validation';
import { generateUrlFromUsername, scrollToErrorField } from 'utils/helper';
import { redirectToSessionsPage, redirectToVideosPage } from 'utils/redirect';

import { sessionRegistrationformLayout, sessionRegistrationTailLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';
import TermsAndConditionsText from 'components/TermsAndConditionsText';

const { Title, Text, Paragraph } = Typography;
const { Item } = Form;
const { Password } = Input;

const {
  formatDate: { toShortDate, toLongDateWithTime },
} = dateUtil;

const SessionRegistration = ({
  onFinish,
  showPasswordField,
  incorrectPassword = false,
  user,
  onSetNewPassword,
  showSignInForm,
  availablePasses = [],
  userPasses = [],
  setSelectedPass,
  selectedPass = null,
  selectedInventory,
  userSubscription = null,
  classDetails,
  logOut,
  priceInputComponent = null,
  isValidPrice = true,
}) => {
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());

  const [form] = Form.useForm();
  const passwordInput = useRef(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [legalsAccepted, setLegalsAccepted] = useState(false);
  const [showLegalsErrorMessage, setShowLegalsErrorMessage] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue(user);
      setLegalsAccepted(true);
      setShowLegalsErrorMessage(false);
    }
  }, [user, form]);

  useEffect(() => {
    if (showPasswordField && passwordInput.current) {
      passwordInput.current.focus();
    }
  }, [showPasswordField]);

  const onFinishFailed = ({ errorFields }) => {
    scrollToErrorField(errorFields);
  };

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
      render: (text, record) =>
        selectedPass ? (
          <div className={styles.roundBtn} onClick={() => setSelectedPass(null)} />
        ) : (
          <div onClick={() => setSelectedPass(null)}>
            <CheckCircleTwoTone twoToneColor="#52c41a" />
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
      render: (text, record) => priceInputComponent || `${record.price} ${record.currency.toUpperCase()}`,
    },
  ];

  const passesColumns = [
    {
      title: '',
      dataIndex: 'id',
      key: 'id',
      width: '16px',
      render: (text, record) =>
        selectedPass?.id === record.id ? (
          <div onClick={() => setSelectedPass(record)}>
            <CheckCircleTwoTone twoToneColor="#52c41a" />
          </div>
        ) : (
          <div className={styles.roundBtn} onClick={() => setSelectedPass(record)} />
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
      render: (text, record) =>
        selectedPass?.id === record.id ? (
          <div onClick={() => setSelectedPass(record)}>
            <CheckCircleTwoTone twoToneColor="#52c41a" />
          </div>
        ) : (
          <div className={styles.roundBtn} onClick={() => setSelectedPass(record)} />
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
                {selectedPass?.id === pass.id ? (
                  <div onClick={() => setSelectedPass(pass)}>
                    <CheckCircleTwoTone twoToneColor="#52c41a" />
                  </div>
                ) : (
                  <div className={styles.roundBtn} onClick={() => setSelectedPass(pass)} />
                )}
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
                {selectedPass?.id === pass.id ? (
                  <div onClick={() => setSelectedPass(pass)}>
                    <CheckCircleTwoTone twoToneColor="#52c41a" />
                  </div>
                ) : (
                  <div className={styles.roundBtn} onClick={() => setSelectedPass(pass)} />
                )}
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

  const handleFormSubmit = (values) => {
    setShowLegalsErrorMessage(false);

    if (!legalsAccepted) {
      setShowLegalsErrorMessage(true);
      return;
    }

    onFinish(values);
  };

  return (
    <div className={classNames(styles.box, styles.p50, styles.mb20)}>
      <Row>
        <Col xs={24}>
          <Title level={3}>Registration</Title>
        </Col>
        <Col xs={24}>
          <Text>
            <a href="https://zoom.us/download"> Zoom </a> details to join will be sent over email and are always
            available in your
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
          <Form
            form={form}
            labelAlign="left"
            {...sessionRegistrationformLayout}
            onFinish={handleFormSubmit}
            onFinishFailed={onFinishFailed}
          >
            {!user && (
              <Item label="Name" className={styles.nameInputWrapper}>
                <Item className={styles.nameInput} name="first_name" rules={validationRules.nameValidation}>
                  <Input placeholder="First Name" disabled={showPasswordField} />
                </Item>
                <Item className={styles.nameInput} name="last_name" rules={validationRules.nameValidation}>
                  <Input placeholder="Last Name" disabled={showPasswordField} />
                </Item>
              </Item>
            )}

            <Item className={styles.emailInput} label="Email" name="email" rules={validationRules.emailValidation}>
              <Input placeholder="Enter your email" disabled={user} />
            </Item>

            {showPasswordField && (
              <>
                <Item
                  className={styles.passwordInput}
                  label="Password"
                  name="password"
                  rules={validationRules.passwordValidation}
                  ref={passwordInput}
                >
                  <Password />
                </Item>
                <Item {...sessionRegistrationTailLayout}>
                  {incorrectPassword ? (
                    <Text type="danger">Email or password you entered was incorrect, please try again</Text>
                  ) : (
                    <div className={styles.passwordHelpText}>
                      <Text>
                        You have booked a session with us earlier, but if you haven't set your password, please{' '}
                        <Button
                          type="link"
                          className={classNames(styles.setNewPassword, styles.linkBtn)}
                          onClick={() => onSetNewPassword(form.getFieldsValue().email)}
                        >
                          set a new password
                        </Button>
                      </Text>
                    </div>
                  )}
                </Item>
              </>
            )}

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
              {user ? (
                <Button className={styles.linkBtn} type="link" onClick={() => logOut()}>
                  Not this account? Logout
                </Button>
              ) : (
                <Button className={styles.linkBtn} type="link" onClick={() => showSignInForm()}>
                  Already have an account? Sign In
                </Button>
              )}
            </Item>

            {user && userSubscription ? (
              // Render help text that this session will be booked using user's subscription
              <Row className={styles.mt10}>
                <Paragraph>
                  Booking {selectedInventory ? toLongDateWithTime(selectedInventory.start_time) : 'this'} class for{' '}
                  <Text delete>
                    {classDetails?.price} {classDetails?.currency.toUpperCase()}
                  </Text>
                  <Text strong> {`0 ${classDetails?.currency.toUpperCase()}`} </Text> using your purchased subscription
                  <Text strong> {userSubscription.subscription_name} </Text>
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
                      Booking {selectedInventory ? toLongDateWithTime(selectedInventory.start_time) : 'this'} class for{' '}
                      <Text delete>
                        {classDetails?.price} {classDetails?.currency.toUpperCase()}
                      </Text>
                      <Text strong> {`0 ${classDetails?.currency.toUpperCase()}`} </Text> using your purchased pass
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
                        Book {selectedInventory ? toLongDateWithTime(selectedInventory.start_time) : 'this'} class{' '}
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
                        Buy pass & book {selectedInventory
                          ? toLongDateWithTime(selectedInventory.start_time)
                          : 'this'}{' '}
                        class
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
                      Book {selectedInventory ? toLongDateWithTime(selectedInventory.start_time) : 'this'} class
                    </Title>
                  </Item>
                )}
              </>
            )}

            <div className={styles.mt10}>
              <Item {...sessionRegistrationTailLayout}>
                <Row gutter={[8, 8]}>
                  <Col xs={8} md={8} xl={6}>
                    <Button
                      block
                      size="large"
                      type="primary"
                      htmlType="submit"
                      disabled={!selectedInventory || (!selectedPass && !isValidPrice)}
                    >
                      {user && classDetails?.price > 0 && !(selectedPass && userPasses.length > 0) && !userSubscription
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
  );
};

SessionRegistration.defaultProps = {
  user: {},
};

SessionRegistration.propTypes = {
  onFinish: PropTypes.func.isRequired,
  showPasswordField: PropTypes.bool.isRequired,
  user: PropTypes.object,
  onSetNewPassword: PropTypes.func.isRequired,
};

export default SessionRegistration;
