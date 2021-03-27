import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import MobileDetect from 'mobile-detect';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
      render: (text, record) => `${record.price} ${record.currency.toUpperCase()}`,
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
      title: t('PASS'),
      dataIndex: 'name',
      key: 'name',
      width: '50%',
    },
    {
      title: t('VALIDITY'),
      dataIndex: 'validity',
      key: 'validity',
      width: '15%',
      align: 'right',
      render: (text, record) => `${record.validity} ${t('DAYS')}`,
    },
    {
      title: t('PRICE'),
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      width: '15%',
      render: (text, record) => `${text} ${record.currency.toUpperCase()}`,
    },
    {
      title: t('CREDIT_COUNT'),
      dataIndex: 'class_count',
      key: 'class_count',
      align: 'right',
      render: (text, record) => {
        const btnText = record.limited
          ? record.user_usable
            ? `${record.classes_remaining}/${record.class_count} ${t('REMAINING')} `
            : `${record.class_count} ${t('CREDITS')} `
          : t('UNLIMITED_CREDITS');

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
      title: t('PASS'),
      dataIndex: 'name',
      key: 'name',
      align: 'left',
    },
    {
      title: t('CREDITS_LEFT'),
      dataIndex: 'classes_remaining',
      key: 'classes_remaining',
      width: '20%',
      render: (text, record) => `${record.classes_remaining}/${record.class_count}`,
    },
    {
      title: t('VALID_TILL'),
      dataIndex: 'expiry',
      key: 'expiry',
      width: '20%',
      render: (text, record) => toShortDate(record.expiry),
    },
  ];

  const redirectToSessionsPage = (session) => {
    const baseUrl = generateUrlFromUsername(session.username || window.location.hostname.split('.')[0] || 'app');
    window.open(`${baseUrl}/s/${session?.session_id}`);
  };

  const redirectToVideosPage = (video) => {
    const baseUrl = generateUrlFromUsername(video.username || window.location.hostname.split('.')[0] || 'app');
    window.open(`${baseUrl}/v/${video?.external_id}`);
  };

  const renderPassDetails = (record) => (
    <Row gutter={[8, 8]}>
      {record.sessions?.length > 0 && (
        <>
          <Col xs={24}>
            <Text className={styles.ml20}> {t('SESSIONS_BOOKABLE_WITH_THIS_PASS')} </Text>
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
            <Text className={styles.ml20}> {t('VIDEOS_PURCHASABLE_WITH_THIS_PASS')} </Text>
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
              {t('SELECT_PASS')}
            </Button>,
            expandedRowKeys.includes(pass.id) ? (
              <Button type="link" onClick={() => collapseRow(pass.id)} icon={<UpOutlined />}>
                {t('CLOSE')}
              </Button>
            ) : (
              <Button type="link" onClick={() => expandRow(pass.id)} icon={<DownOutlined />}>
                {t('MORE')}
              </Button>
            ),
          ]}
        >
          {layout(
            t('CREDIT_COUNT'),
            <Text>{pass.limited ? `${pass.class_count} ${t('CREDITS')}` : t('UNLIMITED_CREDITS')}</Text>
          )}
          {layout(t('VALIDITY'), <Text>{`${pass.validity} ${t('DAYS')}`}</Text>)}
          {layout(t('PRICE'), <Text>{`${pass.price} ${pass.currency.toUpperCase()}`}</Text>)}
        </Card>
        {expandedRowKeys.includes(pass.id) && (
          <Row gutter={[8, 8]} className={styles.cardExpansion}>
            {pass?.sessions?.length > 0 && (
              <>
                <Col xs={24}>
                  <Text className={styles.ml20}> {t('SESSIONS_BOOKABLE_WITH_THIS_PASS')} </Text>
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
                  <Text className={styles.ml20}> {t('VIDEOS_PURCHASABLE_WITH_THIS_PASS')} </Text>
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
              {t('SELECT_PASS')}
            </Button>,
            expandedRowKeys.includes(pass.id) ? (
              <Button type="link" onClick={() => collapseRow(pass.id)} icon={<UpOutlined />}>
                {t('CLOSE')}
              </Button>
            ) : (
              <Button type="link" onClick={() => expandRow(pass.id)} icon={<DownOutlined />}>
                {t('MORE')}
              </Button>
            ),
          ]}
        >
          {layout(t('CREDITS_LEFT'), <Text>{`${pass.classes_remaining}/${pass.class_count}`}</Text>)}
          {layout(t('EXPIRY'), <Text>{toShortDate(pass.expiry)}</Text>)}
        </Card>
        {expandedRowKeys.includes(pass.id) && (
          <Row gutter={[8, 8]} className={styles.cardExpansion}>
            {pass?.sessions?.length > 0 && (
              <>
                <Col xs={24}>
                  <Text className={styles.ml20}> {t('SESSIONS_BOOKABLE_WITH_THIS_PASS')} </Text>
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
                  <Text className={styles.ml20}> {t('VIDEOS_PURCHASABLE_WITH_THIS_PASS')} </Text>
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

  return (
    <div className={classNames(styles.box, styles.p50, styles.mb20)}>
      <Row>
        <Col xs={24}>
          <Title level={3}>{t('REGISTRATION')}</Title>
        </Col>
        <Col xs={24}>
          <Text>
            <a href="https://zoom.us/download"> {t('ZOOM')} </a> {t('SESSION_REGISTRATION_TEXT_1')}
            <a
              href={`${generateUrlFromUsername('app')}${Routes.attendeeDashboard.rootPath}${
                Routes.attendeeDashboard.defaultPath
              }`}
            >
              {' '}
              {t('DASHBOARD')}
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
              <Item label={t('NAME')} className={styles.nameInputWrapper}>
                <Item className={styles.nameInput} name="first_name" rules={validationRules.nameValidation}>
                  <Input placeholder={t('FIRST_NAME')} disabled={showPasswordField} />
                </Item>
                <Item className={styles.nameInput} name="last_name" rules={validationRules.nameValidation}>
                  <Input placeholder={t('LAST_NAME')} disabled={showPasswordField} />
                </Item>
              </Item>
            )}

            <Item className={styles.emailInput} label={t('EMAIL')} name="email" rules={validationRules.emailValidation}>
              <Input placeholder={t('ENTER_YOUR_EMAIL')} disabled={user} />
            </Item>

            {showPasswordField && (
              <>
                <Item
                  className={styles.passwordInput}
                  label={t('PASSWORD')}
                  name="password"
                  rules={validationRules.passwordValidation}
                  ref={passwordInput}
                >
                  <Password />
                </Item>
                <Item {...sessionRegistrationTailLayout}>
                  {incorrectPassword ? (
                    <Text type="danger">{t('HEADER_MODAL_LOGIN_ERROR_TEXT')}</Text>
                  ) : (
                    <div className={styles.passwordHelpText}>
                      <Text>
                        {t('HEADER_MODAL_SIGN_UP_HELP_TEXT_1')}{' '}
                        <Button
                          type="link"
                          className={classNames(styles.setNewPassword, styles.linkBtn)}
                          onClick={() => onSetNewPassword(form.getFieldsValue().email)}
                        >
                          {t('SET_NEW_PASSWORD').toLowerCase()}
                        </Button>
                      </Text>
                    </div>
                  )}
                </Item>
              </>
            )}

            <Item {...sessionRegistrationTailLayout}>
              {user ? (
                <Button className={styles.linkBtn} type="link" onClick={() => logOut()}>
                  {t('NOT_THIS_ACCOUNT_LOGOUT')}
                </Button>
              ) : (
                <Button className={styles.linkBtn} type="link" onClick={() => showSignInForm()}>
                  {t('ALREADY_HAVE_AN_ACCOUNT')} {t('SIGN_IN')}
                </Button>
              )}
            </Item>

            {user && userPasses.length > 0 ? (
              <div>
                <Title level={5}> {t('PURCHASED_PASSES_USABLE_FOR_CLASS')} </Title>
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
                        {t('BOOK')} {selectedInventory ? toLongDateWithTime(selectedInventory.start_time) : t('THIS')}{' '}
                        {t('CLASS')}{' '}
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
                        {t('BUY_PASS_AND_BOOK')}{' '}
                        {selectedInventory ? toLongDateWithTime(selectedInventory.start_time) : t('THIS')} {t('CLASS')}
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
                  <Item {...sessionRegistrationTailLayout}>
                    <Title level={5}>
                      {t('BOOK')} {selectedInventory ? toLongDateWithTime(selectedInventory.start_time) : t('THIS')}{' '}
                      {t('CLASS')}
                    </Title>
                  </Item>
                )}
              </>
            )}

            <Row className={styles.mt10}>
              {user && selectedInventory && selectedPass && userPasses.length > 0 && (
                <Paragraph>
                  {t('BOOKING')} {selectedInventory ? toLongDateWithTime(selectedInventory.start_time) : t('THIS')}{' '}
                  {t('CLASS_FOR')}
                  <Text delete>
                    {classDetails.price} {classDetails.currency.toUpperCase()}
                  </Text>
                  <Text strong> {`0 ${classDetails.currency.toUpperCase()}`} </Text> {t('USING_YOUR_PURCHASED_PASS')}
                  <Text strong> {selectedPass.name} </Text>
                </Paragraph>
              )}
            </Row>

            <Item {...sessionRegistrationTailLayout}>
              <Row className={styles.mt10} gutter={[8, 8]}>
                <Col xs={8} md={8} xl={5}>
                  <Button block size="large" type="primary" htmlType="submit" disabled={!selectedInventory}>
                    {user ? t('BUY') : t('REGISTER')}
                  </Button>
                </Col>
                {!selectedInventory && (
                  <Col xs={24}>
                    <Paragraph>
                      {t('SELECT_DATE_AND_TIME_FOR_CLASS_ATTEND')}
                      {isMobileDevice ? '' : t('IN_THE_CALENDAR_ON_THE_RIGHT')}
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
