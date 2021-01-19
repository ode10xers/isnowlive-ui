import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Modal, Form, Typography, Radio, Input, InputNumber, Select, Button } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';

import { showErrorModal, showSuccessModal } from 'utils/modals';
import validationRules from 'utils/validation';
import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

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

const CreateClassPassModal = ({ visible, closeModal, editPassId = null }) => {
  const [form] = Form.useForm();

  const [classes, setClasses] = useState([]);
  const [currency, setCurrency] = useState('SGD');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [passType, setPassType] = useState(passTypes.LIMITED.name);

  const fetchAllClasses = useCallback(async () => {
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

  const fetchPassInfo = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data } = await apis.passes.getPassById(editPassId);

      if (data) {
        setSelectedClasses(data.sessions.map((session) => ({ value: session.session_id, label: session.name })));
        setPassType(data.limited ? passTypes.LIMITED.name : passTypes.UNLIMITED.name);

        form.setFieldsValue({
          passName: data.name,
          classList: data.sessions.map((session) => ({ value: session.session_id, label: session.name })),
          passType: data.limited ? passTypes.LIMITED.name : passTypes.UNLIMITED.name,
          classCount: data.class_count,
          validity: data.validity,
          price: data.price,
        });
      }
    } catch (error) {
      showErrorModal('Failed to fetch pass info', error?.response?.data?.message || 'Something went wrong');
    }

    setIsLoading(false);
  }, [editPassId]);

  useEffect(() => {
    if (visible) {
      if (editPassId) {
        fetchPassInfo();
      }

      fetchAllClasses();
    } else {
      form.setFieldsValue({
        ...form.getFieldsValue(),
        ...formInitialValues,
      });
    }
  }, [visible, editPassId, fetchAllClasses, fetchPassInfo, form]);

  const handleChangeLimitType = (passLimitType) => {
    form.setFieldsValue({
      ...form.getFieldsValue(),
      classCount: passLimitType === passTypes.UNLIMITED.name ? 100 : 10,
    });
    setPassType(passLimitType);
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
        name: values.passName,
        session_ids: selectedClasses || values.classList || [],
        class_count: passTypes.LIMITED.name === passType ? values.classCount || 10 : 1000,
        validity: values.validity,
        price: values.price,
        currency: currency,
        limited: passTypes.LIMITED.name === passType || true,
      };

      if (editPassId) {
        const response = await apis.passes.updateClassPass(editPassId, data);

        if (isAPISuccess(response.status)) {
          showSuccessModal(`${data.name} successfully updated`);
          closeModal();
        }
      } else {
        const response = await apis.passes.createClassPass(data);

        if (isAPISuccess(response.status)) {
          showSuccessModal(`${data.name} successfully created`);
          closeModal();
        }
      }
    } catch (error) {
      showErrorModal(`Failed to ${editPassId ? 'update' : 'create'} new pass`);
    }

    setIsSubmitting(false);
  };

  return (
    <Modal
      title="Create New Class Pass"
      centered={true}
      visible={visible}
      footer={null}
      destroyOnClose={true}
      onCancel={() => closeModal()}
    >
      <Loader size="large" loading={isLoading}>
        <Form layout="vertical" name="createClassPass" form={form} onFinish={handleFinish}>
          <Row className="class-pass-row">
            <Col xs={12}>
              <Form.Item id="passName" name="passName" label="Class Pass Name" rules={validationRules.nameValidation}>
                <Input placeholder="Enter Class Pass Name" />
              </Form.Item>
            </Col>
            <Col xs={{ span: 11, offset: 1 }}>
              <Form.Item
                id="classList"
                name="classList"
                label="Apply to Class(es)"
                extra="The classes that will be bookable using this pass"
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
          <Row className="class-pass-row">
            <Col xs={12}>
              <Form.Item
                id="passType"
                name="passType"
                label="Class Pass Type"
                extra="Type of usage limit this pass will have"
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
            <Col xs={{ span: 11, offset: 1 }}>
              <Form.Item
                id="classCount"
                name="classCount"
                label="Class Count"
                extra="The maximum amount of classes bookable with this pass"
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
          <Row className="class-pass-row">
            <Col xs={12}>
              <Form.Item
                id="validity"
                name="validity"
                label="Pass Validity (days)"
                extra="The duration in days this pass will be usable after purchase"
                rules={validationRules.numberValidation('Please Input Pass Validity', 1, false)}
              >
                <InputNumber min={1} placeholder="Pass Validity" className={styles.numericInput} />
              </Form.Item>
            </Col>
            <Col xs={{ span: 11, offset: 1 }}>
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
          <Row justify="end" align="center" className={styles.modalActionRow}>
            <Col xs={8} md={5}>
              <Button type="default" onClick={() => closeModal()} loading={isSubmitting}>
                Cancel
              </Button>
            </Col>
            <Col xs={8} md={7}>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                Create Class Pass
              </Button>
            </Col>
          </Row>
        </Form>
      </Loader>
    </Modal>
  );
};

export default CreateClassPassModal;
