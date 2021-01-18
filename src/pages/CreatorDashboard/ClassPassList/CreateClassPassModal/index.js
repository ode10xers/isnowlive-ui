import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Modal, Form, Typography, Radio, Input, InputNumber, Select, Button } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';

import { showErrorModal } from 'utils/modals';
import validationRules from 'utils/validation';

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

const CreateClassPassModal = ({ visible, closeModal }) => {
  const [form] = Form.useForm();

  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [passType, setPassType] = useState(passTypes.LIMITED.name);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllClasses = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data } = await apis.session.getSession();

      if (data) {
        setClasses(data.map((session) => ({ value: session.session_id, label: session.name })));
      }
    } catch (error) {
      showErrorModal('Failed to fetch classes', error?.response?.data?.message || 'Something went wrong');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (visible) {
      fetchAllClasses();
      form.setFieldsValue({
        ...form.getFieldsValue(),
        passType: passTypes.LIMITED.name,
      });
    }
  }, [visible, fetchAllClasses, form]);

  const handleFinish = () => {
    console.log(form.getFieldsValue());
  };

  return (
    <Loader size="large" loading={isLoading}>
      <Modal
        title="Create New Class Pass"
        centered={true}
        visible={visible}
        footer={null}
        destroyOnClose={true}
        onCancel={() => closeModal()}
      >
        <Form layout="vertical" preserve={false} name="createClassPass" form={form} onFinish={handleFinish}>
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
                rules={validationRules.requiredValidation}
              >
                <Radio.Group
                  className="pass-type-radio"
                  onChange={(e) => setPassType(e.target.value)}
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
                extra="The amount of classes bookable with this pass"
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
                <InputNumber min={1} max={10000} />
              </Form.Item>
            </Col>
          </Row>
          <Row className="class-pass-row">
            <Col xs={12}>
              <Form.Item
                id="validity"
                name="validity"
                label="Pass Validity (days)"
                rules={validationRules.numberValidation('Please Input Pass Validity', 1, false)}
              >
                <InputNumber min={1} placeholder="Pass Validity" />
              </Form.Item>
            </Col>
            <Col xs={{ span: 11, offset: 1 }}>
              <Form.Item
                id="price"
                name="price"
                label="Class Pass Price"
                rules={validationRules.numberValidation('Please Input Pass Price', 1, false)}
              >
                <InputNumber min={0} placeholder="Class Pass Price" />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" align="center">
            <Col xs={8} md={5}>
              <Button type="default" onClick={() => closeModal()}>
                {' '}
                Cancel{' '}
              </Button>
            </Col>
            <Col xs={8} md={7}>
              <Button type="primary" htmlType="submit">
                {' '}
                Create Class Pass{' '}
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Loader>
  );
};

export default CreateClassPassModal;
