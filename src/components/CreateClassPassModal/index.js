import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Modal, Form, Typography, Radio, Input, InputNumber, Select, Button } from 'antd';
import { TwitterPicker } from 'react-color';

import apis from 'apis';

import Loader from 'components/Loader';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { isAPISuccess, generateRandomColor } from 'utils/helper';

import styles from './styles.module.scss';

const { Text } = Typography;

const passTypes = {
  LIMITED: {
    name: 'LIMITED',
    label: 'Limited',
  },
  UNLIMITED: {
    name: 'UNLIMITED',
    label: 'Unlimited',
  },
};

const formInitialValues = {
  passName: '',
  classList: [],
  passType: passTypes.LIMITED.name,
};

const whiteColor = '#ffffff';

const colorPickerChoices = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#1890ff',
  '#009688',
  '#4caf50',
  '#ffc107',
  '#ff9800',
  '#ff5722',
  '#795548',
  '#607d8b',
  '#9ae2b6',
  '#bf6d11',
  '#f379b2',
  '#34727c',
  '#5030fd',
];

const CreateClassPassModal = ({ visible, closeModal, editedPass = null }) => {
  const [form] = Form.useForm();

  const [classes, setClasses] = useState([]);
  const [currency, setCurrency] = useState('SGD');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [passType, setPassType] = useState(passTypes.LIMITED.name);
  const [colorCode, setColorCode] = useState(generateRandomColor());

  const fetchAllClassesForCreator = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data } = await apis.session.getSession();

      if (data) {
        setClasses(data.map((session) => ({ value: session.session_id, label: session.name })));
        setCurrency(data[0].currency);
      }
    } catch (error) {
      showErrorModal('Failed to fetch classes', error?.response?.data?.message || 'Something went wrong');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (visible) {
      if (editedPass) {
        form.setFieldsValue({
          passName: editedPass.name,
          classList: editedPass.sessions.map((session) => session.session_id),
          passType: editedPass.limited ? passTypes.LIMITED.name : passTypes.UNLIMITED.name,
          classCount: editedPass.class_count,
          validity: editedPass.validity,
          price: editedPass.price,
          color_code: editedPass.color_code || whiteColor,
        });
        setCurrency(editedPass.currency);
        setPassType(editedPass.limited ? passTypes.LIMITED.name : passTypes.UNLIMITED.name);
        setSelectedClasses(editedPass.sessions.map((session) => session.session_id));
        setColorCode(editedPass.color_code || whiteColor);
        form.validateFields(['classList']);
      } else {
        form.resetFields();
      }

      fetchAllClassesForCreator();
    }
  }, [visible, editedPass, fetchAllClassesForCreator, form]);

  const handleChangeLimitType = (passLimitType) => {
    form.setFieldsValue({
      ...form.getFieldsValue(),
      classCount: passLimitType === passTypes.UNLIMITED.name ? 1000 : 10,
    });
    setPassType(passLimitType);
  };

  const handleColorChange = (color) => {
    setColorCode(color.hex || whiteColor);
    form.setFieldsValue({ ...form.getFieldsValue(), color_code: color.hex || whiteColor });
  };

  const handleFinish = async (values) => {
    setIsSubmitting(true);

    try {
      if (selectedClasses.length <= 0 && values.classList.length <= 0) {
        showErrorModal('Select Classes', 'Please select some class to include in the pass');
        form.setFieldsValue(values);
        return;
      }

      if (passType !== passTypes.LIMITED.name && passType !== passTypes.UNLIMITED.name) {
        showErrorModal('Select Pass Type', 'Please select a pass type for this pass');
        form.setFieldsValue(values);
        return;
      }

      let data = {
        currency: currency,
        price: values.price,
        name: values.passName,
        validity: values.validity,
        session_ids: selectedClasses || values.classList || [],
        class_count: passTypes.LIMITED.name === passType ? values.classCount || 10 : 1000,
        limited: passTypes.LIMITED.name === passType,
        color_code: colorCode,
      };

      const response = editedPass
        ? await apis.passes.updateClassPass(editedPass.id, data)
        : await apis.passes.createClassPass(data);

      if (isAPISuccess(response.status)) {
        showSuccessModal(`${data.name} successfully ${editedPass ? 'updated' : 'created'}`);
        closeModal(true);
      }
    } catch (error) {
      showErrorModal(`Failed to ${editedPass ? 'update' : 'create'} new pass`);
    }

    setIsSubmitting(false);
  };

  return (
    <Modal
      title={`${editedPass ? 'Edit' : 'Create New'} Class Pass`}
      centered={true}
      visible={visible}
      footer={null}
      onCancel={() => closeModal(false)}
      width={720}
    >
      <Loader size="large" loading={isLoading}>
        <Form
          layout="vertical"
          name="classPassForm"
          form={form}
          onFinish={handleFinish}
          initialValues={formInitialValues}
        >
          <Row className={styles.classPassRow} gutter={[8, 16]}>
            <Col xs={24} md={12}>
              <Form.Item id="passName" name="passName" label="Class Pass Name" rules={validationRules.nameValidation}>
                <Input placeholder="Enter Class Pass Name" maxLength={50} />
              </Form.Item>
            </Col>
            <Col xs={24} md={{ span: 11, offset: 1 }}>
              <Form.Item
                id="classList"
                name="classList"
                label="Apply to Class(es)"
                extra={<Text className={styles.helpText}> The classes that will be bookable using this pass </Text>}
                rules={validationRules.arrayValidation}
              >
                <Select
                  showArrow
                  showSearch={false}
                  placeholder="Select your Class(es)"
                  mode="multiple"
                  maxTagCount={2}
                  options={classes}
                  value={selectedClasses}
                  onChange={(val) => setSelectedClasses(val)}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row className={styles.classPassRow} gutter={[8, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                id="passType"
                name="passType"
                label="Class Pass Type"
                extra={<Text className={styles.helpText}>Type of usage limit this pass will have</Text>}
                rules={validationRules.requiredValidation}
              >
                <Radio.Group
                  className="pass-type-radio"
                  onChange={(e) => handleChangeLimitType(e.target.value)}
                  value={passType}
                  options={Object.values(passTypes).map((pType) => ({
                    label: pType.label,
                    value: pType.name,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={{ span: 11, offset: 1 }}>
              <Form.Item
                id="classCount"
                name="classCount"
                label="Class Count"
                extra={<Text className={styles.helpText}>The maximum amount of classes bookable with this pass</Text>}
                rules={[
                  {
                    required: true,
                    validator: (_, value) => {
                      if (passType === passTypes.LIMITED.name && !value) {
                        return Promise.reject('Please select the amount of classes');
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  disabled={passType === passTypes.UNLIMITED.name}
                  min={1}
                  placeholder="Amount of Class"
                  className={styles.numericInput}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row className={styles.classPassRow} gutter={[8, 16]}>
            <Col xs={24} md={12}>
              <Row>
                <Col xs={24}>
                  <Form.Item
                    id="validity"
                    name="validity"
                    label="Pass Validity (days)"
                    extra={
                      <Text className={styles.helpText}>
                        The duration in days this pass will be usable after purchase
                      </Text>
                    }
                    rules={validationRules.numberValidation('Please Input Pass Validity', 1, false)}
                  >
                    <InputNumber min={1} placeholder="Pass Validity" className={styles.numericInput} />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    id="price"
                    name="price"
                    label="Class Pass Price"
                    rules={validationRules.numberValidation('Please Input Pass Price', 1, false)}
                  >
                    <InputNumber min={0} placeholder="Class Pass Price" className={styles.numericInput} />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
            <Col xs={24} md={{ span: 11, offset: 1 }}>
              <Form.Item name="color_code" label="Color Tag" rules={validationRules.requiredValidation}>
                <div className={styles.colorPickerPreview} style={{ borderColor: colorCode }}>
                  <TwitterPicker
                    className={styles.colorPicker}
                    color={colorCode}
                    onChangeComplete={handleColorChange}
                    triangle="hide"
                    colors={colorPickerChoices}
                  />
                </div>
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" align="center" gutter={8} className={styles.modalActionRow}>
            <Col xs={12} md={4}>
              <Button block type="default" onClick={() => closeModal(false)} loading={isSubmitting}>
                Cancel
              </Button>
            </Col>
            <Col xs={12} md={6}>
              <Button block type="primary" htmlType="submit" loading={isSubmitting}>
                {editedPass ? 'Update' : 'Create'} Class Pass
              </Button>
            </Col>
          </Row>
        </Form>
      </Loader>
    </Modal>
  );
};

export default CreateClassPassModal;