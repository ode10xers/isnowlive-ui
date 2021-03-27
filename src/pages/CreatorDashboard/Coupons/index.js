import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col, Button, Typography, Collapse, Empty, Tooltip, Popover, List, Card } from 'antd';
import { EditTwoTone, UpOutlined, DownOutlined } from '@ant-design/icons';

import apis from 'apis';

import Loader from 'components/Loader';
import Table from 'components/Table';
import CreateCouponModal from 'components/CreateCouponModal';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isMobileDevice } from 'utils/device';
import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';
import classNames from 'classnames';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const Coupons = () => {
  const { t: translate } = useTranslation();
  const [isLoading, setIsLoading] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const [expandedPublishedRowKeys, setExpandedPublishedRowKeys] = useState([]);
  const [expandedUnpublishedRowKeys, setExpandedUnpublishedRowKeys] = useState([]);

  const toggleExpandAllPublished = () => {
    if (expandedPublishedRowKeys.length > 0) {
      setExpandedPublishedRowKeys([]);
    } else {
      setExpandedPublishedRowKeys(coupons?.filter((coupon) => coupon.is_published).map((coupon) => coupon.external_id));
    }
  };

  const expandRowPublished = (rowKey) => {
    const tempExpandedRowsArray = expandedPublishedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedPublishedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRowPublished = (rowKey) =>
    setExpandedPublishedRowKeys(expandedPublishedRowKeys.filter((key) => key !== rowKey));

  const toggleExpandAllUnpublished = () => {
    if (expandedUnpublishedRowKeys.length > 0) {
      setExpandedUnpublishedRowKeys([]);
    } else {
      setExpandedUnpublishedRowKeys(
        coupons?.filter((coupon) => !coupon.is_published).map((coupon) => coupon.external_id)
      );
    }
  };

  const expandRowUnpublished = (rowKey) => {
    const tempExpandedRowsArray = expandedUnpublishedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedUnpublishedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRowUnpublished = (rowKey) =>
    setExpandedUnpublishedRowKeys(expandedUnpublishedRowKeys.filter((key) => key !== rowKey));

  const getCreatorCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.coupons.getCreatorCoupons();

      if (isAPISuccess(status) && data) {
        setCoupons(data);
      }
    } catch (error) {
      showErrorModal('Failed fetching coupons', error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
    }

    setIsLoading(false);
  }, [translate]);

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

  const generateCouponColumns = (published) => [
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
      title: published ? (
        <Button shape="round" type="primary" onClick={() => toggleExpandAllPublished()}>
          {expandedPublishedRowKeys.length > 0 ? translate('COLLAPSE') : translate('EXPAND')} {translate('ALL')}
        </Button>
      ) : (
        <Button shape="round" type="primary" onClick={() => toggleExpandAllUnpublished()}>
          {expandedUnpublishedRowKeys.length > 0 ? translate('COLLAPSE') : translate('EXPAND')} {translate('ALL')}
        </Button>
      ),
      align: 'right',
      width: '220px',
      render: (text, record) => {
        const redemptionText = `${record.redemption?.length || 0} Users`;

        return (
          <Row gutter={[8, 8]} justify="end">
            <Col xs={4}>
              <Tooltip title={translate('EDIT_DISCOUNT_CODE')}>
                <Button type="link" icon={<EditTwoTone />} onClick={() => editCoupon(record)} />
              </Tooltip>
            </Col>
            <Col xs={8}>
              {record.is_published ? (
                <Tooltip title={translate('HIDE_DISCOUNT_CODE')}>
                  <Button danger type="link" onClick={() => unpublishCoupon(record.external_id)}>
                    {translate('HIDE')}
                  </Button>
                </Tooltip>
              ) : (
                <Tooltip title={translate('SHOW_DISCOUNT_CODE')}>
                  <Button type="link" className={styles.greenBtn} onClick={() => publishCoupon(record.external_id)}>
                    {translate('SHOW')}
                  </Button>
                </Tooltip>
              )}
            </Col>
            <Col xs={12}>
              {record.is_published ? (
                expandedPublishedRowKeys.includes(record.external_id) ? (
                  <Button block type="link" onClick={() => collapseRowPublished(record.external_id)}>
                    {redemptionText} <UpOutlined />
                  </Button>
                ) : (
                  <Button block type="link" onClick={() => expandRowPublished(record.external_id)}>
                    {redemptionText} <DownOutlined />
                  </Button>
                )
              ) : expandedUnpublishedRowKeys.includes(record.external_id) ? (
                <Button block type="link" onClick={() => collapseRowUnpublished(record.external_id)}>
                  {redemptionText} <UpOutlined />
                </Button>
              ) : (
                <Button block type="link" onClick={() => expandRowUnpublished(record.external_id)}>
                  {redemptionText} <DownOutlined />
                </Button>
              )}
            </Col>
          </Row>
        );
      },
    },
  ];

  const redemptionColumns = [
    {
      title: translate('USER_NAME'),
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: translate('DISCOUNT_AMOUNT'),
      dataIndex: 'amount',
      key: 'amount',
      render: (text, record) => `${record.currency?.toUpperCase()} ${record.amount}`,
    },
  ];

  const renderRedemptionList = (record) => {
    return (
      <div className={classNames(styles.mb20, styles.mt20)}>
        <Table columns={redemptionColumns} data={record.redemption} rowKey={(record) => record.order_id} />
      </div>
    );
  };

  const renderMobileCouponItem = (coupon) => {
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
        title={`${productName} ${translate('LIST')}`}
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
          bodyStyle={{ padding: '24px 24px 10px 24px' }}
          actions={[
            <Tooltip title={translate('EDIT_DISCOUNT_CODE')}>
              <Button type="link" icon={<EditTwoTone />} onClick={() => editCoupon(coupon)} />
            </Tooltip>,
            coupon.is_published ? (
              <Tooltip title={translate('HIDE_DISCOUNT_CODE')}>
                <Button danger type="link" onClick={() => unpublishCoupon(coupon.external_id)}>
                  {translate('HIDE')}
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title={translate('SHOW_DISCOUNT_CODE')}>
                <Button type="link" className={styles.greenBtn} onClick={() => publishCoupon(coupon.external_id)}>
                  {translate('SHOW')}
                </Button>
              </Tooltip>
            ),
            coupon.is_published ? (
              expandedPublishedRowKeys.includes(coupon.external_id) ? (
                <Button type="link" onClick={() => collapseRowPublished(coupon.external_id)} icon={<UpOutlined />} />
              ) : (
                <Button type="link" onClick={() => expandRowPublished(coupon.external_id)} icon={<DownOutlined />} />
              )
            ) : expandedUnpublishedRowKeys.includes(coupon.external_id) ? (
              <Button type="link" onClick={() => collapseRowUnpublished(coupon.external_id)} icon={<UpOutlined />} />
            ) : (
              <Button type="link" onClick={() => expandRowUnpublished(coupon.external_id)} icon={<DownOutlined />} />
            ),
          ]}
        >
          {layout(translate('DISCOUNT_VALUE'), `${coupon.value} %`)}
          <Row gutter={[8, 16]}>
            <Col xs={18}>
              <Text strong>{translate('APPLICABLE_PRODUCTS')}</Text> :{' '}
            </Col>
            <Col xs={24}>
              <Row gutter={[8, 8]} justify="center">
                <Col xs={12}>{productListBtn}</Col>
              </Row>
            </Col>
          </Row>
        </Card>
        {coupon.is_published
          ? expandedPublishedRowKeys.includes(coupon.external_id) && (
              <Row className={styles.cardExpansion}>{coupon.redemption?.map(renderMobileRedemptionList)}</Row>
            )
          : expandedUnpublishedRowKeys.includes(coupon.external_id) && (
              <Row className={styles.cardExpansion}>{coupon.redemption?.map(renderMobileRedemptionList)}</Row>
            )}
      </Col>
    );
  };

  const renderMobileRedemptionList = (item) => {
    const layout = (label, value) => (
      <Row>
        <Col span={13}>
          <Text strong> {label} </Text>
        </Col>
        <Col span={11}>: {value}</Col>
      </Row>
    );

    return (
      <Col xs={24} key={item.order_id}>
        <Card bodyStyle={{ padding: '20px 10px' }} title={<Title level={5}> {item.customer_name} </Title>}>
          {layout(translate('DISCOUNT_AMOUNT'), `${item.currency?.toUpperCase()} ${item.amount}`)}
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
        <Col xs={12} md={14} lg={18}>
          <Title level={4}> {translate('COUPONS')} </Title>
        </Col>
        <Col xs={24} md={10} lg={6}>
          <Button block type="primary" onClick={() => showCreateCouponModal()}>
            {translate('CREATE_COUPONS')}
          </Button>
        </Col>
        <Col xs={24}>
          <Collapse>
            <Panel header={<Title level={5}> {translate('PUBLISHED')} </Title>} key="Published">
              {coupons?.length ? (
                isMobileDevice ? (
                  <Loader loading={isLoading} size="large" text="Loading coupons">
                    <Row gutter={[8, 16]}>
                      <Col xs={24}>
                        <Button block shape="round" type="primary" onClick={() => toggleExpandAllPublished()}>
                          {expandedPublishedRowKeys.length > 0 ? translate('COLLAPSE') : translate('EXPAND')}{' '}
                          {translate('ALL')}
                        </Button>
                      </Col>
                      {coupons?.filter((coupon) => coupon?.is_published).map(renderMobileCouponItem)}
                    </Row>
                  </Loader>
                ) : (
                  <Table
                    sticky={true}
                    size="small"
                    columns={generateCouponColumns(true)}
                    data={coupons?.filter((coupon) => coupon?.is_published)}
                    loading={isLoading}
                    rowKey={(record) => record.external_id}
                    expandable={{
                      expandedRowRender: renderRedemptionList,
                      expandRowByClick: true,
                      expandIconColumnIndex: -1,
                      expandedRowKeys: expandedPublishedRowKeys,
                    }}
                  />
                )
              ) : (
                <Empty description={translate('NO_PUBLISHED_COUPONS')} />
              )}
            </Panel>
            <Panel header={<Title level={5}> {translate('UNPUBLISHED')} </Title>} key="Unpublished">
              {coupons?.length ? (
                isMobileDevice ? (
                  <Loader loading={isLoading} size="large" text={translate('LOADING_COUPONS')}>
                    <Row gutter={[8, 16]}>
                      <Col xs={24}>
                        <Button block shape="round" type="primary" onClick={() => toggleExpandAllUnpublished()}>
                          {expandedUnpublishedRowKeys.length > 0 ? translate('COLLAPSE') : translate('EXPAND')}{' '}
                          {translate('ALL')}
                        </Button>
                      </Col>
                      {coupons?.filter((coupon) => !coupon?.is_published).map(renderMobileCouponItem)}
                    </Row>
                  </Loader>
                ) : (
                  <Table
                    sticky={true}
                    size="small"
                    columns={generateCouponColumns(false)}
                    data={coupons?.filter((coupon) => !coupon?.is_published)}
                    loading={isLoading}
                    rowKey={(record) => record.external_id}
                    expandable={{
                      expandedRowRender: renderRedemptionList,
                      expandRowByClick: true,
                      expandIconColumnIndex: -1,
                      expandedRowKeys: expandedUnpublishedRowKeys,
                    }}
                  />
                )
              ) : (
                <Empty description={translate('NO_UNPUBLISHED_COUPONS')} />
              )}
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default Coupons;
