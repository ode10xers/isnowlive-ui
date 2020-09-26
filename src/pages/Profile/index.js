import React, { useState } from 'react';
import classNames from 'classnames';
import { Form, Typography, Button, Space, Row, Col, Input, Card, Upload, message } from 'antd';
import { LoadingOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import DefaultLayout from '../../layouts/DefaultLayout';
import parse from 'html-react-parser';
import { Section } from '../../components';
import ImgCrop from 'antd-img-crop';
import styles from './style.module.scss';

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

// const initialValue = {
//   coverImage: '',
//   profileImage: '',
//   name: '',
//   shortBio: '',
//   publicUrl: '',
//   websitee: '',
//   facebook: '',
//   twitter: '',
//   instagram: '',
//   testimonials: '',
// };

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [isPublicUrlAvaiable, setIsPublicUrlAvaiable] = useState(true);
  const [testimonials, setTestimonials] = useState([]);

  const [form] = Form.useForm();
  const onFinish = (values) => {
    console.log('Success:', values);
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };
  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );
  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must smaller than 2MB!');
    }
    return isJpgOrPng && isLt2M;
  };
  const onCoverImageUpload = ({ fileList: newFileList }) => {
    setCoverImage(newFileList[0]);
  };
  const onProfileImageUpload = ({ fileList: newFileList }) => {
    setProfileImage(newFileList[0]);
  };

  const handlePublicUrlChange = (e) => {
    if (e.target.value === 'abc') {
      setIsPublicUrlAvaiable(false);
    } else {
      setIsPublicUrlAvaiable(true);
    }
  };
  return (
    <DefaultLayout>
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
            <ImgCrop shape="rect" aspect={2}>
              <Upload.Dragger
                className={styles.coverImage}
                name="coverImage"
                multiple={false}
                action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                onChange={onCoverImageUpload}
                showUploadList={false}
              >
                {coverImage ? (
                  <img src={coverImage} alt="avatar" style={{ width: '100%' }} />
                ) : (
                  <div>
                    {loading ? <LoadingOutlined /> : <PlusOutlined />}
                    <div style={{ marginTop: 8 }}>Cover Photo</div>
                  </div>
                )}
              </Upload.Dragger>
            </ImgCrop>
            <ImgCrop rotate>
              <Upload
                name="profileImage"
                listType="picture-card"
                className={classNames('avatar-uploader', styles.profileImage)}
                showUploadList={false}
                action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                beforeUpload={beforeUpload}
                onChange={onProfileImageUpload}
              >
                {profileImage ? (
                  <img src={profileImage} alt="avatar" style={{ width: '100%' }} />
                ) : (
                  <div>
                    {loading ? <LoadingOutlined /> : <PlusOutlined />}
                    <div style={{ marginTop: 8 }}>Your Photo</div>
                  </div>
                )}
              </Upload>
            </ImgCrop>
          </div>

          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please input your name' }]}>
            <Input placeholder="Your Display Name" />
          </Form.Item>

          <Form.Item label="Short bio" name="shortBio">
            <Input.TextArea rows={4} placeholder="Please input your short bio" />
          </Form.Item>

          <Form.Item
            label="Public URL"
            name="publicUrl"
            rules={[{ required: true, message: 'Please input public URL' }]}
            onChange={handlePublicUrlChange}
          >
            <Row align="middle">
              <Col>
                <Input placeholder="avishayyoga" />
              </Col>
              <Col className={styles.ml10}>
                <Text>.is-now.live</Text>
              </Col>
              <Col className={styles.ml10}>
                {isPublicUrlAvaiable ? (
                  <Text type="success">
                    <span className={styles.dot} style={{ backgroundColor: '#52C41A' }}></span> Available
                  </Text>
                ) : (
                  <Text type="danger">
                    <span className={styles.dot} style={{ backgroundColor: '#bb2124' }}></span> Unavailable
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
    </DefaultLayout>
  );
};

export default Profile;
