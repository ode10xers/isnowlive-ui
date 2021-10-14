import React, { useState } from 'react';

import { Row, Col, Typography, Button, Card, Tag, Space, Grid, message } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import AuthModal from 'components/AuthModal';
import SimpleVideoCardsList from 'components/SimpleVideoCardsList';

import { showErrorModal, showAlreadyBookedModal, showPurchasePassSuccessModal } from 'components/Modals/modals';

import { orderType, productType } from 'utils/constants';
import { isAPISuccess, isUnapprovedUserError } from 'utils/helper';
import { redirectToSessionsPage, redirectToVideosPage } from 'utils/redirect';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';
import SessionListCard from 'components/DynamicProfileComponents/SessionsProfileComponent/SessionListCard';
import AvailabilityListItem from 'components/DynamicProfileComponents/AvailabilityProfileComponent/AvailabilityListItem';

const { Text } = Typography;
const { useBreakpoint } = Grid;

const PublicPassList = ({ passes }) => {
  const { showPaymentPopup } = useGlobalContext();
  const { lg } = useBreakpoint();

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
            is_successful_order: false,
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
    <Row className={styles.passDetailsExpansion}>
      {record?.sessions?.filter((session) => session.type === 'NORMAL').length > 0 && (
        <>
          <Col xs={24}>
            <Text className={styles.expandableSectionHeader}>Sessions bookable with this pass</Text>
          </Col>
          <Col xs={24} className={styles.passDetailsContainer}>
            <Row gutter={[8, 8]}>
              {record?.sessions
                ?.filter((session) => session.type === 'NORMAL')
                .map((session) => (
                  <Col xs={24} sm={12} key={session.session_external_id}>
                    <SessionListCard session={session} />
                  </Col>
                ))}
            </Row>
          </Col>
        </>
      )}
      {record?.videos?.length > 0 && (
        <>
          <Col xs={24}>
            <Text className={styles.expandableSectionHeader}>Videos purchasable with this pass</Text>
          </Col>
          <Col xs={24} className={styles.passDetailsContainer}>
            <SimpleVideoCardsList passDetails={record} videos={record.videos} />
          </Col>
        </>
      )}
      {record?.sessions?.filter((session) => session.type === 'AVAILABILITY').length > 0 && (
        <>
          <Col xs={24}>
            <Text className={styles.expandableSectionHeader}>Availabilities bookable with this pass</Text>
          </Col>
          <Col xs={24} className={styles.passDetailsContainer}>
            <Row gutter={[8, 8]}>
              {record?.sessions
                ?.filter((session) => session.type === 'AVAILABILITY')
                .map((session) => (
                  <Col xs={24} md={12} key={session.session_external_id}>
                    <AvailabilityListItem availability={session} />
                  </Col>
                ))}
            </Row>
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
                type="link"
                icon={<UpOutlined />}
                className={styles.seeMoreButton}
                onClick={() => collapseRow(pass.id)}
              >
                Details
              </Button>
            ) : (
              <Button
                type="link"
                icon={<DownOutlined />}
                className={styles.seeMoreButton}
                onClick={() => expandRow(pass.id)}
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
            {pass.sessions?.filter((session) => session.type === 'NORMAL').length > 0 && (
              <>
                <Col xs={24}>
                  <Text> Sessions bookable with this pass </Text>
                </Col>
                <Col xs={24}>
                  <div className={styles.ml20}>
                    {pass.sessions
                      ?.filter((session) => session.type === 'NORMAL')
                      .map((session) => (
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
            {pass.sessions?.filter((session) => session.type === 'AVAILABILITY').length > 0 && (
              <>
                <Col xs={24}>
                  <Text> Availabilities bookable with this pass </Text>
                </Col>
                <Col xs={24}>
                  <div className={styles.ml20}>
                    {pass.sessions
                      ?.filter((session) => session.type === 'AVAILABILITY')
                      .map((session) => (
                        <Tag key={session?.key} color="purple" onClick={() => redirectToSessionsPage(session)}>
                          {session?.name}
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
            {!lg ? (
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
                  expandedRowClassName: () => styles.expandedTableRow,
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
