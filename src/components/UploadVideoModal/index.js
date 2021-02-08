import React, { useState, useEffect, useCallback, useRef } from 'react';
import classNames from 'classnames';
import { Row, Col, Modal, Form, Typography, Radio, Input, InputNumber, Select, Button, Progress } from 'antd';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { DragDrop } from '@uppy/react';

import { getAuthCookie } from './authCookie';

import config from 'config';
import apis from 'apis';
import Loader from 'components/Loader';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';
import TextEditor from 'components/TextEditor';
import ImageUpload from 'components/ImageUpload';
import { formLayout, formTailLayout } from 'layouts/FormLayouts';
import validationRules from 'utils/validation';
import { isMobileDevice } from 'utils/device';
import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';
const { Text } = Typography;

const videoTypes = {
  FREE: {
    name: 'FREE',
    label: 'FREE',
  },
  PAID: {
    name: 'PAID',
    label: 'PAID',
  },
};

const formInitialValues = {
  title: '',
  description: '',
  classList: [],
  videoType: videoTypes.FREE.name,
  price: 0,
  watch_count: 0,
};

const UploadVideoModal = ({ formPart, setFormPart, visible, closeModal, editedVideo = null, updateEditedVideo }) => {
  const [form] = Form.useForm();

  const [classes, setClasses] = useState([]);
  const [currency, setCurrency] = useState('SGD');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  const [videoType, setVideoType] = useState(videoTypes.FREE.name);
  const [coverImageUrl, setCoverImageUrl] = useState(null);
  const [videoUploadPercent, setVideoUploadPercent] = useState(0);
  const [uploadingFlie, setuploadingFlie] = useState(null);
  const uppy = useRef(null);
  uppy.current = new Uppy({
    meta: { type: 'avatar' },
    restrictions: { maxNumberOfFiles: 1 },
    autoProceed: true,
  });

  //TODO: Adjust Uppy endpoint to send ORIGIN and AUTH TOKEN
  uppy.current.use(Tus, {
    endpoint: `${config.server.baseURL}/secure/creator/videos/${editedVideo?.external_id}/upload`,
    headers: {
      'auth-token': getAuthCookie(),
    },
    resume: true,
    retryDelays: null,
  });

  uppy.current.on('file-added', (file) => {
    setuploadingFlie(file);
    setIsLoading(true);
  });

  uppy.current.on('progress', (result) => {
    setIsLoading(false);
    setVideoUploadPercent(result);
  });

  uppy.current.on('complete', (result) => {
    if (result.successful.length) {
      showSuccessModal('Video Published');
    } else {
      showErrorModal(`Failed to upload video`);
    }
    setTimeout(() => {
      uppy.current = null;
      closeModal(true);
    }, 500);
  });
  const fetchAllClassesForCreator = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data } = await apis.session.getSession();

      if (data) {
        setClasses(data.map((session) => ({ value: session.session_id, label: session.name })));
        setCurrency(data[0].currency || 'SGD');
      }
    } catch (error) {
      showErrorModal('Failed to fetch classes', error?.response?.data?.message || 'Something went wrong');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (visible) {
      if (editedVideo) {
        form.setFieldsValue({
          ...editedVideo,
          session_ids: editedVideo.sessions.map((session) => session.session_id),
          videoType: editedVideo.price === 0 ? videoTypes.FREE.name : videoTypes.PAID.name,
        });
        setCurrency(editedVideo.currency || 'SGD');
        setVideoType(editedVideo.price === 0 ? videoTypes.FREE.name : videoTypes.PAID.name);
        setSelectedSessionIds(editedVideo.sessions.map((session) => session.session_id));
        setCoverImageUrl(editedVideo.thumbnail_url);
      } else {
        form.resetFields();
      }

      fetchAllClassesForCreator();
    }
    return () => {
      setCoverImageUrl(null);
      setSelectedSessionIds([]);
      uppy.current = null;
    };
  }, [visible, editedVideo, fetchAllClassesForCreator, form]);

  const handleChangeLimitType = (priceType) => {
    const values = form.getFieldsValue();
    form.setFieldsValue({
      ...values,
      price: priceType === videoTypes.FREE.name ? 0 : values.price || 10,
    });
    setVideoType(priceType);
  };

  const handleFinish = async (values) => {
    setIsSubmitting(true);

    try {
      let data = {
        currency: currency,
        title: values.title,
        description: values.description,
        price: videoType === videoTypes.FREE.name ? 0 : values.price,
        validity: values.validity,
        session_ids: selectedSessionIds || values.session_ids || [],
        thumbnail_url: coverImageUrl,
        watch_count: values.watch_count,
      };

      const response = editedVideo
        ? await apis.videos.updateVideo(editedVideo.external_id, data)
        : await apis.videos.createVideo(data);

      if (isAPISuccess(response.status)) {
        if (response.data) {
          updateEditedVideo(response.data);

          if (response.data.video_uid.length) {
            closeModal(true);
          } else {
            setFormPart(2);
          }
        } else {
          if (editedVideo.video_uid.length) {
            showSuccessModal('Video details updated successfuly');
            closeModal(true);
          } else {
            setFormPart(2);
          }
        }
      }
    } catch (error) {
      console.log(error);
      showErrorModal(`Failed to ${editedVideo ? 'update' : 'create'} video`);
    }

    setIsSubmitting(false);
  };

  const onCoverImageUpload = (imageUrl) => {
    setCoverImageUrl(imageUrl);
    form.setFieldsValue({ ...form.getFieldsValue(), thumbnail_url: imageUrl });
  };

  return (
    <Modal
      title={`${editedVideo ? 'Edit' : 'Upload New'} Video`}
      centered={true}
      visible={visible}
      footer={null}
      maskClosable={false}
      onCancel={() => closeModal(false)}
      width={720}
    >
      <Loader size="large" loading={isLoading}>
        {formPart === 1 && (
          <Form
            {...formLayout}
            name="classVideoForm"
            form={form}
            onFinish={handleFinish}
            initialValues={formInitialValues}
          >
            <Row gutter={[8, 16]}>
              <Col xs={24}>
                <Form.Item id="thumbnail_url" name="thumbnail_url" wrapperCol={{ span: 24 }}>
                  <div className={styles.imageWrapper}>
                    <ImageUpload
                      aspect={4}
                      className={classNames('avatar-uploader', styles.coverImage)}
                      name="thumbnail_url"
                      action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                      onChange={onCoverImageUpload}
                      value={coverImageUrl}
                      label="Cover Image"
                    />
                  </div>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item id="title" name="title" label="Title" rules={validationRules.requiredValidation}>
                  <Input placeholder="Enter title" maxLength={50} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  className={classNames(styles.bgWhite, styles.textEditorLayout)}
                  name="description"
                  label="Description"
                  rules={validationRules.requiredValidation}
                >
                  <TextEditor name="description" form={form} placeholder="Enter description" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item id="session_ids" name="session_ids" label="Related to Class(es)">
                  <Select
                    showArrow
                    showSearch={false}
                    placeholder="Select your Class(es)"
                    mode="multiple"
                    maxTagCount={2}
                    options={classes}
                    value={selectedSessionIds}
                    onChange={(val) => setSelectedSessionIds(val)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  id="videoType"
                  name="videoType"
                  label="Video Type"
                  rules={validationRules.requiredValidation}
                >
                  <Radio.Group
                    className="video-type-radio"
                    onChange={(e) => handleChangeLimitType(e.target.value)}
                    value={videoType}
                    options={Object.values(videoTypes).map((pType) => ({
                      label: pType.label,
                      value: pType.name,
                    }))}
                  />
                </Form.Item>
              </Col>

              {videoType !== videoTypes.FREE.name && (
                <Col xs={24}>
                  <Form.Item
                    id="price"
                    name="price"
                    label={`Price (${currency})`}
                    rules={validationRules.numberValidation('Please Input Video Price', 0, false)}
                  >
                    <InputNumber min={0} placeholder="Price" className={styles.numericInput} />
                  </Form.Item>
                </Col>
              )}

              <Col xs={24}>
                <Form.Item
                  id="validity"
                  name="validity"
                  label="Validity (hours)"
                  extra={
                    <Text className={styles.helpText}>The duration in hours this will be usable after purchase</Text>
                  }
                  rules={validationRules.numberValidation('Please Input Validity', 1, false)}
                >
                  <InputNumber min={1} placeholder="Validity" className={styles.numericInput} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  id="watch_count"
                  name="watch_count"
                  label="Watch Count"
                  extra={<Text className={styles.helpText}>Max number of time buyer can watch video</Text>}
                >
                  <InputNumber min={1} placeholder="Watch Count" className={styles.numericInput} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item {...(!isMobileDevice && formTailLayout)}>
              <Row>
                <Col xs={12}>
                  <Button block type="default" onClick={() => closeModal(false)}>
                    Cancel
                  </Button>
                </Col>
                <Col xs={12}>
                  <Button className={styles.ml10} block type="primary" htmlType="submit" loading={isSubmitting}>
                    Continue
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          </Form>
        )}
        {formPart === 2 && (
          <div className={styles.videoUpload}>
            <div className={styles.uppyDragDrop} style={{ pointerEvents: uploadingFlie ? 'none' : 'auto' }}>
              <DragDrop
                uppy={uppy.current}
                locale={{
                  strings: {
                    dropHereOr: 'Drop your video here or %{browse}',
                    browse: 'browse',
                  },
                }}
              />
              {videoUploadPercent !== 0 && (
                <>
                  <Text>{uploadingFlie.name}</Text>
                  <Progress percent={videoUploadPercent} status="active" />
                </>
              )}
            </div>
            <Row justify="center" className={styles.mt20}>
              <Col xs={12}>
                <Button block type="default" onClick={() => closeModal(true)} disabled={uploadingFlie ? true : false}>
                  Cancel
                </Button>
              </Col>
            </Row>
          </div>
        )}
      </Loader>
    </Modal>
  );
};

export default UploadVideoModal;
