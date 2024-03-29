import React, { useState, useEffect } from 'react';

import { Modal, Row, Col, Input, Button, Form } from 'antd';
import { EditOutlined } from '@ant-design/icons';

import { resetBodyStyle } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { preventDefaults } from 'utils/helper';

import styles from './style.module.scss';

const formInitialValues = {
  title: null,
};

const SubscriptionsEditView = ({ configValues, updateHandler, isContained }) => {
  const [form] = Form.useForm();

  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    if (configValues) {
      form.setFieldsValue({
        title: configValues.title,
      });
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
      <Row>
        <Col xs={24} className={styles.editViewButtonContainer}>
          {isContained ? (
            <button className={styles.editComponentButton} onClick={handleEditComponentClicked}>
              <EditOutlined />
            </button>
          ) : (
            <Button ghost type="primary" onClick={handleEditComponentClicked} icon={<EditOutlined />} />
          )}
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
        <Form
          form={form}
          layout="vertical"
          scrollToFirstError={true}
          initialValues={formInitialValues}
          onFinish={handleFinishEditComponent}
        >
          <Row gutter={[8, 16]}>
            <Col xs={24}>
              <Form.Item id="title" name="title" label="Container Title" rules={validationRules.requiredValidation}>
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

export default SubscriptionsEditView;
