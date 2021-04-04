import React, { useState, useEffect } from 'react';

import { Row, Col, Modal, Form, Button, Typography, Input, Tooltip } from 'antd';
import { FilePdfOutlined, CloseCircleOutlined } from '@ant-design/icons';

import Loader from 'components/Loader';
import FileUpload from 'components/FileUpload';

import validationRules from 'utils/validation';

import { profileFormItemLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';
import { showErrorModal } from 'components/Modals/modals';

// TODO: Modify and adjust when edit is available
const CreateDocumentModal = ({ visible, closeModal }) => {
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);

  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setFileUrl(null);
      setIsLoading(false);
    }
  }, [visible, form]);

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  const handleFileUrlChange = (fileUrl) => {
    setFileUrl(fileUrl);
    form.validateFields(['file_url']);
  };

  const handleSubmit = (values) => {
    if (!fileUrl) {
      showErrorModal('Please upload the file before submitting!');
      return;
    }

    setIsLoading(true);

    console.log(values);

    setIsLoading(false);
  };

  return (
    <Modal
      title="Upload New Document"
      centered={true}
      visible={visible}
      footer={null}
      onCancel={() => closeModal(false)}
      width={720}
    >
      <Loader size="large" loading={isLoading}>
        <Form {...profileFormItemLayout} form={form} scrollToFirstError={true} onFinish={handleSubmit}>
          <Row gutter={[8, 16]}>
            <Col xs={24}>
              <Form.Item name="file_name" label="File Name" rules={validationRules.requiredValidation}>
                <Input placeholder="Enter filename" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="file_url"
                label="Upload File"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                required={true}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      return fileUrl ? Promise.resolve() : Promise.reject(new Error('Please upload file'));
                    },
                  }),
                ]}
              >
                <Row>
                  <Col>
                    <FileUpload name="file_url" value={fileUrl} onChange={handleFileUrlChange} listType="text" />
                  </Col>
                  {fileUrl && (
                    <Col>
                      <Button
                        type="text"
                        icon={<FilePdfOutlined />}
                        size="middle"
                        onClick={() => window.open(fileUrl)}
                        className={styles.filenameButton}
                      >
                        {fileUrl.split('_').slice(-1)[0]}
                      </Button>
                      <Tooltip title="Remove this file">
                        <Button
                          danger
                          type="text"
                          size="middle"
                          icon={<CloseCircleOutlined />}
                          onClick={() => {
                            setFileUrl(null);
                            form.validateFields(['file_url']);
                          }}
                        />
                      </Tooltip>
                    </Col>
                  )}
                </Row>
              </Form.Item>
            </Col>
          </Row>
          <Row className={styles.modalActionRow} gutter={10} justify="end">
            <Col xs={12} md={8} lg={6}>
              <Button block type="default" onClick={() => closeModal(false)} loading={isLoading}>
                Cancel
              </Button>
            </Col>
            <Col xs={12} md={8} lg={6}>
              <Button block type="primary" htmlType="submit" loading={isLoading}>
                Submit
              </Button>
            </Col>
          </Row>
        </Form>
      </Loader>
    </Modal>
  );
};

export default CreateDocumentModal;
