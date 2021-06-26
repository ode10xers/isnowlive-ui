import React, { useState, useEffect } from 'react';

import { Modal, Row, Col, Input, Button, Form, Typography } from 'antd';
import { EditOutlined, MinusCircleOutlined, PlusCircleOutlined, DeleteOutlined } from '@ant-design/icons';

import { resetBodyStyle } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { preventDefaults } from 'utils/helper';

import styles from './style.module.scss';

const formInitialValues = {
  title: null,
  values: [],
};

const { Text, Paragraph } = Typography;

const OtherLinksEditView = ({ configValues, deleteHandler, updateHandler }) => {
  const [form] = Form.useForm();

  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    if (configValues) {
      form.setFieldsValue({
        title: configValues.title,
        links: configValues.values ?? [],
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
    updateHandler({
      title: values.title,
      values: values.links,
    });
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
              <Form.Item label="Your Links" required={true}>
                <Form.List name="links" rules={validationRules.otherLinksValidation}>
                  {(fields, { add, remove }, { errors }) => (
                    <Row>
                      {fields.map((field, index) => (
                        <Col xs={24} key={index}>
                          <Row gutter={10}>
                            <Col xs={22}>
                              <Form.Item {...field} key={field.key} rules={validationRules.requiredValidation}>
                                <Input placeholder="Paste your link here" />
                              </Form.Item>
                            </Col>
                            {fields.length > 1 ? (
                              <Col xs={2}>
                                <MinusCircleOutlined onClick={() => remove(field.name)} />
                              </Col>
                            ) : null}
                          </Row>
                        </Col>
                      ))}
                      <Col xs={24}>
                        <Button block type="dashed" onClick={() => add()} icon={<PlusCircleOutlined />}>
                          Add more links
                        </Button>
                      </Col>
                      {errors && (
                        <Col xs={24}>
                          <Text type="danger"> {errors} </Text>
                        </Col>
                      )}
                    </Row>
                  )}
                </Form.List>
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

export default OtherLinksEditView;
