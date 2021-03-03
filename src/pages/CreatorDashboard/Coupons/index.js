import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Button, Typography, Collapse, Empty, Tooltip, Popconfirm, Popover, List } from 'antd';
import { EditTwoTone, EyeTwoTone, EyeInvisibleTwoTone, DeleteTwoTone } from '@ant-design/icons';

// import apis from 'apis';

import Loader from 'components/Loader';
import Table from 'components/Table';
import CreateCouponModal from 'components/CreateCouponModal';
import { showErrorModal } from 'components/Modals/modals';

import { isMobileDevice } from 'utils/device';
import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { Title } = Typography;
const { Panel } = Collapse;

const buttonStyles = {
  courses: styles.courseButton,
  passes: styles.passesButton,
};

//TODO: Add Expand All Later when needed
const Coupons = () => {
  const [isLoading, setIsLoading] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const getCreatorCoupons = useCallback(() => {
    setIsLoading(true);
    try {
      // TODO: Implement API when ready
      // const { status, data } = await apis.coupons.getCreatorCoupons();
      const { status, data } = {
        status: 200,
        data: [
          {
            id: 2048,
            name: 'Test Discount Code',
            discountCode: '50off',
            discountAmount: 0.3,
            is_published: true,
            products: {
              courses: [1, 2, 3],
              passes: [10, 20],
            },
          },
        ],
      };

      if (isAPISuccess(status) && data) {
        //TODO: Remap data as necessary here
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

  const publishCoupon = (couponId) => {
    console.log('Published');
  };

  const unpublishCoupon = (couponId) => {
    console.log('Unpublished');
  };

  const couponColumns = [
    {
      title: 'Discount Code',
      key: 'discountCode',
      dataIndex: 'discountCode',
      width: '130px',
    },
    {
      title: 'Discount Value (%)',
      key: 'discountAmount',
      dataIndex: 'discountAmount',
      align: 'right',
      width: '160px',
      render: (text, record) => `${record.discountAmount * 100} %`,
    },
    {
      title: 'Applicable Products',
      key: 'products',
      dataIndex: 'products',
      render: (text, record) => {
        return (
          <Row gutter={[8, 8]} justify="start">
            {Object.entries(record.products).map(([key, value]) => {
              const productName = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;

              return (
                <Col>
                  <Popover
                    trigger="click"
                    title={`${productName} List`}
                    content={
                      <List
                        size="small"
                        dataSource={value}
                        renderItem={(item) => (
                          <List.Item>
                            {' '}
                            {productName} {item}{' '}
                          </List.Item>
                        )}
                      />
                    }
                  >
                    <Button block type="default" className={buttonStyles[key]}>
                      {value?.length || 0} {productName}
                    </Button>
                  </Popover>
                </Col>
              );
            })}
          </Row>
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
                  <Button
                    type="text"
                    icon={<EyeInvisibleTwoTone twoToneColor="#df0c69" />}
                    onClick={() => unpublishCoupon(record.id)}
                  />
                </Tooltip>
              ) : (
                <Tooltip title="Unhide Discount Code">
                  <Button
                    type="text"
                    icon={<EyeTwoTone twoToneColor="#52c41a" />}
                    onClick={() => publishCoupon(record.id)}
                  />
                </Tooltip>
              )}
            </Col>
            <Col xs={8}>
              <Tooltip title="Delete Discount Code">
                <Popconfirm
                  title="Do you want to delete this code?"
                  icon={<DeleteTwoTone twoToneColor="#FF4D4F" />}
                  okText="Yes, delete code"
                  cancelText="No"
                  onConfirm={() => console.log('Deleted')}
                >
                  <Button danger type="text" icon={<DeleteTwoTone twoToneColor="#FF4D4F" />} />
                </Popconfirm>
              </Tooltip>
            </Col>
          </Row>
        );
      },
    },
  ];

  const renderCouponItem = (coupon) => {};

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
                  />
                )
              ) : (
                <Empty description="No Published Coupons" />
              )}
            </Panel>
            <Panel header={<Title level={5}> Unpublished </Title>} key="Unpublished"></Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default Coupons;
