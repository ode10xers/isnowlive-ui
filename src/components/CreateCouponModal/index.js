import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Modal, Button, Form, Input, InputNumber, Select, Typography, message } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
// import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import validationRules from 'utils/validation';

import { couponModalFormLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';

const { Text } = Typography;

const formInitialValues = {
  discountAmount: 1,
};

// Just add the products here as necessary
const creatorProductInfo = [
  {
    key: 'courses',
    name: 'Courses',
    apiMethod: apis.courses.getCreatorCourses,
  },
  {
    key: 'passes',
    name: 'Passes',
    apiMethod: apis.passes.getCreatorPasses,
  },
];

// Adding passes here for testing and demo purpose

const CreateCouponModal = ({ visible, closeModal, editedCoupon = null }) => {
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState({});
  const [selectedProductTypes, setSelectedProductTypes] = useState([]);

  // For products that have different keys for names/id
  const getProductId = (productType, productData) => {
    switch (productType) {
      case 'passes':
      case 'courses':
        return productData['id'];
      default:
        break;
    }

    return '';
  };

  const getProductName = (productType, productData) => {
    switch (productType) {
      case 'passes':
      case 'courses':
        return productData['name'];
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
          productInfo[product.key] = data;
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
      } else {
        form.resetFields();
      }

      fetchCreatorProducts();
    }
  }, [form, editedCoupon, visible, fetchCreatorProducts]);

  const handleSelectedProductTypesChanged = (values) => {
    //TODO: Also filter out the selectedProducts when this changes
    setSelectedProductTypes(values);
  };

  const handleFinish = async (values) => {
    setSubmitting(true);
    console.log(values);
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
              <Form.Item {...couponModalFormLayout} label="Discount Amount (%)" required={true}>
                <Row gutter={4}>
                  <Col xs={20}>
                    <Form.Item
                      noStyle
                      id="discountPercent"
                      name="discountPercent"
                      rules={validationRules.numberValidation('Please Input valid discount amount', 1, true, 100)}
                    >
                      <InputNumber
                        min={1}
                        max={100}
                        precision={0}
                        placeholder="Discount amount"
                        className={styles.numericInput}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={4} className={styles.helpTextWrapper}>
                    <Text strong> % </Text>
                  </Col>
                </Row>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                {...couponModalFormLayout}
                id="selectedProductType"
                name="selectedProductType"
                label="Applicable Product Types"
                rules={validationRules.arrayValidation}
              >
                <Select
                  showArrow
                  showSearch={false}
                  placeholder="Select product type(s)"
                  mode="multiple"
                  maxTagCount={2}
                  options={Object.entries(products).map(([key, val]) => ({
                    value: key,
                    label: key.charAt(0).toUpperCase() + key.slice(1),
                  }))}
                  value={selectedProductTypes}
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
                  maxTagCount={3}
                >
                  {Object.entries(products)
                    .filter(([key, value]) => selectedProductTypes.includes(key))
                    .map(([key, value]) => (
                      <Select.OptGroup label={`${key.charAt(0).toUpperCase()}${key.slice(1)}`} key={key}>
                        {value?.map((product) => (
                          <Select.Option value={`${key}_${getProductId(key, product)}`}>
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
            <Col xs={12} md={6}>
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
