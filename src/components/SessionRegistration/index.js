import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Row, Col, Button, Form, Input, Typography, Tag } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

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
  formatDate: { toShortDate },
} = dateUtil;

const SessionRegistration = ({
  onFinish,
  showPasswordField,
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
      render: (text, record) => (
        <div className={selectedPass ? styles.roundBtn : styles.roundBtnActive} onClick={() => setSelectedPass(null)} />
      ),
    },
    {
      title: '',
      dataIndex: 'name',
      key: 'name',
      align: 'left',
      width: '80%',
    },
    {
      title: '',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      width: '20%',
      render: (text, record) => `${record.price} ${record.currency}`,
    },
  ];

  const passesColumns = [
    {
      title: '',
      dataIndex: 'id',
      key: 'id',
      width: '18px',
      render: (text, record) => (
        <div
          className={selectedPass?.id === record.id ? styles.roundBtnActive : styles.roundBtn}
          onClick={() => setSelectedPass(record)}
        />
      ),
    },
    {
      title: 'Pass Name',
      dataIndex: 'name',
      key: 'name',
      width: '50%',
    },
    {
      title: 'Validity',
      dataIndex: 'validity',
      key: 'validity',
      align: 'right',
      width: '13%',
      render: (text, record) => `${record.validity} day${parseInt(record.validity) > 1 ? 's' : ''}`,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      sortOrder: 'descend',
      width: '13%',
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
          <Button type="link" onClick={() => collapseRow(record.id)}>
            {btnText} <UpOutlined />
          </Button>
        ) : (
          <Button type="link" onClick={() => expandRow(record.id)}>
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
          className={selectedPass?.id === record.id ? styles.roundBtnActive : styles.roundBtn}
          onClick={() => setSelectedPass(record)}
        />
      ),
    },
    {
      title: 'Pass Name',
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

  const renderClassesList = (record) => (
    <Row>
      <Col xs={24}>
        <Text className={styles.ml20}> Applicable to below class(es) </Text>
      </Col>
      <Col xs={24}>
        <div className={classNames(styles.ml20, styles.mt10)}>
          {record.sessions.slice(0, 11).map((session) => (
            <Tag color="blue"> {session.name} </Tag>
          ))}
        </div>
      </Col>
    </Row>
  );

  return (
    <div className={classNames(styles.box, styles.p50, styles.mb20)}>
      <Row>
        <Col xs={24} md={24}>
          <Title level={3}>Registration</Title>
        </Col>
        <Col xs={24} md={24}>
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
        <Col xs={24} md={24} className={styles.mt10}>
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
                  <div className={styles.passwordHelpText}>
                    <Text>
                      You have booked a session with us earlier, but if you haven't set your password, please{' '}
                      <Text className={styles.linkButton} onClick={() => onSetNewPassword(form.getFieldsValue().email)}>
                        set a new password
                      </Text>
                    </Text>
                  </div>
                </Item>
              </>
            )}

            <Item {...sessionRegistrationTailLayout}>
              {user ? (
                <Button type="link" onClick={() => logOut()}>
                  Not this account? Logout
                </Button>
              ) : (
                <Button type="link" onClick={() => showSignInForm()}>
                  Already have an account? Sign In
                </Button>
              )}
            </Item>

            {user && userPasses.length > 0 ? (
              <div>
                <Title level={5}> Purchased pass(es) usable for this class </Title>
                <Table
                  columns={userPassesColumns}
                  data={userPasses}
                  rowKey={(record) => record.pass_order_id}
                  rowSelection={{
                    hideSelectAll: true,
                    selectedRowKeys: selectedPass ? [selectedPass.pass_order_id] : [],
                    type: 'radio',
                    onSelect: (record, selected, _, e) => {
                      if (selected) {
                        setSelectedPass(record);
                      }
                    },
                  }}
                />
              </div>
            ) : (
              <>
                {availablePasses.length > 0 && (
                  <>
                    <div>
                      <Title level={5}> Book this class </Title>
                      <Table
                        showHeader={false}
                        columns={singleClassColumns}
                        data={[classDetails]}
                        rowKey={(record) => 'dropIn'}
                      />
                    </div>

                    <div className={styles.mt20}>
                      <Title level={5}> Buy pass & book this class </Title>
                      <Table
                        columns={passesColumns}
                        data={availablePasses}
                        rowKey={(record) => record.id}
                        expandable={{
                          expandedRowRender: renderClassesList,
                          expandIconColumnIndex: -1,
                          expandedRowKeys: expandedRowKeys,
                        }}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <Row className={styles.mt10}>
              {user && selectedPass && userPasses.length > 0 && (
                <Paragraph>
                  Booking this class for{' '}
                  <Text delete>
                    {' '}
                    {classDetails.price} {classDetails.currency}{' '}
                  </Text>
                  <Text strong> {`0 ${classDetails.currency}`} </Text> using your purchased pass{' '}
                  <Text strong> {selectedPass.name} </Text>
                </Paragraph>
              )}
            </Row>

            <Item {...sessionRegistrationTailLayout}>
              <Row className={styles.mt10}>
                <Col>
                  <Button type="primary" htmlType="submit" disabled={!selectedInventory}>
                    {user ? 'Buy' : 'Register'}
                  </Button>
                </Col>
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
