import React, { useState } from 'react';
import MobileDetect from 'mobile-detect';
import classNames from 'classnames';
import { loadStripe } from '@stripe/stripe-js';

import { Row, Col, Typography, Button, Card, Tag, Space, message } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

import Table from 'components/Table';
import Loader from 'components/Loader';
import SessionCards from 'components/SessionCards';
import PurchaseModal from 'components/PurchaseModal';

import { showErrorModal, showAlreadyBookedModal, showBookingSuccessModal } from 'components/Modals/modals';

import { generateUrlFromUsername, isAPISuccess } from 'utils/helper';

import config from 'config';
import apis from 'apis';

import styles from './style.module.scss';

const stripePromise = loadStripe(config.stripe.secretKey);

const { Text, Paragraph } = Typography;

const ClassPasses = ({ username, passes }) => {
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
        order_type: 'PASS_ORDER',
      });

      if (isAPISuccess(status) && data) {
        const stripe = await stripePromise;

        const result = await stripe.redirectToCheckout({
          sessionId: data.payment_gateway_session_id,
        });

        if (result.error) {
          message.error('Cannot initiate payment at this time, please try again...');
          setIsLoading(false);
        }
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  const createOrder = async (userEmail) => {
    if (!selectedPass) {
      showErrorModal('Something went wrong', 'Invalid Class Pass ID');
      return;
    }

    setIsLoading(true);
    try {
      const { status, data } = await apis.passes.createOrderForUser({
        pass_id: selectedPass.id,
        price: selectedPass.price,
        currency: selectedPass.currency,
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
      message.error(error.response?.data?.message || 'Something went wrong');
      if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(true, username);
      }
    }
  };

  const redirectToSessionsPage = (session) => {
    const baseUrl = generateUrlFromUsername(session.username || username || 'app');
    window.open(`${baseUrl}/s/${session.session_id}`);
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
      title: 'Pass Name',
      dataIndex: 'name',
      key: 'name',
      width: '35%',
    },
    {
      title: 'Pass Count',
      dataIndex: 'class_count',
      key: 'class_count',
      align: 'right',
      width: '15%',
      render: (text, record) => (record.limited ? `${text} Classes` : 'Unlimited Classes'),
    },
    {
      title: 'Validity',
      dataIndex: 'validity',
      key: 'validity',
      align: 'center',
      width: '10%',
      render: (text, record) => `${text} day${parseInt(text) > 1 ? 's' : ''}`,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      sortOrder: 'descend',
      width: '10%',
      render: (text, record) => `${text} ${record.currency}`,
    },
    {
      title: (
        <Button shape="round" type="primary" onClick={() => toggleExpandAll()}>
          {expandedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
        </Button>
      ),
      align: 'right',
      render: (text, record) => (
        <Space size="small">
          <Button type="primary" onClick={() => openPurchaseModal(record.id)}>
            Buy Pass
          </Button>
          {expandedRowKeys.includes(record.id) ? (
            <Button type="link" onClick={() => collapseRow(record.id)} icon={<UpOutlined />}>
              Close
            </Button>
          ) : (
            <Button type="link" onClick={() => expandRow(record.id)} icon={<DownOutlined />}>
              More
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const renderClassesList = (record) => (
    <Row>
      <Col xs={24}>
        <Text className={styles.ml20}> Applicable to below class(es) </Text>
      </Col>
      <Col xs={24}>
        <SessionCards sessions={record.sessions} />
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
          title={<Text>{pass.name}</Text>}
          actions={[
            <Button type="primary" onClick={() => openPurchaseModal(pass.id)}>
              Buy Pass
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

  return (
    <div className={styles.box}>
      <PurchaseModal visible={showPurchaseModal} closeModal={closePurchaseModal} createOrder={createOrder} />
      <Loader loading={isLoading} size="large" text="Loading pass details">
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Paragraph>Passes are an easy way to frequently book the classes you love attending.</Paragraph>
            <Paragraph>
              Check out the passes below and the classes included in them. Once you have bought the pass you can use the
              class credits to pay for classes in 1 click it without needing to touch your wallet again. Class pass is
              valid from from the date you buy it until the validity period.
            </Paragraph>
          </Col>
          <Col xs={24}>
            {isMobileDevice ? (
              passes.length > 0 ? (
                passes.map(renderPassItem)
              ) : (
                <div className={styles.textAlignCenter}>
                  {' '}
                  <Text disabled> No Passes </Text>{' '}
                </div>
              )
            ) : (
              <Table
                sticky={true}
                columns={passesColumns}
                data={passes}
                rowKey={(record) => record.id}
                expandable={{
                  expandedRowRender: (record) => renderClassesList(record),
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

export default ClassPasses;
