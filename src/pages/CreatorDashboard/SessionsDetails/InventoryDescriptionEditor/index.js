import React from 'react';
import classNames from 'classnames';

import { Form, Button, Space } from 'antd';

import TextEditor from 'components/TextEditor';

import validationRules from 'utils/validation';

import styles from './styles.module.scss';

const InventoryDescriptionEditor = ({ description = null, onFinish = () => {}, onCancel = () => {} }) => {
  const [form] = Form.useForm();

  const handleDescFormFinish = (values) => {
    onFinish(values.description);
  };

  return (
    <div>
      <Form form={form} onFinish={handleDescFormFinish} initialValues={{ description: description }}>
        <Form.Item
          className={classNames(styles.bgWhite, styles.textEditorLayout)}
          name="description"
          rules={validationRules.requiredValidation}
        >
          <div>
            <TextEditor name="description" form={form} placeholder="Input your description here" />
          </div>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button ghost danger type="primary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Save Changes
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default InventoryDescriptionEditor;
