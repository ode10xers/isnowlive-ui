import React, { useState } from 'react';
import MobileDetect from 'mobile-detect';

import { Row, Col, Typography, Button, Card, Tag, Space, message } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import SessionCards from 'components/SessionCards';
import SimpleVideoCardsList from 'components/SimpleVideoCardsList';
import PurchaseModal from 'components/PurchaseModal';

import { showErrorModal, showAlreadyBookedModal, showPurchasePassSuccessModal } from 'components/Modals/modals';

import { generateUrlFromUsername, isAPISuccess, orderType, productType } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Text, Paragraph } = Typography;

const PublicPassList = ({ username, passes }) => {
  const { showPaymentPopup } = useGlobalContext();

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

  const showConfirmPaymentPopup = () => {
    if (!selectedPass) {
      showErrorModal('Something went wrong', 'Invalid Pass ID');
      return;
    }

    const desc = `${selectedPass.class_count} Credits, Valid for ${selectedPass.validity} days`;

    const paymentPopupData = {
      productId: selectedPass.external_id,
      productType: 'PASS',
      itemList: [
        {
          name: selectedPass.name,
          description: desc,
          currency: selectedPass.currency,
          price: selectedPass.price,
        },
      ],
    };

    showPaymentPopup(paymentPopupData, createOrder);
  };

  const createOrder = async (userEmail, couponCode = '') => {
    if (!selectedPass) {
      showErrorModal('Something went wrong', 'Invalid Pass ID');
      return null;
    }

    setIsLoading(true);
    try {
      const { status, data } = await apis.passes.createOrderForUser({
        pass_id: selectedPass.id,
        price: selectedPass.price,
        currency: selectedPass.currency.toLowerCase(),
      });

      if (isAPISuccess(status) && data) {
        setIsLoading(false);

        if (data.payment_required) {
          return {
            ...data,
            payment_order_type: orderType.PASS,
            payment_order_id: data.pass_order_id,
          };
        } else {
          showPurchasePassSuccessModal(data.pass_order_id);

          return {
            ...data,
            payment_order_type: orderType.PASS,
            payment_order_id: data.pass_order_id,
          };
        }
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');
      if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS);
      }
      return null;
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
      title: 'Pass Name',
      dataIndex: 'name',
      key: 'name',
      width: '35%',
    },
    {
      title: 'Credit Count',
      dataIndex: 'class_count',
      key: 'class_count',
      align: 'right',
      width: '15%',
      render: (text, record) => (record.limited ? `${text} Credits` : 'Unlimited Credit'),
    },
    {
      title: 'Validity',
      dataIndex: 'validity',
      key: 'validity',
      align: 'center',
      width: '12%',
      render: (text, record) => `${text} day${parseInt(text) > 1 ? 's' : ''}`,
    },
    {
      title: 'Price',
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

  const renderPassDetails = (record) => (
    <Row>
      {record?.sessions?.length > 0 && (
        <>
          <Col xs={24}>
            <Text strong className={styles.ml20}>
              Sessions bookable with this pass
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
              Videos purchasable with this pass
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
          {layout('Credit Count', <Text>{pass.limited ? `${pass.class_count} Credits` : 'Unlimited Credits'}</Text>)}
          {layout('Validity', <Text>{`${pass.validity} day`}</Text>)}
          {layout('Price', <Text>{`${pass.price} ${pass.currency.toUpperCase()}`}</Text>)}
        </Card>
        {expandedRowKeys.includes(pass.id) && (
          <Row gutter={[8, 8]} className={styles.cardExpansion}>
            {pass.sessions?.length > 0 && (
              <>
                <Col xs={24}>
                  <Text className={styles.ml20}> Sessions bookable with this pass </Text>
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
                  <Text className={styles.ml20}> Videos purchasable with this pass </Text>
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
      <PurchaseModal
        visible={showPurchaseModal}
        closeModal={closePurchaseModal}
        createOrder={showConfirmPaymentPopup}
      />
      <Loader loading={isLoading} size="large" text="Loading pass details">
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Paragraph>
              Passes enable you to make a single payment and forget the hassle of paying for each product seperately.
            </Paragraph>
            <Paragraph>
              Depending on the pass you buy, you can use the credits and book the class or video products made available
              in that pass for free. A Pass is valid from the date you buy it until the validity period.
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
