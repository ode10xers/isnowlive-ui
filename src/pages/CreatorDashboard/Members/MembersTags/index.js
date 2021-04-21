import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Typography, Popconfirm, List, Form, Input } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

import apis from 'apis';

import { showSuccessModal, showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import validationRules from 'utils/validation';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const MembersTags = ({ fetchUserSettings, userTags = [] }) => {
  const [form] = Form.useForm();

  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editing) {
      form.setFieldsValue({ newEntries: [] });
    }
  }, [editing, userTags, form]);

  const saveCreatorUserTags = async (values) => {
    setSubmitting(true);

    console.log(values);

    try {
      const payload = {
        tags: [...values.newEntries],
      };

      const { status } = await apis.user.upsertCreatorUserTags(payload);

      if (isAPISuccess(status)) {
        showSuccessModal('Member tags updated successfully');
        fetchUserSettings();
      }
    } catch (error) {
      showErrorModal('Failed updating member tags ', error.response?.data?.message || 'Something went wrong');
    }

    setSubmitting(false);
  };

  return (
    <div className={styles.memberTagsWrapper}>
      {editing ? (
        <Form form={form} scrollToFirstError={true} onFinish={saveCreatorUserTags}>
          <Row gutter={[8, 8]}>
            <Col xs={24} lg={14}>
              <Title level={4}>Members Tags</Title>
            </Col>
            <Col xs={12} lg={5}>
              <Popconfirm
                title="Are you sure? All changes you made that are not saved will be lost."
                onOk={() => setEditing(false)}
                okText="Yes"
              >
                <Button block type="default" loading={submitting}>
                  Cancel
                </Button>
              </Popconfirm>
            </Col>
            <Col xs={12} lg={5}>
              <Button block type="primary" loading={submitting} htmlType="submit">
                Save Changes
              </Button>
            </Col>
          </Row>
          <Row>
            {/* {userTags.length > 0 && (
              <Form.List name="existingEntries">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field) => (
                      <Col xs={24} key={fields.key}>
                        <Form.Item {...field} name={[field.name, 'name']} label="Tag Name" rules={validationRules.requiredValidation}>
                          <Input placeholder="Change the user tag here" />
                        </Form.Item>
                        <Form.Item hidden {...field} name={[field.name, 'external_id']} rules={validationRules.requiredValidation}>
                          <Input />
                        </Form.Item>
                      </Col>
                    ))}
                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        icon={<PlusOutlined />}
                      >
                        Add new tag
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            )} */}
            <Form.List name="newEntries">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <Col xs={24} key={fields.key}>
                      <Row gutter={[8, 8]}>
                        <Col xs={14} key={fields.key}>
                          <Form.Item
                            {...field}
                            name={[field.name, 'name']}
                            label="New Tag Name"
                            rules={validationRules.requiredValidation}
                          >
                            <Input placeholder="Type the new user tag here" />
                          </Form.Item>
                        </Col>
                        {fields.length > 1 ? (
                          <Col xs={4}>
                            <MinusCircleOutlined className={styles.deleteButton} onClick={() => remove(field.name)} />
                          </Col>
                        ) : null}
                      </Row>
                    </Col>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                      Add new tag
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Row>
        </Form>
      ) : (
        <Row gutter={[8, 8]}>
          <Col xs={24} lg={19}>
            <Title level={4}>Members Tags</Title>
          </Col>
          <Col xs={24} lg={5}>
            <Button block ghost type="primary" onClick={() => setEditing(true)}>
              Edit Tags
            </Button>
          </Col>
          <Col xs={24}>
            <List
              itemLayout="vertical"
              dataSource={userTags}
              locale={{ emptyText: 'No user tags found' }}
              rowKey={(record) => record.external_id}
              renderItem={(item) => (
                <List.Item>
                  <Text> {item.name} </Text>
                </List.Item>
              )}
            />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default MembersTags;
