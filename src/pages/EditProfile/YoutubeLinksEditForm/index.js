import React from 'react';

import { Row, Col, Button, Form, Input, Typography, Tooltip } from 'antd';
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';

import validationRules from 'utils/validation';
import { preventDefaults } from 'utils/helper';

import styles from './styles.module.scss';

const { Paragraph, Text } = Typography;

const YoutubeLinksEditForm = ({ formInstance, name, fieldKey, ...restFields }) => (
  <>
    <Form.Item
      id="title"
      {...restFields}
      name={[name, 'title']}
      fieldKey={[fieldKey, 'title']}
      label="Title"
      labelCol={{ xs: { span: 24 }, lg: { span: 4 } }}
      wrapperCol={{ xs: { span: 24 }, lg: { span: 20 } }}
      rules={validationRules.requiredValidation}
    >
      <Input placeholder="Input container title (max. 30 characters)" maxLength={30} />
    </Form.Item>
    <Form.Item
      labelCol={{ xs: { span: 24 }, lg: { span: 4 } }}
      wrapperCol={{ xs: { span: 24 }, lg: { span: 20 } }}
      label="Video Links"
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
              <Paragraph>Accepts YouTube Links with this format:</Paragraph>
              <Paragraph>
                <Text strong>https://youtu.be/[video-id]</Text> or{' '}
                <Text strong>https://www.youtube.com/watch?v=[video-id]</Text>
              </Paragraph>
            </Col>
            <Col xs={24}>
              {fields.map(({ name: youtubeLinksName, fieldKey: youtubeLinksFieldKey, ...youtubeLinksRestFields }) => (
                <Row gutter={[8, 12]} align="middle" key={`youtube-fields-${youtubeLinksFieldKey}`}>
                  <Col flex="1 1 auto">
                    <Form.Item
                      {...youtubeLinksRestFields}
                      className={styles.compactFormItem}
                      fieldKey={youtubeLinksFieldKey}
                      name={youtubeLinksName}
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
                          remove(youtubeLinksName);
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
  </>
);

export default YoutubeLinksEditForm;
