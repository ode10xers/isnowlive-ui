import React from 'react';

import { Row, Col, Button, Form, Input, Tooltip } from 'antd';
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';

import validationRules from 'utils/validation';
import { preventDefaults } from 'utils/helper';

import styles from './styles.module.scss';

const TextListEditForm = ({ formInstance, name, fieldKey, ...restFields }) => (
  <>
    <Form.Item
      id="title"
      {...restFields}
      fieldKey={[fieldKey, 'title']}
      name={[name, 'title']}
      labelCol={{ xs: { span: 24 }, lg: { span: 4 } }}
      wrapperCol={{ xs: { span: 24 }, lg: { span: 20 } }}
      label="Section Title"
      rules={validationRules.requiredValidation}
    >
      <Input placeholder="Input section title (max. 30 characters)" maxLength={30} />
    </Form.Item>
    <Form.Item
      labelCol={{ xs: { span: 24 }, lg: { span: 4 } }}
      wrapperCol={{ xs: { span: 24 }, lg: { span: 20 } }}
      label="List Items"
      required={true}
    >
      <Form.List
        {...restFields}
        fieldKey={[fieldKey, 'values']}
        name={[name, 'values']}
        rules={validationRules.dynamicArrayItemValidation}
      >
        {(fields, { add, remove }, { errors }) => (
          <Row gutter={[8, 12]}>
            <Col xs={24}>
              {fields.map(({ name: textListName, fieldKey: textListFieldKey, ...textListRestFields }) => (
                <Row gutter={[8, 12]} align="middle" key={`text-list-fields-${textListFieldKey}`}>
                  <Col flex="1 1 auto">
                    <Form.Item
                      {...textListRestFields}
                      fieldKey={textListFieldKey}
                      name={textListName}
                      rules={validationRules.requiredValidation}
                    >
                      <Input.TextArea
                        placeholder="Place any text here (max 200 chars)"
                        maxLength={200}
                        showCount={true}
                        autoSize={true}
                      />
                    </Form.Item>
                  </Col>
                  <Col flex="0 0 40px">
                    <Tooltip title="Remove this item">
                      <MinusCircleOutlined
                        className={styles.redText}
                        onClick={(e) => {
                          preventDefaults(e);
                          remove(textListName);
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
                Add more items
              </Button>
            </Col>
            <Col xs={24}>
              <Form.ErrorList errors={errors} />
            </Col>
          </Row>
        )}
      </Form.List>
    </Form.Item>
  </>
);

export default TextListEditForm;
