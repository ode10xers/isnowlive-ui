import React, { useState } from 'react';
import { SketchPicker } from 'react-color';

import { Row, Col, Button, Form, Input, Collapse, Space, Typography, Tooltip } from 'antd';
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';

import validationRules from 'utils/validation';
import { preventDefaults } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Paragraph, Text, Link } = Typography;
const { Panel } = Collapse;

const colorPickerChoices = [
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#1890ff',
  '#009688',
  '#4caf50',
  '#ffc107',
  '#ff9800',
  '#ff5722',
  '#795548',
  '#607d8b',
  '#9ae2b6',
  '#bf6d11',
  '#f379b2',
  '#34727c',
  '#5030fd',
];

const OtherLinksEditForm = ({ formInstance, name, fieldKey, ...restFields }) => {
  const [expandedAccordionKeys, setExpandedAccordionKeys] = useState([]);
  const [previewColor, setPreviewColor] = useState('#1890ff');

  const handleColorChange = (color) => {
    setPreviewColor(color.hex || '#1890ff');
  };

  return (
    <>
      <Form.Item
        {...restFields}
        labelCol={{ xs: { span: 24 }, lg: { span: 4 } }}
        wrapperCol={{ xs: { span: 24 }, lg: { span: 20 } }}
        label="Title"
        name={[name, 'title']}
        fieldKey={[fieldKey, 'title']}
        rules={validationRules.requiredValidation}
      >
        <Input placeholder="Input section title (max. 30 characters)" maxLength={30} />
      </Form.Item>
      <Form.Item wrapperCol={{ xs: { span: 24 }, lg: { span: 20, offset: 4 } }}>
        <Row gutter={[8, 8]}>
          <Col xs={24}>
            <Paragraph>Here's a color picker to help you choose the colors for the link items.</Paragraph>
            <Paragraph>
              You can look for the color you want, and then copy the <Text strong>Hex</Text> value of the color and
              paste it into the input.
            </Paragraph>
            <div className={styles.colorPickerContainer}>
              <SketchPicker
                disableAlpha={true}
                color={previewColor}
                onChangeComplete={handleColorChange}
                presetColors={colorPickerChoices}
              />
            </div>
          </Col>
        </Row>
      </Form.Item>
      <Form.Item
        labelCol={{ xs: { span: 24 }, lg: { span: 4 } }}
        wrapperCol={{ xs: { span: 24 }, lg: { span: 20 } }}
        label="Your Links"
        required={true}
      >
        <Form.List
          {...restFields}
          name={[name, 'values']}
          fieldKey={[fieldKey, 'name']}
          rules={validationRules.otherLinksValidation}
        >
          {(fields, { add, remove }, { errors }) => (
            <Row className={styles.ml10} gutter={[8, 12]}>
              <Col xs={24}>
                <Collapse
                  defaultActiveKey={fields[0]?.name ?? 0}
                  activeKey={expandedAccordionKeys}
                  onChange={setExpandedAccordionKeys}
                >
                  {fields.map(({ name: otherLinksName, fieldKey: otherLinksFieldKey, ...otherLinksRestField }) => (
                    <Panel
                      key={otherLinksName}
                      header={
                        <Space align="baseline">
                          <Title level={5} className={styles.blueText}>
                            Link Item
                          </Title>
                          {fields.length > 1 ? (
                            <Tooltip title="Remove this link item">
                              <MinusCircleOutlined
                                className={styles.redText}
                                onClick={(e) => {
                                  preventDefaults(e);
                                  // NOTE : We use the name as Panel key
                                  setExpandedAccordionKeys((prevKeys) =>
                                    prevKeys.filter((val) => val !== otherLinksName)
                                  );
                                  remove(otherLinksName);
                                }}
                              />
                            </Tooltip>
                          ) : null}
                        </Space>
                      }
                    >
                      <Row gutter={[8, 4]}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            className={styles.compactFormItem}
                            {...otherLinksRestField}
                            label="Link Title"
                            fieldKey={[otherLinksFieldKey, 'title']}
                            name={[otherLinksName, 'title']}
                            rules={validationRules.requiredValidation}
                          >
                            <Input placeholder="Text to show (max. 75)" maxLength={75} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            {...otherLinksRestField}
                            label="Link URL"
                            className={styles.compactFormItem}
                            name={[otherLinksName, 'url']}
                            fieldKey={[otherLinksFieldKey, 'url']}
                            rules={validationRules.urlValidation}
                            extra={
                              <Text type="secondary">
                                The link that this item will redirect to, for example{' '}
                                <Link href="https://passion.do">https://passion.do</Link>
                              </Text>
                            }
                          >
                            <Input placeholder="Paste your URL here" type="url" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            className={styles.compactFormItem}
                            {...otherLinksRestField}
                            label="Title Color"
                            fieldKey={[otherLinksFieldKey, 'textColor']}
                            name={[otherLinksName, 'textColor']}
                            rules={[...validationRules.requiredValidation, ...validationRules.hexColorValidation()]}
                          >
                            <Input placeholder="Hex color code of the title" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            className={styles.compactFormItem}
                            {...otherLinksRestField}
                            label="Background Color"
                            fieldKey={[otherLinksFieldKey, 'backgroundColor']}
                            name={[otherLinksName, 'backgroundColor']}
                            rules={[...validationRules.requiredValidation, ...validationRules.hexColorValidation()]}
                          >
                            <Input placeholder="Hex color code of the background" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Panel>
                  ))}
                </Collapse>
              </Col>
              <Col xs={24}>
                <Button
                  block
                  type="dashed"
                  onClick={(e) => {
                    preventDefaults(e);
                    // NOTE : Since the new one will be added at the last place
                    // We ad the length of current array to the expanded keys
                    setExpandedAccordionKeys((prevKeys) => [...new Set([...prevKeys, fields.length])]);
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
    </>
  );
};

export default OtherLinksEditForm;
