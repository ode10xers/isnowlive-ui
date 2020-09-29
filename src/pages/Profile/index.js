import React, { useState } from 'react';
import classNames from 'classnames';
import { Form, Typography, Button, Space, Row, Col, Input, Card } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import parse from 'html-react-parser';
import Section from '../../components/Section';
import ImageUpload from '../../components/ImageUpload';
import styles from './style.module.scss';
import validationRules from '../../utils/validation';

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 5 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 12 },
  },
};
const tailLayout = {
  wrapperCol: { offset: 5, span: 19 },
};
const { Title, Text } = Typography;

const Profile = () => {
  const [coverImage, setCoverImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [isPublicUrlAvaiable, setIsPublicUrlAvaiable] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [form] = Form.useForm();

  const onFinish = (values) => {
    console.log('Success:', values);
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  const onCoverImageUpload = ({ fileList: newFileList }) => {
    setCoverImage(newFileList[0]);
  };

  const onProfileImageUpload = ({ fileList: newFileList }) => {
    setProfileImage(newFileList[0]);
  };

  const handlePublicUrlChange = (e) => {
    if (e.target.value) {
      setIsPublicUrlAvaiable(true);
    } else {
      setIsPublicUrlAvaiable(false);
    }
  };

  return (
    <>
      <Space size="middle">
        <Typography>
          <Title>Setup your profile</Title>
        </Typography>
      </Space>

      <Form form={form} {...formItemLayout} onFinish={onFinish} onFinishFailed={onFinishFailed}>
        {/* ========PRIMARY INFO======== */}
        <Section>
          <Title level={4}>1. Primary Information</Title>
          <Text className={styles.ml20} type="secondary">
            some text here - to be decieded later
          </Text>

          <div className={styles.imageWrapper}>
            <ImageUpload
              aspect={2}
              className={classNames('avatar-uploader', styles.coverImage)}
              name="coverImage"
              action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
              onChange={onCoverImageUpload}
              value={coverImage}
              label="Cover Photo"
            />

            <ImageUpload
              name="profileImage"
              className={classNames('avatar-uploader', styles.profileImage)}
              action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
              onChange={onProfileImageUpload}
              value={profileImage}
              label="Profile Photo"
            />
          </div>

          <Form.Item label="Name" name="name" rules={validationRules.nameValidation}>
            <Input placeholder="Your Display Name" />
          </Form.Item>

          <Form.Item label="Short bio" name="shortBio">
            <Input.TextArea rows={4} placeholder="Please input your short bio" />
          </Form.Item>

          <Form.Item
            label="Public URL"
            name="publicUrl"
            rules={validationRules.publicUrlValidation}
            onChange={handlePublicUrlChange}
          >
            <Row align="middle">
              <Col>
                <Input placeholder="username" />
              </Col>
              <Col className={styles.ml10}>
                <Text>.is-now.live</Text>
              </Col>
              <Col className={styles.ml10}>
                {isPublicUrlAvaiable ? (
                  <Text type="success">
                    <span className={classNames(styles.dot, styles.success)}></span> Available
                  </Text>
                ) : (
                  <Text type="danger">
                    <span className={classNames(styles.dot, styles.danger)}></span> Unavailable
                  </Text>
                )}
              </Col>
            </Row>
          </Form.Item>
        </Section>

        {/* =========ONLINE PRESENCE==== */}
        <Section>
          <Title level={4}>2. Online Presence</Title>
          <Text className={styles.ml20} type="secondary">
            Let people know where else to follow you on social media
          </Text>

          <Form.Item label="Website" name="websitee">
            <Input placeholder="Your website link" />
          </Form.Item>

          <Form.Item label="Facebook" name="facebook">
            <Input placeholder="Facebook profile link" />
          </Form.Item>

          <Form.Item label="Twitter" name="twitter">
            <Input placeholder="Twitter profile link" />
          </Form.Item>

          <Form.Item label="Instagram" name="instagram">
            <Input placeholder="Instagram profile link" />
          </Form.Item>
        </Section>

        {/* ========TESTIMONIALS======== */}
        <Section>
          <Title level={4}>3. Testimonials</Title>
          <Text className={styles.ml20} type="secondary">
            Embed social media posts to add social proof on your public page
          </Text>

          <Form.Item label="Embed code" name="testimonials">
            <Input.TextArea rows={4} placeholder="Please input your short bio" />
          </Form.Item>
          <Form.Item {...tailLayout}>
            <Row>
              <Col xs={24}>
                <Button
                  className={styles.mb10}
                  onClick={() => {
                    setTestimonials([...testimonials, form.getFieldValue().testimonials]);
                    form.setFieldsValue({ testimonials: '' });
                  }}
                >
                  <PlusOutlined /> Add
                </Button>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item {...tailLayout}>
            <Row>
              {testimonials?.map((item, index) => (
                <Col xs={24} md={24} key={index}>
                  {item && item.length ? (
                    <Card
                      title="Preview"
                      bordered={false}
                      extra={
                        <DeleteOutlined onClick={() => setTestimonials(testimonials.filter((_, i) => i !== index))} />
                      }
                      className={styles.m10}
                    >
                      {parse(item)}
                    </Card>
                  ) : null}
                </Col>
              ))}
            </Row>
          </Form.Item>
        </Section>

        {/* ====PREVIEW AND PUBLISH====== */}
        <Section>
          <Row justify="center">
            <Col xs={12} sm={{ span: 6 }}>
              <Form.Item>
                <Button htmlType="submit" className={styles.button}>
                  Live Preview
                </Button>
              </Form.Item>
            </Col>
            <Col xs={12} sm={{ span: 6 }}>
              <Form.Item>
                <Button type="primary">Publish Page</Button>
              </Form.Item>
            </Col>
          </Row>
        </Section>
      </Form>
    </>
  );
};

export default Profile;
