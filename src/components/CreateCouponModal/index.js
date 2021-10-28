import React, { useState, useEffect, useCallback } from 'react';

import {
  Row,
  Col,
  Modal,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Checkbox,
  Typography,
  Divider,
  message,
  Radio,
} from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import { resetBodyStyle, showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import validationRules from 'utils/validation';
import { couponTypes } from 'utils/constants';

import { couponModalFormLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';

const { Text } = Typography;

// Just add the products here as necessary
const creatorProductInfo = [
  {
    key: 'COURSE',
    name: 'Courses',
    apiMethod: apis.courses.getCreatorCourses,
  },
  {
    key: 'SESSION',
    name: 'Sessions',
    apiMethod: apis.session.getSession,
  },
  {
    key: 'PASS',
    name: 'Passes',
    apiMethod: apis.passes.getCreatorPasses,
  },
  {
    key: 'VIDEO',
    name: 'Videos',
    apiMethod: apis.videos.getCreatorVideos,
  },
];

const formCouponTypes = {
  ABSOLUTE: {
    value: couponTypes.ABSOLUTE,
    label: 'Flat value coupons',
  },
  PERCENTAGE: {
    value: couponTypes.PERCENTAGE,
    label: 'Percent based coupons',
  },
};

const formInitialValues = {
  discountAmount: 1,
  couponType: formCouponTypes.ABSOLUTE.value,
};

// ! Coupons API will use external IDs, so for SESSION and PASS need to use external_id
const CreateCouponModal = ({ visible, closeModal, editedCoupon = null }) => {
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState({});
  const [selectedProductType, setSelectedProductType] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  const [selectedCouponType, setSelectedCouponType] = useState(formCouponTypes.ABSOLUTE.value);

  // For products that have different keys for names/id
  const getProductId = (productType, productData) => {
    switch (productType) {
      case 'course':
        return productData['id'];
      case 'session':
        return productData['session_external_id'];
      case 'pass':
        return productData['external_id'];
      case 'video':
        return productData['external_id'];
      default:
        break;
    }

    return '';
  };

  const getProductName = (productType, productData) => {
    switch (productType) {
      case 'course':
        return productData['name'];
      case 'session':
        return productData['name'];
      case 'pass':
        return productData['name'];
      case 'video':
        return productData['title'];
      default:
        break;
    }

    return '';
  };

  const fetchCreatorProducts = useCallback(async () => {
    setIsLoading(true);

    let productInfo = {};

    for (const product of creatorProductInfo) {
      try {
        const { status, data } = await product.apiMethod();

        if (isAPISuccess(status) && data) {
          productInfo[product.key.toLowerCase()] = data;
        }
      } catch (error) {
        message.error(error?.response?.data?.message || `Failed to fetch ${product.name}`);
      }
    }

    setProducts(productInfo);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (visible) {
      if (editedCoupon) {
        form.setFieldsValue({
          discountCode: editedCoupon.code,
          couponType: editedCoupon.coupon_type ?? formCouponTypes.ABSOLUTE.value,
          couponValue: editedCoupon.value ?? 1,
          selectedProductType: editedCoupon.product_type?.toLowerCase() ?? null,
          selectedProducts: editedCoupon.product_ids ?? [],
        });

        setSelectedCouponType(editedCoupon.coupon_type ?? formCouponTypes.ABSOLUTE.value);
        setSelectedProductType(editedCoupon.product_type?.toLowerCase() ?? null);
        setSelectedProductIds(editedCoupon.product_ids);
      } else {
        form.resetFields();
      }

      fetchCreatorProducts();
    } else {
      setSelectedCouponType(formCouponTypes.ABSOLUTE.value);
      setSelectedProductType([]);
      setSelectedProductIds([]);
      form.resetFields();
    }
  }, [form, editedCoupon, visible, fetchCreatorProducts]);

  const handleSelectedProductTypesChanged = (values) => {
    setSelectedProductType(values);
    setSelectedProductIds([]);
    form.setFieldsValue({ ...form.getFieldsValue(), selectedProducts: [] });
  };

  const handleSelectedProductIdsChanged = (values) => {
    setSelectedProductIds(values);
    form.setFieldsValue({ ...form.getFieldsValue(), selectedProducts: values });
  };

  const handleSelectAllProduct = (e) => {
    if (e.target.checked) {
      const selectedProducts = products[selectedProductType];
      handleSelectedProductIdsChanged(selectedProducts.map((product) => getProductId(selectedProductType, product)));
    } else {
      handleSelectedProductIdsChanged([]);
    }
  };

  const handleCouponTypeChanged = (e) => {
    setSelectedCouponType(e.target.value);

    form.setFieldsValue({
      ...form.getFieldsValue(),
      couponType: e.target.value,
    });
  };

  const handleFinish = async (values) => {
    setSubmitting(true);

    try {
      const payload = {
        code: values.discountCode,
        coupon_type: selectedCouponType ?? formCouponTypes.ABSOLUTE.value,
        value: values.couponValue ?? 1,
        product_type: selectedProductType?.toUpperCase() ?? values.selectedProductType?.toUpperCase() ?? '',
        product_ids: selectedProductIds ?? values.selectedProducts ?? [],
      };

      const { status } = editedCoupon
        ? await apis.coupons.updateCoupon(editedCoupon.external_id, payload)
        : await apis.coupons.createCoupon(payload);

      if (isAPISuccess(status)) {
        showSuccessModal(`Discount Code ${editedCoupon ? 'Updated' : 'Created'}`);
        closeModal(true);
      }
    } catch (error) {
      if (error?.response?.status === 500 && error?.response?.data?.message === 'a coupon like this already exists') {
        showErrorModal(
          'Duplicate Discount Code',
          'A coupon with the same discount code already exists! Please use a different discount code'
        );
      } else {
        showErrorModal(`Failed to ${editedCoupon ? 'edit' : 'create'} discount code`, error?.response?.data?.message);
      }
    }

    setSubmitting(false);
  };

  return (
    <Modal
      title={`${editedCoupon ? 'Edit' : 'Create New'} Coupon`}
      centered={true}
      visible={visible}
      footer={null}
      onCancel={() => closeModal(false)}
      width={640}
      afterClose={resetBodyStyle}
    >
      <Loader size="large" loading={isLoading}>
        <Form
          form={form}
          layout="horizontal"
          name="CouponForm"
          onFinish={handleFinish}
          initialValues={formInitialValues}
          scrollToFirstError={true}
        >
          <Row gutter={[8, 10]}>
            <Col xs={24}>
              <Form.Item
                {...couponModalFormLayout}
                id="discountCode"
                name="discountCode"
                label="Discount Code"
                rules={validationRules.discountCodeValidation}
              >
                <Input placeholder="Input code here (Alphanumeric)" maxLength={20} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                {...couponModalFormLayout}
                id="couponType"
                name="couponType"
                label="Coupon Type"
                rules={validationRules.requiredValidation}
              >
                <Radio.Group onChange={handleCouponTypeChanged}>
                  {Object.values(formCouponTypes).map((cType) => (
                    <Radio key={cType.value} value={cType.value}>
                      {cType.label}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col xs={24}>
              {selectedCouponType === formCouponTypes.PERCENTAGE.value ? (
                <Form.Item {...couponModalFormLayout} label="Discount Amount (%)" required={true}>
                  <Row gutter={4}>
                    <Col xs={20}>
                      <Form.Item
                        noStyle
                        id="couponValue"
                        name="couponValue"
                        rules={validationRules.numberValidation('Please Input valid discount percentage', 1, true, 100)}
                      >
                        <InputNumber
                          min={1}
                          max={100}
                          precision={0}
                          placeholder="Discount amount (in percent)"
                          className={styles.numericInput}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={4} className={styles.helpTextWrapper}>
                      <Text strong> % </Text>
                    </Col>
                  </Row>
                </Form.Item>
              ) : (
                <Form.Item
                  {...couponModalFormLayout}
                  id="couponValue"
                  name="couponValue"
                  label="Discount Amount (flat)"
                  rules={validationRules.numberValidation('Please Input valid discount amount', 1)}
                >
                  <InputNumber
                    min={1}
                    precision={2}
                    placeholder="Discount amount (flat amount)"
                    className={styles.numericInput}
                  />
                </Form.Item>
              )}
            </Col>
            <Col xs={24}>
              <Form.Item
                {...couponModalFormLayout}
                id="selectedProductType"
                name="selectedProductType"
                label="Applicable Product Types"
                rules={validationRules.requiredValidation}
              >
                <Select
                  showArrow
                  showSearch={false}
                  placeholder="Select product type(s)"
                  maxTagCount={2}
                  options={Object.entries(products).map(([key, val]) => ({
                    value: key,
                    label: key.charAt(0).toUpperCase() + key.slice(1),
                  }))}
                  value={selectedProductType}
                  onChange={handleSelectedProductTypesChanged}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                {...couponModalFormLayout}
                id="selectedProducts"
                name="selectedProducts"
                label="Applicable Products"
                rules={validationRules.arrayValidation}
              >
                <Select
                  showArrow
                  showSearch
                  placeholder="Select the products applicable with this code"
                  mode="multiple"
                  maxTagCount={2}
                  onChange={handleSelectedProductIdsChanged}
                  value={selectedProductIds}
                  dropdownRender={(menu) => (
                    <div>
                      {menu}
                      <Divider style={{ margin: '4px 0' }} />
                      {selectedProductType && products[selectedProductType]?.length > 0 && (
                        <Checkbox
                          className={styles.ml10}
                          onChange={handleSelectAllProduct}
                          indeterminate={
                            0 < selectedProductIds.length &&
                            selectedProductIds.length < products[selectedProductType]?.length
                          }
                          checked={products[selectedProductType]?.length === selectedProductIds.length}
                        >
                          Select All
                        </Checkbox>
                      )}
                    </div>
                  )}
                >
                  {Object.entries(products)
                    .filter(([key, value]) => selectedProductType === key.toLowerCase())
                    .map(([key, value]) => (
                      <Select.OptGroup label={`${key.charAt(0).toUpperCase()}${key.slice(1)}`} key={key}>
                        {value?.map((product) => (
                          <Select.Option key={getProductId(key, product)} value={getProductId(key, product)}>
                            {getProductName(key, product)}
                          </Select.Option>
                        ))}
                      </Select.OptGroup>
                    ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" align="center" gutter={8} className={styles.modalActionRow}>
            <Col xs={12} md={4}>
              <Button block type="default" loading={submitting} onClick={() => closeModal(false)}>
                Cancel
              </Button>
            </Col>
            <Col xs={12} md={10}>
              <Button block type="primary" loading={submitting} htmlType="submit">
                {editedCoupon ? 'Edit' : 'Create'} Discount Code
              </Button>
            </Col>
          </Row>
        </Form>
      </Loader>
    </Modal>
  );
};

export default CreateCouponModal;
