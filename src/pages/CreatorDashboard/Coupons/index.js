import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Button, Typography, Collapse, Empty, Tooltip, Popover, List, Card } from 'antd';
import { EditTwoTone } from '@ant-design/icons';

import apis from 'apis';

import Loader from 'components/Loader';
import Table from 'components/Table';
import CreateCouponModal from 'components/CreateCouponModal';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isMobileDevice } from 'utils/device';
import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const { Panel } = Collapse;
//TODO: Add Expand All Later when needed
const Coupons = () => {
  const [isLoading, setIsLoading] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const getCreatorCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.coupons.getCreatorCoupons();

      if (isAPISuccess(status) && data) {
        setCoupons(data);
      }
    } catch (error) {
      showErrorModal('Failed fetching coupons', error.response?.data?.message || 'Something went wrong');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    getCreatorCoupons();
  }, [getCreatorCoupons]);

  const showCreateCouponModal = () => {
    setCreateModalVisible(true);
  };

  const hideCreateCouponModal = (shouldRefresh = false) => {
    setCreateModalVisible(false);
    setSelectedCoupon(null);

    if (shouldRefresh) {
      getCreatorCoupons();
    }
  };

  const editCoupon = (coupon) => {
    setSelectedCoupon(coupon);
    showCreateCouponModal();
  };

  const publishCoupon = async (couponId) => {
    setIsLoading(true);

    try {
      const { status } = await apis.coupons.publishCoupon(couponId);

      if (isAPISuccess(status)) {
        showSuccessModal('Coupon Published');
        getCreatorCoupons();
      }
    } catch (error) {
      showErrorModal('Failed to publish coupon', error?.response?.data?.message);
    }

    setIsLoading(false);
  };

  const unpublishCoupon = async (couponId) => {
    setIsLoading(true);

    try {
      const { status } = await apis.coupons.unpublishCoupon(couponId);

      if (isAPISuccess(status)) {
        showSuccessModal('Coupon Unpublished');
        getCreatorCoupons();
      }
    } catch (error) {
      showErrorModal('Failed to unpublish coupon', error?.response?.data?.message);
    }

    setIsLoading(false);
  };

  const couponColumns = [
    {
      title: 'Discount Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Discount Value',
      dataIndex: 'value',
      key: 'value',
      align: 'right',
      width: '140px',
      render: (text, record) => `${record.value} %`,
    },
    {
      title: 'Applicable Products',
      key: 'products',
      dataIndex: 'products',
      align: 'center',
      width: '150px',
      render: (text, record) => {
        const key = record.product_type.toLowerCase();
        const productName = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;

        return (
          <Popover
            trigger="click"
            title={`${productName} List`}
            content={
              <List
                size="small"
                dataSource={record.products}
                renderItem={(item) => <List.Item> {item.name} </List.Item>}
              />
            }
          >
            <Button block type="default" className={styles.productButton}>
              {record.products?.length || 0} {productName}
            </Button>
          </Popover>
        );
      },
    },
    {
      title: 'Actions',
      align: 'right',
      width: '180px',
      render: (text, record) => {
        return (
          <Row gutter={[8, 8]} justify="end">
            <Col xs={8}>
              <Tooltip title="Edit Discount Code">
                <Button type="link" icon={<EditTwoTone />} onClick={() => editCoupon(record)} />
              </Tooltip>
            </Col>
            <Col xs={8}>
              {record.is_published ? (
                <Tooltip title="Hide Discount Code">
                  <Button danger type="link" onClick={() => unpublishCoupon(record.external_id)}>
                    Hide
                  </Button>
                </Tooltip>
              ) : (
                <Tooltip title="Unhide Discount Code">
                  <Button type="link" className={styles.greenBtn} onClick={() => publishCoupon(record.external_id)}>
                    Show
                  </Button>
                </Tooltip>
              )}
            </Col>
          </Row>
        );
      },
    },
  ];

  const renderCouponItem = (coupon) => {
    const layout = (label, value) => (
      <Row>
        <Col span={15}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={9}>: {value}</Col>
      </Row>
    );

    const productKey = coupon.product_type.toLowerCase();
    const productName = `${productKey.charAt(0).toUpperCase()}${productKey.slice(1)}`;
    const productListBtn = (
      <Popover
        trigger="click"
        title={`${productName} List`}
        content={
          <List size="small" dataSource={coupon.products} renderItem={(item) => <List.Item> {item.name} </List.Item>} />
        }
      >
        <Button type="default" className={styles.productButton}>
          {coupon.products?.length || 0} {productName}
        </Button>
      </Popover>
    );

    return (
      <Col xs={24} key={coupon.external_id}>
        <Card
          title={<Title level={5}> {coupon.code} </Title>}
          bodyStyle={{ padding: '24px 24px 0 24px' }}
          actions={[
            <Tooltip title="Edit Discount Code">
              <Button type="link" icon={<EditTwoTone />} onClick={() => editCoupon(coupon)} />
            </Tooltip>,
            coupon.is_published ? (
              <Tooltip title="Hide Discount Code">
                <Button danger type="link" onClick={() => unpublishCoupon(coupon.external_id)}>
                  Hide
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Unhide Discount Code">
                <Button type="link" className={styles.greenBtn} onClick={() => publishCoupon(coupon.external_id)}>
                  Show
                </Button>
              </Tooltip>
            ),
          ]}
        >
          {layout('Discount Value', `${coupon.value} %`)}
          <Row gutter={[8, 16]}>
            <Col xs={18}>
              {' '}
              <Text strong>Applicable Products</Text> :{' '}
            </Col>
            <Col xs={24}>
              <Row gutter={[8, 8]} justify="center">
                <Col xs={12}>{productListBtn}</Col>
              </Row>
            </Col>
          </Row>
        </Card>
      </Col>
    );
  };

  return (
    <div className={styles.box}>
      <CreateCouponModal
        visible={createModalVisible}
        editedCoupon={selectedCoupon}
        closeModal={hideCreateCouponModal}
      />
      <Row gutter={[8, 8]}>
        <Col xs={12} md={16} lg={18}>
          <Title level={4}> Coupons </Title>
        </Col>
        <Col xs={24} md={8} lg={6}>
          <Button block type="primary" onClick={() => showCreateCouponModal()}>
            Create New Coupon
          </Button>
        </Col>
        <Col xs={24}>
          <Collapse>
            <Panel header={<Title level={5}> Published </Title>} key="Published">
              {coupons?.length ? (
                isMobileDevice ? (
                  <Loader loading={isLoading} size="large" text="Loading coupons">
                    <Row gutter={[8, 16]}>
                      {coupons?.filter((coupon) => coupon?.is_published).map(renderCouponItem)}
                    </Row>
                  </Loader>
                ) : (
                  <Table
                    sticky={true}
                    size="small"
                    columns={couponColumns}
                    data={coupons?.filter((coupon) => coupon?.is_published)}
                    loading={isLoading}
                    rowKey={(record) => record.external_id}
                  />
                )
              ) : (
                <Empty description="No Published Coupons" />
              )}
            </Panel>
            <Panel header={<Title level={5}> Unpublished </Title>} key="Unpublished">
              {coupons?.length ? (
                isMobileDevice ? (
                  <Loader loading={isLoading} size="large" text="Loading coupons">
                    <Row gutter={[8, 16]}>
                      {coupons?.filter((coupon) => !coupon?.is_published).map(renderCouponItem)}
                    </Row>
                  </Loader>
                ) : (
                  <Table
                    sticky={true}
                    size="small"
                    columns={couponColumns}
                    data={coupons?.filter((coupon) => !coupon?.is_published)}
                    loading={isLoading}
                    rowKey={(record) => record.external_id}
                  />
                )
              ) : (
                <Empty description="No Unpublished Coupons" />
              )}
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default Coupons;
