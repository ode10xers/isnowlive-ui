import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Row, Col, Modal, Button, Form, Input, InputNumber, Select, Typography, message } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import validationRules from 'utils/validation';
import { i18n } from 'utils/i18n';

import { couponModalFormLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';

const { Text } = Typography;

const formInitialValues = {
  discountAmount: 1,
};

// Just add the products here as necessary
const creatorProductInfo = [
  {
    key: 'COURSE',
    name: i18n.t('COURSES'),
    apiMethod: apis.courses.getCreatorCourses,
  },
];

// ! Coupons API will use external IDs, so for SESSION and PASS need to use external_id
const CreateCouponModal = ({ visible, closeModal, editedCoupon = null }) => {
  const { t } = useTranslation();

  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState({});
  const [selectedProductTypes, setSelectedProductTypes] = useState([]);

  // For products that have different keys for names/id
  const getProductId = (productType, productData) => {
    switch (productType) {
      case 'course':
        return productData['id'];
      default:
        break;
    }

    return '';
  };

  const getProductName = (productType, productData) => {
    switch (productType) {
      case 'course':
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
          productInfo[product.key.toLowerCase()] = data;
        }
      } catch (error) {
        message.error(error?.response?.data?.message || `${t('FAILED_TO_FETCH')} ${product.name}`);
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
          discountPercent: editedCoupon.value,
          selectedProductTypes: editedCoupon.product_type.toLowerCase(),
          selectedProducts: editedCoupon.product_ids,
        });

        setSelectedProductTypes(editedCoupon.product_type.toLowerCase());
      } else {
        form.resetFields();
      }

      fetchCreatorProducts();
    }
  }, [form, editedCoupon, visible, fetchCreatorProducts]);

  const handleSelectedProductTypesChanged = (values) => {
    setSelectedProductTypes(values);
    form.setFieldsValue({ ...form.getFieldsValue(), selectedProducts: [] });
  };

  const handleFinish = async (values) => {
    setSubmitting(true);

    try {
      const payload = {
        code: values.discountCode,
        value: values.discountPercent,
        product_type: selectedProductTypes.toUpperCase() || values.selectedProductTypes.toUpperCase(),
        product_ids: values.selectedProducts,
      };

      const { status } = editedCoupon
        ? await apis.coupons.updateCoupon(editedCoupon.external_id, payload)
        : await apis.coupons.createCoupon(payload);

      if (isAPISuccess(status)) {
        showSuccessModal(`${t('DISCOUNT_CODE')} ${editedCoupon ? t('UPDATED') : t('CREATED')}`);
        closeModal(true);
      }
    } catch (error) {
      if (error?.response?.status === 500 && error?.response?.data?.message === 'a coupon like this already exists') {
        showErrorModal(t('DUPLICATE_DISCOUNT_CODE'), t('DUPLICATE_DISCOUNT_CODE_MESSAGE'));
      } else {
        showErrorModal(
          `${t('FAILED_TO')} ${editedCoupon ? t('EDIT').toLowerCase() : t('CREATE').toLowerCase()} ${t(
            'DISCOUNT_CODE'
          ).toLowerCase()}`,
          error?.response?.data?.message
        );
      }
    }

    setSubmitting(false);
  };

  return (
    <Modal
      title={`${editedCoupon ? t('EDIT') : t('CREATE')} ${t('COUPONS')}`}
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
                label={t('DISCOUNT_CODE')}
                rules={validationRules.discountCodeValidation}
              >
                <Input placeholder={t('COUPON_CODE_INPUT_PLACEHOLDER')} maxLength={20} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item {...couponModalFormLayout} label={`${t('DISCOUNT_AMOUNT')} (%)`} required={true}>
                <Row gutter={4}>
                  <Col xs={20}>
                    <Form.Item
                      noStyle
                      id="discountPercent"
                      name="discountPercent"
                      rules={validationRules.numberValidation(t('DISCOUNT_AMOUNT_ERROR_TEXT'), 1, true, 100)}
                    >
                      <InputNumber
                        min={1}
                        max={100}
                        precision={0}
                        placeholder={t('DISCOUNT_AMOUNT')}
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
                id="selectedProductTypes"
                name="selectedProductTypes"
                label={t('APPLICABLE_PRODUCT_TYPES')}
                rules={validationRules.requiredValidation}
              >
                <Select
                  showArrow
                  showSearch={false}
                  placeholder={t('SELECT_PRODUCT_TYPE')}
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
                label={t('APPLICABLE_PRODUCTS')}
                rules={validationRules.arrayValidation}
              >
                <Select
                  showArrow
                  showSearch
                  placeholder={t('SELECT_PRODUCT_TYPE_PLACEHOLDER')}
                  mode="multiple"
                  maxTagCount={2}
                >
                  {Object.entries(products)
                    .filter(([key, value]) => selectedProductTypes.includes(key.toLowerCase()))
                    .map(([key, value]) => (
                      <Select.OptGroup label={`${key.charAt(0).toUpperCase()}${key.slice(1)}`} key={key}>
                        {value?.map((product) => (
                          <Select.Option key={product.id} value={getProductId(key, product)}>
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
                {t('CANCEL')}
              </Button>
            </Col>
            <Col xs={12} md={10}>
              <Button block type="primary" loading={submitting} htmlType="submit">
                {editedCoupon ? t('EDIT') : t('CREATE')} {t('DISCOUNT_CODE')}
              </Button>
            </Col>
          </Row>
        </Form>
      </Loader>
    </Modal>
  );
};

export default CreateCouponModal;
