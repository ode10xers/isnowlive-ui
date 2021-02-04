import React, { useState, useEffect, useCallback, useRef } from 'react';
import classNames from 'classnames';
import { Row, Col, Modal, Form, Typography, Radio, Input, InputNumber, Select, Button, Upload } from 'antd';
import { UploadOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
// import * as tus from 'tus-js-client';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { DragDrop } from '@uppy/react';

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
import { getAuthCookie } from 'services/authCookie';

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
  const [fileLists, setFileLists] = useState([]);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const upload = useRef(null);

  let uppy = new Uppy({
    meta: { type: 'avatar' },
    restrictions: { maxNumberOfFiles: 1 },
    autoProceed: true,
  });

  uppy.use(Tus, {
    endpoint: `${config.server.baseURL}/secure/creator/videos/${editedVideo?.external_id}/upload`,
    headers: {
      'auth-token': getAuthCookie() || '',
      'Access-Control-Allow-Origin': 'https://app.stage.passion.do',
    },
  });

  uppy.on('complete', (result) => {
    console.log('===result', result);
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
      upload.current = null;
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
      };

      const response = editedVideo
        ? await apis.videos.updateVideo(editedVideo.external_id, data)
        : await apis.videos.createVideo(data);

      if (isAPISuccess(response.status)) {
        if (response.data) {
          updateEditedVideo(response.data);
        }
        setFormPart(2);
      }
    } catch (error) {
      showErrorModal(`Failed to ${editedVideo ? 'update' : 'create'} video`);
    }

    setIsSubmitting(false);
  };

  const onCoverImageUpload = (imageUrl) => {
    setCoverImageUrl(imageUrl);
    form.setFieldsValue({ ...form.getFieldsValue(), thumbnail_url: imageUrl });
  };

  // const uploadVideoProps = {
  //   customRequest: async (fileDetails) => {
  //     try {
  //       const response = await apis.videos.uploadVideo(editedVideo.external_id, {
  //         size: fileDetails.file.size,
  //       });
  //       if (isAPISuccess(response.status)) {
  //         setFileLists([
  //           {
  //             name: fileDetails.file.name,
  //             status: 'uploading',
  //             thumbUrl: coverImageUrl,
  //           },
  //         ]);

  //       upload.current = new tus.Upload(fileDetails.file, {
  //         endpoint: response.data.url,
  //         headers: {
  //           'Access-Control-Allow-Origin': 'https://app.stage.passion.do',
  //         },
  //         resume: true,
  //         metadata: {
  //           filename: fileDetails.file.name,
  //           filetype: fileDetails.file.type,
  //         },
  //         onProgress: (bytesUploaded, bytesTotal) => {
  //           var percent = parseInt((bytesUploaded / bytesTotal) * 100);
  //           setFileLists([
  //             {
  //               name: fileDetails.file.name,
  //               status: 'uploading',
  //               thumbUrl: coverImageUrl,
  //               percent,
  //             },
  //           ]);
  //         },
  //         onSuccess: () => {
  //           setFileLists([
  //             {
  //               name: fileDetails.file.name,
  //               thumbUrl: coverImageUrl,
  //               status: 'success',
  //             },
  //           ]);
  //           showSuccessModal('Video Published');
  //           setTimeout(() => {
  //             setFileLists([]);
  //             closeModal(true);
  //           }, 500);
  //         },
  //         onError: (err) => {
  //           setFileLists([
  //             {
  //               name: fileDetails.file.name,
  //               thumbUrl: coverImageUrl,
  //               status: 'error',
  //             },
  //           ]);
  //           console.log('onError', err);
  //           showErrorModal(`Failed to upload video`);
  //           setTimeout(() => {
  //             setFileLists([]);
  //           }, 500);
  //         },
  //       });
  //       upload.current.start();
  //       }
  //     } catch (error) {
  //       console.log(error);
  //       showErrorModal(`Failed to upload video`);
  //     }
  //   },
  //   listType: 'picture',
  //   fileList: fileLists,
  //   showUploadList: {
  //     showRemoveIcon: fileLists && fileLists.length && fileLists[0].status === 'uploading' ? true : false,
  //     removeIcon: isVideoPaused ? (
  //       <PlayCircleOutlined
  //         className={styles.videoIcon}
  //         onClick={() => {
  //           // Retrieve a list of uploads that have been previously started for this file.
  //           // These uploads will be queried from the URL Storage using the file's fingerprint.
  //           upload.current.findPreviousUploads().then((previousUploads) => {
  //             var chosenUpload = askToResumeUpload(previousUploads);
  //             if (chosenUpload) {
  //               upload.current.resumeFromPreviousUpload(chosenUpload);
  //             }
  //             upload.current.start();
  //             setIsVideoPaused(false);
  //           });

  //           function askToResumeUpload(previousUploads) {
  //             if (previousUploads.length === 0) return null;
  //             return previousUploads[previousUploads.length - 1];
  //           }
  //         }}
  //       />
  //     ) : (
  //       <PauseCircleOutlined
  //         className={styles.videoIcon}
  //         onClick={() => {
  //           upload.current.abort(false);
  //           setIsVideoPaused(true);
  //         }}
  //       />
  //     ),
  //   },
  // };

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
            </Row>
            <Form.Item {...(!isMobileDevice && formTailLayout)}>
              <Row>
                <Col xs={12}>
                  <Button block type="default" onClick={() => closeModal(false)} loading={isSubmitting}>
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
            <DragDrop
              uppy={uppy}
              locale={{
                strings: {
                  // Text to show on the droppable area.
                  // `%{browse}` is replaced with a link that opens the system file selection dialog.
                  dropHereOr: 'Drop here or %{browse}',
                  // Used as the label for the link that opens the system file selection dialog.
                  browse: 'browse',
                },
              }}
            />

            {/* <Upload {...uploadVideoProps} style={{ width: '100% !important' }}>
              <Button type="dashed" className={styles.uploadVideoBtn} icon={<UploadOutlined />}>
                Upload Video
              </Button>
            </Upload> */}
            <Row justify="center" className={styles.mt20}>
              <Col xs={12}>
                <Button block type="default" onClick={() => closeModal(true)} loading={isSubmitting}>
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
