import React, { useState } from 'react';

import { Row, Col, Typography, Button, Card, Tag, Space, message } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import SessionCards from 'components/SessionCards';
import SimpleVideoCardsList from 'components/SimpleVideoCardsList';
import AuthModal from 'components/AuthModal';

import { showErrorModal, showAlreadyBookedModal, showPurchasePassSuccessModal } from 'components/Modals/modals';

import { isAPISuccess, isUnapprovedUserError, orderType, productType } from 'utils/helper';
import { redirectToSessionsPage, redirectToVideosPage } from 'utils/redirect';
import { isMobileDevice } from 'utils/device';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Text, Paragraph } = Typography;

const PublicPassList = ({ passes }) => {
  const { showPaymentPopup } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const openAuthModal = (passId) => {
    setSelectedPass(passes.filter((pass) => pass.id === passId)[0]);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setSelectedPass(null);
    setShowAuthModal(false);
  };

  const showConfirmPaymentPopup = () => {
    if (!selectedPass) {
      showErrorModal('Something went wrong', 'Invalid Pass ID');
      return;
    }

    const desc = `${selectedPass.class_count} Credits, Valid for ${selectedPass.validity} days`;

    const paymentPopupData = {
      productId: selectedPass.external_id,
      productType: productType.PASS,
      itemList: [
        {
          name: selectedPass.name,
          description: desc,
          currency: selectedPass.currency,
          price: selectedPass.total_price,
        },
      ],
    };

    showPaymentPopup(paymentPopupData, createOrder);
  };

  const createOrder = async (couponCode = '') => {
    if (!selectedPass) {
      showErrorModal('Something went wrong', 'Invalid Pass ID');
      return null;
    }

    setIsLoading(true);
    try {
      const { status, data } = await apis.passes.createOrderForUser({
        pass_id: selectedPass.external_id,
        price: selectedPass.total_price,
        coupon_code: couponCode,
        currency: selectedPass.currency.toLowerCase(),
      });

      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        setSelectedPass(null);

        if (data.payment_required) {
          return {
            ...data,
            is_successful_order: true,
            payment_order_type: orderType.PASS,
            payment_order_id: data.pass_order_id,
          };
        } else {
          showPurchasePassSuccessModal(data.pass_order_id);
          return {
            ...data,
            is_successful_order: true,
          };
        }
      }
    } catch (error) {
      setIsLoading(false);
      if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS);
      } else if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
      return {
        is_successful_order: false,
      };
    }
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
      render: (text, record) =>
        record.total_price > 0 ? `${record.total_price} ${record.currency.toUpperCase()}` : 'Free',
    },
    {
      title: (
        <Button className={styles.expandButton} type="primary" onClick={() => toggleExpandAll()}>
          {expandedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
        </Button>
      ),
      align: 'right',
      render: (text, record) => (
        <Space size="small">
          <Button className={styles.purchaseButton} type="primary" onClick={() => openAuthModal(record.id)}>
            Buy Pass
          </Button>
          {expandedRowKeys.includes(record.id) ? (
            <Button
              className={styles.seeMoreButton}
              type="link"
              onClick={() => collapseRow(record.id)}
              icon={<UpOutlined />}
            >
              Details
            </Button>
          ) : (
            <Button
              className={styles.seeMoreButton}
              type="link"
              onClick={() => expandRow(record.id)}
              icon={<DownOutlined />}
            >
              Details
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
            <SimpleVideoCardsList passDetails={record} videos={record.videos} />
          </Col>
        </>
      )}
    </Row>
  );

  const renderPassItem = (pass) => {
    const layout = (label, value) => (
      <Row>
        <Col span={9}>
          <Text className={styles.cardContentText}>{label}</Text>
        </Col>
        <Col span={15}>: {value}</Col>
      </Row>
    );

    return (
      <div key={pass.id}>
        <Card
          className={styles.card}
          title={<Text className={styles.cardHeadingText}>{pass.name}</Text>}
          bodyStyle={{ padding: 10 }}
          actions={[
            <Button className={styles.purchaseButton} type="primary" onClick={() => openAuthModal(pass.id)}>
              Buy Pass
            </Button>,
            expandedRowKeys.includes(pass.id) ? (
              <Button
                className={styles.seeMoreButton}
                type="link"
                onClick={() => collapseRow(pass.id)}
                icon={<UpOutlined />}
              >
                Details
              </Button>
            ) : (
              <Button
                className={styles.seeMoreButton}
                type="link"
                onClick={() => expandRow(pass.id)}
                icon={<DownOutlined />}
              >
                Details
              </Button>
            ),
          ]}
        >
          {layout(
            'Credit Count',
            <Text className={styles.cardContentText}>
              {pass.limited ? `${pass.class_count} Credits` : 'Unlimited Credits'}
            </Text>
          )}
          {layout('Validity', <Text className={styles.cardContentText}>{`${pass.validity} day`}</Text>)}
          {layout(
            'Price',
            <Text className={styles.cardContentText}>{`${pass.total_price} ${pass.currency.toUpperCase()}`}</Text>
          )}
        </Card>
        {expandedRowKeys.includes(pass.id) && (
          <Row gutter={[8, 8]} className={styles.cardExpansion}>
            {pass.sessions?.length > 0 && (
              <>
                <Col xs={24}>
                  <Text> Sessions bookable with this pass </Text>
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
                  <Text> Videos purchasable with this pass </Text>
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
    <div className={styles.passListContainer}>
      <AuthModal visible={showAuthModal} closeModal={closeAuthModal} onLoggedInCallback={showConfirmPaymentPopup} />
      <Loader loading={isLoading} size="large" text="Loading pass details">
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Paragraph className={styles.descText}>
              Passes enable you to make a single payment and forget the hassle of paying for each product seperately.
            </Paragraph>
            <Paragraph className={styles.descText}>
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
                  <Text disabled> No Passes </Text>{' '}
                </div>
              )
            ) : (
              <Table
                columns={passesColumns}
                data={passes}
                rowKey={(record) => record.id}
                rowClassName={styles.passListRow}
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
