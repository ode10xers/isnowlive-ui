import React, { useState, useEffect } from 'react';

import { Modal, Row, Col, Input, Button, Form, Typography, Tooltip } from 'antd';
import { EditOutlined, MinusCircleOutlined, PlusCircleOutlined, DeleteOutlined } from '@ant-design/icons';

import { resetBodyStyle } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { preventDefaults } from 'utils/helper';

import styles from './style.module.scss';

const { Paragraph, Text } = Typography;

const formInitialValues = {
  title: null,
  values: [],
};

const YoutubeEmbedEditView = ({ configValues, deleteHandler, updateHandler, isContained }) => {
  const [form] = Form.useForm();

  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    if (configValues) {
      form.setFieldsValue({
        title: configValues.title,
        values: configValues.values ?? [],
      });
    } else {
      form.resetFields();
    }
  }, [configValues, form, editModalVisible]);

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
              <Form.Item label="Youtube Video Links" required={true}>
                {/* NOTE : The rule here is quite complex and tied to the children Form.Item names, so if the names changes here, also change it in the rules */}
                <Form.List name="values" rules={validationRules.dynamicArrayItemValidation}>
                  {(fields, { add, remove }, { errors }) => (
                    <Row gutter={[8, 12]}>
                      <Col xs={24}>
                        <Paragraph>Accepts YouTube Links with this format:</Paragraph>
                        <Paragraph>
                          <Text strong>https://youtu.be/[video-id]</Text> or{' '}
                          <Text strong>https://www.youtube.com/watch?v=[video-id]</Text>
                        </Paragraph>
                      </Col>
                      <Col xs={24}>
                        {fields.map(({ name, fieldKey, ...restField }) => (
                          <Row gutter={[8, 12]} align="middle">
                            <Col flex="1 1 auto">
                              <Form.Item
                                className={styles.compactFormItem}
                                {...restField}
                                fieldKey={fieldKey}
                                name={name}
                                rules={validationRules.youtubeLinkValidation}
                              >
                                <Input placeholder="Put YouTube video link here" maxLength={100} />
                              </Form.Item>
                            </Col>
                            <Col flex="0 0 40px">
                              <Tooltip title="Remove this item">
                                <MinusCircleOutlined
                                  className={styles.redText}
                                  onClick={(e) => {
                                    preventDefaults(e);
                                    remove(name);
                                  }}
                                />
                              </Tooltip>
                            </Col>
                          </Row>
                        ))}
                      </Col>
                      <Col xs={24}>
                        <Button
                          block
                          type="dashed"
                          onClick={(e) => {
                            preventDefaults(e);
                            add();
                          }}
                          icon={<PlusCircleOutlined />}
                        >
                          Add more links
                        </Button>
                      </Col>
                      <Col xs={24}>
                        <Form.ErrorList errors={errors} />
                      </Col>
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

export default YoutubeEmbedEditView;
