import React, { useState } from 'react';
import MobileDetect from 'mobile-detect';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from 'react-i18next';

import { Row, Col, Typography, Button, Card, Tag, Space, message } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

import Table from 'components/Table';
import Loader from 'components/Loader';
import SessionCards from 'components/SessionCards';
import SimpleVideoCardsList from 'components/SimpleVideoCardsList';
import PurchaseModal from 'components/PurchaseModal';

import { showErrorModal, showAlreadyBookedModal, showBookingSuccessModal } from 'components/Modals/modals';

import { generateUrlFromUsername, isAPISuccess, orderType, productType } from 'utils/helper';

import config from 'config';
import apis from 'apis';

import styles from './style.module.scss';

const stripePromise = loadStripe(config.stripe.secretKey);

const { Text, Paragraph } = Typography;

const PublicPassList = ({ username, passes }) => {
  const { t } = useTranslation();
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());

  const [isLoading, setIsLoading] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const openPurchaseModal = (passId) => {
    setSelectedPass(passes.filter((pass) => pass.id === passId)[0]);
    setShowPurchaseModal(true);
  };

  const closePurchaseModal = () => {
    setSelectedPass(null);
    setShowPurchaseModal(false);
  };

  const initiatePaymentForOrder = async (orderDetails) => {
    setIsLoading(true);
    try {
      const { data, status } = await apis.payment.createPaymentSessionForOrder({
        order_id: orderDetails.pass_order_id,
        order_type: orderType.PASS,
      });

      if (isAPISuccess(status) && data) {
        const stripe = await stripePromise;

        const result = await stripe.redirectToCheckout({
          sessionId: data.payment_gateway_session_id,
        });

        if (result.error) {
          message.error(t('INITIATE_PAYMENT_ERROR_TEXT'));
          setIsLoading(false);
        }
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || t('SOMETHING_WENT_WRONG'));
    }
  };

  const createOrder = async (userEmail) => {
    if (!selectedPass) {
      showErrorModal(t('SOMETHING_WENT_WRONG'), t('INVALID_PASS_ID'));
      return;
    }

    setIsLoading(true);
    try {
      const { status, data } = await apis.passes.createOrderForUser({
        pass_id: selectedPass.id,
        price: selectedPass.price,
        currency: selectedPass.currency.toLowerCase(),
      });

      if (isAPISuccess(status) && data) {
        if (data.payment_required) {
          initiatePaymentForOrder(data);
        } else {
          setIsLoading(false);
          showBookingSuccessModal(userEmail, selectedPass, false, false, username);
        }
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || t('SOMETHING_WENT_WRONG'));
      if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS, username);
      }
    }
  };

  const redirectToSessionsPage = (session) => {
    const baseUrl = generateUrlFromUsername(session.username || username || 'app');
    window.open(`${baseUrl}/s/${session.session_id}`);
  };

  const redirectToVideosPage = (video) => {
    const baseUrl = generateUrlFromUsername(video.username || username || 'app');
    window.open(`${baseUrl}/v/${video.external_id}`);
  };

  const toggleExpandAll = () => {
    if (expandedRowKeys.length > 0) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(passes.map((pass) => pass.id));
    }
  };

  const expandRow = (rowKey) => {
    const tempExpandedRowsArray = expandedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRow = (rowKey) => setExpandedRowKeys(expandedRowKeys.filter((key) => key !== rowKey));

  const passesColumns = [
    {
      title: t('NAME'),
      dataIndex: 'name',
      key: 'name',
      width: '35%',
    },
    {
      title: t('CREDIT_COUNT'),
      dataIndex: 'class_count',
      key: 'class_count',
      align: 'right',
      width: '15%',
      render: (text, record) => (record.limited ? `${text} ${t('CREDITS')}` : t('UNLIMITED_CREDITS')),
    },
    {
      title: t('VALIDITY'),
      dataIndex: 'validity',
      key: 'validity',
      align: 'center',
      width: '12%',
      render: (text, record) => `${text} ${t('DAYS')}}`,
    },
    {
      title: t('PRICE'),
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      sortOrder: 'descend',
      width: '13%',
      render: (text, record) => `${text} ${record.currency.toUpperCase()}`,
    },
    {
      title: (
        <Button shape="round" type="primary" onClick={() => toggleExpandAll()}>
          {expandedRowKeys.length > 0 ? t('COLLAPSE') : t('EXPAND')} {t('ALL')}
        </Button>
      ),
      align: 'right',
      render: (text, record) => (
        <Space size="small">
          <Button type="primary" onClick={() => openPurchaseModal(record.id)}>
            {t('BUY_PASS')}
          </Button>
          {expandedRowKeys.includes(record.id) ? (
            <Button type="link" onClick={() => collapseRow(record.id)} icon={<UpOutlined />}>
              {t('CLOSE')}
            </Button>
          ) : (
            <Button type="link" onClick={() => expandRow(record.id)} icon={<DownOutlined />}>
              {t('MORE')}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const renderPassDetails = (record) => (
    <Row>
      {record?.sessions?.length > 0 && (
        <>
          <Col xs={24}>
            <Text strong className={styles.ml20}>
              {t('SESSIONS_BOOKABLE_WITH_THIS_PASS')}
            </Text>
          </Col>
          <Col xs={24} className={styles.passDetailsContainer}>
            <SessionCards sessions={record.sessions} />
          </Col>
        </>
      )}
      {record?.videos?.length > 0 && (
        <>
          <Col xs={24}>
            <Text strong className={styles.ml20}>
              {t('VIDEOS_PURCHASABLE_WITH_THIS_PASS')}
            </Text>
          </Col>
          <Col xs={24} className={styles.passDetailsContainer}>
            <SimpleVideoCardsList username={username} passDetails={record} videos={record.videos} />
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
          title={<Text>{pass.name}</Text>}
          actions={[
            <Button type="primary" onClick={() => openPurchaseModal(pass.id)}>
              {t('BUY_PASS')}
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
            {pass.sessions?.length > 0 && (
              <>
                <Col xs={24}>
                  <Text className={styles.ml20}> {t('SESSIONS_BOOKABLE_WITH_THIS_PASS')} </Text>
                </Col>
                <Col xs={24}>
                  <div className={styles.ml20}>
                    {pass.sessions?.map((session) => (
                      <Tag key={session?.key} color="blue" onClick={() => redirectToSessionsPage(session)}>
                        {session?.name}
                      </Tag>
                    ))}
                  </div>
                </Col>
              </>
            )}
            {pass.videos?.length > 0 && (
              <>
                <Col xs={24}>
                  <Text className={styles.ml20}> {t('VIDEOS_PURCHASABLE_WITH_THIS_PASS')} </Text>
                </Col>
                <Col xs={24}>
                  <div className={styles.ml20}>
                    {pass.videos?.map((video) => (
                      <Tag key={video?.key} color="volcano" onClick={() => redirectToVideosPage(video)}>
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
    <div className={styles.box}>
      <PurchaseModal visible={showPurchaseModal} closeModal={closePurchaseModal} createOrder={createOrder} />
      <Loader loading={isLoading} size="large" text={t('LOADING_PASS_DETAILS')}>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Paragraph>{t('PUBLIC_PASSES_DESCRIPTION_TEXT_1')}</Paragraph>
            <Paragraph>{t('PUBLIC_PASSES_DESCRIPTION_TEXT_2')}</Paragraph>
          </Col>
          <Col xs={24}>
            {isMobileDevice ? (
              passes.length > 0 ? (
                passes.map(renderPassItem)
              ) : (
                <div className={styles.textAlignCenter}>
                  {' '}
                  <Text disabled> {t('NO_PASSES')} </Text>{' '}
                </div>
              )
            ) : (
              <Table
                sticky={true}
                columns={passesColumns}
                data={passes}
                rowKey={(record) => record.id}
                expandable={{
                  expandedRowRender: (record) => renderPassDetails(record),
                  expandRowByClick: true,
                  expandIconColumnIndex: -1,
                  expandedRowKeys: expandedRowKeys,
                }}
              />
            )}
          </Col>
        </Row>
      </Loader>
    </div>
  );
};

export default PublicPassList;
