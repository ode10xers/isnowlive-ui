import React from 'react';
import classNames from 'classnames';
import { Form, Input } from 'antd';

import TextEditor from 'components/TextEditor';

import validationRules from 'utils/validation';

import styles from './styles.module.scss';

const DescriptionEditForm = ({ formInstance, name, fieldKey, ...restFields }) => (
  <>
    <Form.Item
      {...restFields}
      id="title"
      name={[name, 'title']}
      fieldKey={[fieldKey, 'title']}
      label="Section Title"
      rules={validationRules.requiredValidation}
    >
      <Input placeholder="Input section title (max. 30 characters)" maxLength={30} />
    </Form.Item>
    <Form.Item
      {...restFields}
      className={classNames(styles.bgWhite, styles.textEditorLayout)}
      id="values"
      name={[name, 'values']}
      fieldKey={[fieldKey, 'values']}
      label="Content"
      rules={validationRules.requiredValidation}
    >
      <div>
        <TextEditor
          form={formInstance}
          // NOTE: This needs to be adjusted if the structure changes
          name={['profile', 'sections', name, 'values']}
          placeholder="Describe yourself here"
          triggerOnBlur={true}
        />
      </div>
    </Form.Item>
  </>
);

export default DescriptionEditForm;
