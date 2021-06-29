import React, { useState, useEffect } from 'react';

import { Modal, Row, Col, Input, Button, Form, Typography, Space, Tooltip, Collapse } from 'antd';
import { EditOutlined, MinusCircleOutlined, PlusCircleOutlined, DeleteOutlined } from '@ant-design/icons';

import { resetBodyStyle } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { preventDefaults } from 'utils/helper';

import styles from './style.module.scss';

const formInitialValues = {
  title: null,
  values: [],
};

const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

const OtherLinksEditView = ({ configValues, deleteHandler, updateHandler }) => {
  const [form] = Form.useForm();

  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    if (configValues) {
      form.setFieldsValue({
        title: configValues.title,
        links:
          configValues.values?.map((linkData) => ({
            ...linkData,
            textColor: linkData.textColor?.slice(1),
            backgroundColor: linkData.backgroundColor?.slice(1),
          })) ?? [],
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
      values: values.links.map((linkData) => ({
        ...linkData,
        textColor: `#${linkData.textColor}`,
        backgroundColor: `#${linkData.backgroundColor}`,
      })),
    });
    setEditModalVisible(false);
  };

  return (
    <>
      <Row justify="center">
        <Col xs={24} className={styles.editViewButtonContainer}>
          <button className={styles.editComponentButton} onClick={handleEditComponentClicked}>
            <EditOutlined />
          </button>
        </Col>
        <Col xs={24} className={styles.editViewButtonContainer}>
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
                    <Row className={styles.ml10} gutter={[8, 12]}>
                      <Col xs={24}>
                        <Collapse>
                          {fields.map(({ key, name, fieldKey, ...restField }) => (
                            <Panel
                              key={key}
                              header={
                                <Space align="baseline">
                                  <Title level={5} className={styles.blueText}>
                                    Link Item
                                  </Title>
                                  {fields.length > 1 ? (
                                    <Tooltip title="Remove this link item">
                                      <MinusCircleOutlined className={styles.redText} onClick={() => remove(name)} />
                                    </Tooltip>
                                  ) : null}
                                </Space>
                              }
                            >
                              <Row gutter={[8, 4]}>
                                <Col xs={24} md={12}>
                                  <Form.Item
                                    className={styles.compactFormItem}
                                    {...restField}
                                    label="Link Title"
                                    fieldKey={[fieldKey, 'title']}
                                    name={[name, 'title']}
                                    rules={validationRules.requiredValidation}
                                  >
                                    <Input placeholder="Text to show (max. 30)" maxLength={30} />
                                  </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                  <Form.Item
                                    className={styles.compactFormItem}
                                    {...restField}
                                    label="Link URL"
                                    fieldKey={[fieldKey, 'url']}
                                    name={[name, 'url']}
                                    rules={validationRules.urlValidation}
                                  >
                                    <Input placeholder="Paste your URL here" type="url" />
                                  </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                  <Form.Item
                                    className={styles.compactFormItem}
                                    {...restField}
                                    label="Title Color"
                                    fieldKey={[fieldKey, 'textColor']}
                                    name={[name, 'textColor']}
                                    rules={[
                                      ...validationRules.requiredValidation,
                                      ...validationRules.hexColorValidation(),
                                    ]}
                                  >
                                    <Input placeholder="Hex color code of the title" prefix={<Text strong> # </Text>} />
                                  </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                  <Form.Item
                                    className={styles.compactFormItem}
                                    {...restField}
                                    label="Background Color"
                                    fieldKey={[fieldKey, 'backgroundColor']}
                                    name={[name, 'backgroundColor']}
                                    rules={[
                                      ...validationRules.requiredValidation,
                                      ...validationRules.hexColorValidation(),
                                    ]}
                                  >
                                    <Input
                                      placeholder="Hex color code of the background"
                                      prefix={<Text strong> # </Text>}
                                    />
                                  </Form.Item>
                                </Col>
                              </Row>
                            </Panel>
                          ))}
                        </Collapse>
                      </Col>
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
