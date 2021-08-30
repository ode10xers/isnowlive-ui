import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { Modal, Row, Col, Input, Button, Form, Typography } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

import { resetBodyStyle } from 'components/Modals/modals';
import TextEditor from 'components/TextEditor';

import validationRules from 'utils/validation';
import { preventDefaults } from 'utils/helper';

import styles from './style.module.scss';

const { Paragraph } = Typography;

const formInitialValues = {
  title: null,
  values: null,
};

const DescriptionEditView = ({ configValues, deleteHandler, updateHandler, isContained }) => {
  const [form] = Form.useForm();

  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    if (configValues) {
      form.setFieldsValue({
        title: configValues.title,
        values: configValues.values ?? '',
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
    updateHandler(values);
    setEditModalVisible(false);
  };

  return (
    <>
      <Row justify="center">
        <Col xs={isContained ? 24 : 12} className={styles.editViewButtonContainer}>
          {isContained ? (
            <button className={styles.editComponentButton} onClick={handleEditComponentClicked}>
              <EditOutlined />
            </button>
          ) : (
            <Button ghost type="primary" onClick={handleEditComponentClicked} icon={<EditOutlined />} />
          )}
        </Col>
        <Col xs={isContained ? 24 : 12} className={styles.editViewButtonContainer}>
          {isContained ? (
            <button className={styles.deleteComponentButton} onClick={handleDeleteComponentClicked}>
              <DeleteOutlined />
            </button>
          ) : (
            <Button danger ghost type="primary" onClick={handleDeleteComponentClicked} icon={<DeleteOutlined />} />
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
              <Form.Item
                className={classNames(styles.bgWhite, styles.textEditorLayout)}
                id="values"
                name="values"
                label="Content"
                rules={validationRules.requiredValidation}
              >
                <div>
                  <TextEditor form={form} name="values" placeholder="Describe yourself here" />
                </div>
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
                    Publish
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

export default DescriptionEditView;
