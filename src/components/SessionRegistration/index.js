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

const { Title, Text } = Typography;
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
  setSelectedPass,
  selectedPass = null,
  classDetails,
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
      title: 'Pass Name',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
    },
    {
      title: 'Pass Count',
      dataIndex: 'class_count',
      key: 'class_count',
      align: 'right',
      width: '30%',
      render: (text, record) =>
        record.limited
          ? record.user_usable
            ? `${record.classes_remaining}/${record.class_count} remaining`
            : `${record.class_count} Classes`
          : 'Unlimited Classes',
    },
    {
      title: 'Validity',
      dataIndex: 'validity',
      key: 'validity',
      align: 'center',
      width: '15%',
      render: (text, record) => {
        if (record.user_usable) {
          return {
            props: { colSpan: 2 },
            children: `Before ${toShortDate(record.expiry)}`,
          };
        } else {
          return `${text} day${parseInt(text) > 1 ? 's' : ''}`;
        }
      },
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      sortOrder: 'descend',
      width: '15%',
      render: (text, record) => {
        if (record.user_usable) {
          return {
            props: { colSpan: 0 },
            children: '',
          };
        } else {
          return `${text} ${record.currency}`;
        }
      },
    },
    {
      title: '',
      align: 'right',
      render: (text, record) =>
        expandedRowKeys.includes(record.id) ? (
          <Button type="link" onClick={() => collapseRow(record.id)} icon={<UpOutlined />}>
            Close
          </Button>
        ) : (
          <Button type="link" onClick={() => expandRow(record.id)} icon={<DownOutlined />}>
            More
          </Button>
        ),
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
    <div className={classNames(styles.box, styles.p50)}>
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
            <Item label="Name" className={styles.nameInputWrapper}>
              <Item className={styles.nameInput} name="first_name" rules={validationRules.nameValidation}>
                <Input placeholder="First Name" disabled={showPasswordField} />
              </Item>
              <Item className={styles.nameInput} name="last_name" rules={validationRules.nameValidation}>
                <Input placeholder="Last Name" disabled={showPasswordField} />
              </Item>
            </Item>

            <Item className={styles.emailInput} label="Email" name="email" rules={validationRules.emailValidation}>
              <Input placeholder="Enter your email" disabled={showPasswordField} />
            </Item>

            {showPasswordField && (
              <>
                <Item
                  className={styles.emailInput}
                  extra={
                    <Text className={styles.passwordHelpText}>
                      You have booked a session with us earlier, but if you haven't set your password, please use the{' '}
                      <Button
                        className={styles.linkButton}
                        type="link"
                        onClick={() => onSetNewPassword(form.getFieldsValue().email)}
                      >
                        set new password
                      </Button>{' '}
                      option below{' '}
                    </Text>
                  }
                  label="Password"
                  name="password"
                  rules={validationRules.passwordValidation}
                  ref={passwordInput}
                >
                  <Password />
                </Item>
              </>
            )}

            <div>
              <Title level={5}> Book Only this class </Title>
              <Table
                columns={singleClassColumns}
                data={[classDetails]}
                rowKey={(record) => 'dropIn'}
                rowSelection={{
                  hideSelectAll: true,
                  selectedRowKeys: selectedPass ? [] : ['dropIn'],
                  type: 'radio',
                  onSelect: (record, selected, _, e) => {
                    if (selected) {
                      setSelectedPass(null);
                    }
                  },
                }}
              />
            </div>

            <div className={styles.mt20}>
              <Title level={5}> Buy Pass & Book </Title>
              <Table
                columns={passesColumns}
                data={availablePasses}
                rowKey={(record) => record.id}
                expandable={{
                  expandedRowRender: renderClassesList,
                  expandIconColumnIndex: -1,
                  expandedRowKeys: expandedRowKeys,
                }}
                rowSelection={{
                  selectedRowKeys: selectedPass ? [selectedPass.id] : [],
                  checkStrictly: true,
                  hideSelectAll: true,
                  type: 'radio',
                  onSelect: (record, selected, _, e) => {
                    if (selected) {
                      setSelectedPass(record);
                    }
                  },
                }}
              />
            </div>

            <Item {...sessionRegistrationTailLayout}>
              <Row className={styles.mt20}>
                <Col>
                  <Button type="primary" htmlType="submit">
                    {user ? 'Buy' : 'Register'}
                  </Button>
                </Col>
                <Col>
                  <Button type="link" onClick={() => showSignInForm()} disabled={Boolean(user)}>
                    Already have an account? Sign In
                  </Button>
                </Col>
              </Row>
            </Item>

            {showPasswordField && (
              <Item {...sessionRegistrationTailLayout}>
                <Button
                  className={styles.linkButton}
                  type="link"
                  onClick={() => onSetNewPassword(form.getFieldsValue().email)}
                >
                  Set a new password
                </Button>
              </Item>
            )}
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
