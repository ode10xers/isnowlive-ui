import React, { useState, useEffect } from 'react';

import { Modal, Row, Col, Input, Button, Form, Typography } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

import { resetBodyStyle } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { preventDefaults } from 'utils/helper';

import styles from './style.module.scss';

const formInitialValues = {
  title: null,
};

const { Paragraph } = Typography;

const SessionEditView = ({ configValues, deleteHandler, updateHandler }) => {
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

  const handleDeleteComponentClicked = (e) => {
    preventDefaults(e);

    Modal.confirm({
      closable: true,
      centered: true,
      mask: true,
      maskClosable: false,
      title: 'Delete this component?',
      content: <Paragraph>Are you sure you want to remove this component?</Paragraph>,
      okText: 'Yes, remove it',
      okButtonProps: {
        danger: true,
        type: 'primary',
      },
      cancelText: 'Cancel',
      onOk: () => deleteHandler(),
      afterClose: resetBodyStyle,
    });
  };

  const cancelEditChanges = (e) => {
    preventDefaults(e);
    setEditModalVisible(false);
  };

  const handleFinishEditComponent = (values) => {
    console.log(values);
    updateHandler(values);
    setEditModalVisible(false);
  };

  return (
    <>
      <Row>
        <Col xs={12} className={styles.editViewButtonContainer}>
          <button className={styles.editComponentButton} onClick={handleEditComponentClicked}>
            <EditOutlined />
          </button>
        </Col>
        <Col xs={12} className={styles.editViewButtonContainer}>
          <button className={styles.deleteComponentButton} onClick={handleDeleteComponentClicked}>
            <DeleteOutlined />
          </button>
        </Col>
      </Row>
      <Modal
        title="Edit this component"
        visible={editModalVisible}
        centered={true}
        width={380}
        footer={null}
        afterClose={resetBodyStyle}
        onCancel={cancelEditChanges}
      >
        <Form
          form={form}
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
              <Button block size="large" type="primary" htmlType="submit">
                Submit
              </Button>
            </Col>
            <Col xs={24}>
              <Button block size="large" type="default" onClick={cancelEditChanges}>
                Cancel
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default SessionEditView;
