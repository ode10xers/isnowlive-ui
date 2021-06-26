import React, { useState, useEffect } from 'react';

import { Modal, Row, Col, Input, Button, Form } from 'antd';
import { EditOutlined } from '@ant-design/icons';

import { resetBodyStyle } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { preventDefaults } from 'utils/helper';

import styles from './style.module.scss';

const ProductsEditView = ({ configValues, updateHandler }) => {
  const [form] = Form.useForm();

  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    if (configValues) {
      form.setFieldsValue(configValues);
    } else {
      form.resetFields();
    }
  }, [configValues, form]);

  const handleEditComponentClicked = (e) => {
    preventDefaults(e);
    setEditModalVisible(true);
  };

  const cancelEditChanges = (e) => {
    preventDefaults(e);
    setEditModalVisible(false);
  };

  const handleFinishEditComponent = (values) => {
    updateHandler(values);
    setEditModalVisible(false);
  };

  return (
    <>
      <Row justify="center">
        <Col xs={12} className={styles.editViewButtonContainer}>
          <button className={styles.editComponentButton} onClick={handleEditComponentClicked}>
            <EditOutlined />
          </button>
        </Col>
      </Row>
      <Modal
        title="Edit this component"
        visible={editModalVisible}
        centered={true}
        width={640}
        footer={null}
        afterClose={resetBodyStyle}
        onCancel={cancelEditChanges}
      >
        <Form form={form} layout="vertical" scrollToFirstError={true} onFinish={handleFinishEditComponent}>
          <Row gutter={[8, 16]}>
            <Col xs={24}>
              <Form.Item
                name={['SESSIONS', 'title']}
                label="Session Container Title"
                rules={validationRules.requiredValidation}
              >
                <Input placeholder="Input container title (max. 30 characters)" maxLength={30} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name={['VIDEOS', 'title']}
                label="Video Container Title"
                rules={validationRules.requiredValidation}
              >
                <Input placeholder="Input container title (max. 30 characters)" maxLength={30} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name={['COURSES', 'title']}
                label="Course Container Title"
                rules={validationRules.requiredValidation}
              >
                <Input placeholder="Input container title (max. 30 characters)" maxLength={30} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Row gutter={[12, 8]}>
                <Col xs={24} md={12}>
                  <Button block size="large" type="default" onClick={cancelEditChanges}>
                    Cancel
                  </Button>
                </Col>
                <Col xs={24} md={12}>
                  <Button block size="large" type="primary" htmlType="submit">
                    Submit
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default ProductsEditView;
