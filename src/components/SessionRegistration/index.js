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
import { sessionRegistrationformLayout, sessionRegistrationTailLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';

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
  classDetails,
  logOut,
}) => {
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());

  const [form] = Form.useForm();
  const passwordInput = useRef(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  useEffect(() => {
    if (user) {
      form.setFieldsValue(user);
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
      render: (text, record) => `${record.price} ${record.currency}`,
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
      render: (text, record) => `${record.validity} day`,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      width: '15%',
      render: (text, record) => `${text} ${record.currency}`,
    },
    {
      title: 'Class Count',
      dataIndex: 'class_count',
      key: 'class_count',
      align: 'right',
      render: (text, record) => {
        const btnText = record.limited
          ? record.user_usable
            ? `${record.classes_remaining}/${record.class_count} remaining `
            : `${record.class_count} Classes `
          : 'Unlimited Classes ';

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
      title: 'Classes Left',
      dataIndex: 'classes_remaining',
      key: 'classes_remaining',
      width: '20%',
      render: (text, record) => `${record.classes_remaining}/${record.class_count}`,
    },
    {
      title: 'Valid Till',
      dataIndex: 'expiry',
      key: 'expiry',
      width: '20%',
      render: (text, record) => toShortDate(record.expiry),
    },
  ];

  const redirectToSessionsPage = (session) => {
    const baseUrl = generateUrlFromUsername(session.username || window.location.hostname.split('.')[0] || 'app');
    window.open(`${baseUrl}/s/${session.session_id}`);
  };

  const renderClassesList = (record) => (
    <Row>
      <Col xs={24}>
        <Text className={styles.ml20}> Applicable to below class(es) </Text>
      </Col>
      <Col xs={24}>
        <div className={classNames(styles.ml20, styles.mt10)}>
          {record.sessions.map((session) => (
            <Tag color="blue" onClick={() => redirectToSessionsPage(session)}>
              {' '}
              {session.name}{' '}
            </Tag>
          ))}
        </div>
      </Col>
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
      <div>
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
          {layout('Pass Count', <Text>{pass.limited ? `${pass.class_count} Classes` : 'Unlimited Classes'}</Text>)}
          {layout('Validity', <Text>{`${pass.validity} day`}</Text>)}
          {layout('Price', <Text>{`${pass.price} ${pass.currency}`}</Text>)}
        </Card>
        {expandedRowKeys.includes(pass.id) && (
          <Row className={styles.cardExpansion}>
            <Col xs={24}>
              <Text className={styles.ml20}> Applicable to below class(es) </Text>
            </Col>
            <Col xs={24}>
              <div className={classNames(styles.ml20, styles.mt10)}>
                {pass.sessions.map((session) => (
                  <Tag color="blue" onClick={() => redirectToSessionsPage(session)}>
                    {' '}
                    {session.name}{' '}
                  </Tag>
                ))}
              </div>
            </Col>
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
      <div>
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
          {layout('Classes Left', <Text>{`${pass.classes_remaining}/${pass.class_count}`}</Text>)}
          {layout('Expiry', <Text>{toShortDate(pass.expiry)}</Text>)}
        </Card>
        {expandedRowKeys.includes(pass.id) && (
          <Row className={styles.cardExpansion}>
            <Col xs={24}>
              <Text className={styles.ml20}> Applicable to below class(es) </Text>
            </Col>
            <Col xs={24}>
              <div className={classNames(styles.ml20, styles.mt10)}>
                {pass.sessions.map((session) => (
                  <Tag color="blue" onClick={() => redirectToSessionsPage(session)}>
                    {' '}
                    {session.name}{' '}
                  </Tag>
                ))}
              </div>
            </Col>
          </Row>
        )}
      </div>
    );
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
            onFinish={onFinish}
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
                        <Text className={styles.linkBtn} onClick={() => onSetNewPassword(form.getFieldsValue().email)}>
                          set a new password
                        </Text>
                      </Text>
                    </div>
                  )}
                </Item>
              </>
            )}

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

            {user && userPasses.length > 0 ? (
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
            ) : (
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
                            expandedRowRender: renderClassesList,
                            expandIconColumnIndex: -1,
                            expandedRowKeys: expandedRowKeys,
                          }}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <Item {...sessionRegistrationTailLayout}>
                    <Title level={5}>
                      Book {selectedInventory ? toLongDateWithTime(selectedInventory.start_time) : 'this'} class
                    </Title>
                  </Item>
                )}
              </>
            )}

            <Row className={styles.mt10}>
              {user && selectedInventory && selectedPass && userPasses.length > 0 && (
                <Paragraph>
                  Booking {selectedInventory ? toLongDateWithTime(selectedInventory.start_time) : 'this'} class for
                  <Text delete>
                    {classDetails.price} {classDetails.currency}
                  </Text>
                  <Text strong> {`0 ${classDetails.currency}`} </Text> using your purchased pass
                  <Text strong> {selectedPass.name} </Text>
                </Paragraph>
              )}
            </Row>

            <Item {...sessionRegistrationTailLayout}>
              <Row className={styles.mt10} gutter={[8, 8]}>
                <Col xs={8} md={8} xl={5}>
                  <Button block size="large" type="primary" htmlType="submit" disabled={!selectedInventory}>
                    {user ? 'Buy' : 'Register'}
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
