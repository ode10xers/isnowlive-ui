import React from 'react';

import { Form, Input } from 'antd';

import validationRules from 'utils/validation';

const SimpleEditForm = ({ formInstance, name, fieldKey, ...restFields }) => (
  <Form.Item
    {...restFields}
    label="Section Title"
    name={[name, 'title']}
    fieldKey={[fieldKey, 'title']}
    rules={validationRules.requiredValidation}
  >
    <Input placeholder="Input section title (max. 30 characters)" maxLength={30} />
  </Form.Item>
);

export default SimpleEditForm;
