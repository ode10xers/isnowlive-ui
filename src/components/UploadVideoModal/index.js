import React, { useState, useEffect, useCallback, useRef } from 'react';
import classNames from 'classnames';
import { Row, Col, Modal, Form, Typography, Radio, Input, InputNumber, Select, Button, Progress } from 'antd';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { DragDrop } from '@uppy/react';
import { useTranslation } from 'react-i18next';

import { BookTwoTone } from '@ant-design/icons';

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
import { i18n } from 'utils/i18n';

import styles from './styles.module.scss';

const { Text, Paragraph } = Typography;

const videoTypes = {
  FREE: {
    name: 'FREE',
    label: i18n.t('FREE'),
  },
  PAID: {
    name: 'PAID',
    label: i18n.t('PAID'),
  },
};

const formInitialValues = {
  title: '',
  description: '',
  classList: [],
  videoType: videoTypes.FREE.name,
  price: 0,
  watch_limit: 0,
  video_course_type: 'normal',
};

const UploadVideoModal = ({
  formPart,
  setFormPart,
  visible,
  closeModal,
  editedVideo = null,
  updateEditedVideo,
  shouldClone,
}) => {
  const { t } = useTranslation();
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
  const [isCourseVideo, setIsCourseVideo] = useState(false);
  const uppy = useRef(null);
  uppy.current = new Uppy({
    meta: { type: 'avatar' },
    restrictions: { maxNumberOfFiles: 1 },
    autoProceed: true,
  });

  uppy.current.use(Tus, {
    endpoint: `${config.server.baseURL}/creator/videos/${editedVideo?.external_id}/upload`,
    resume: true,
    retryDelays: null,
    chunkSize: 5 * 1024 * 1024, // Required a minimum chunk size of 5 MB, here we use 5 MB.
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
      showSuccessModal(
        t('VIDEO_SUCCESSFULLY_UPLOADED'),
        <>
          <Paragraph>{t('VIDEO_UPLOAD_SUCCESS_TEXT_1')}</Paragraph>
          <Paragraph>{t('VIDEO_UPLOAD_SUCCESS_TEXT_2')}</Paragraph>
        </>
      );
    } else {
      showErrorModal(t('FAILED_TO_UPLOAD_VIDEO'));
    }

    setTimeout(() => {
      setVideoUploadPercent(0);
      setuploadingFlie(null);
      uppy.current = null;
      closeModal(true);
    }, 500);
  });

  uppy.current.on('cancel-all', () => {
    console.log('Cancel All is called here');
  });

  const fetchAllClassesForCreator = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data } = await apis.session.getSession();

      if (data) {
        setClasses(data);
        setCurrency(data[0].currency.toUpperCase() || 'SGD');
      }
    } catch (error) {
      showErrorModal(t('FAILED_TO_FETCH_CLASSES'), error?.response?.data?.message || t('SOMETHING_WENT_WRONG'));
    }

    setIsLoading(false);
  }, [t]);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';

      if (editedVideo) {
        form.setFieldsValue({
          ...editedVideo,
          session_ids: editedVideo.sessions.map((session) => session.session_id),
          videoType: editedVideo.price === 0 ? videoTypes.FREE.name : videoTypes.PAID.name,
          video_course_type: editedVideo.is_course ? 'course' : 'normal',
        });
        setCurrency(editedVideo.currency.toUpperCase() || 'SGD');
        setVideoType(editedVideo.price === 0 ? videoTypes.FREE.name : videoTypes.PAID.name);
        setSelectedSessionIds(editedVideo.sessions.map((session) => session.session_id));
        setCoverImageUrl(editedVideo.thumbnail_url);
        setIsCourseVideo(editedVideo.is_course || false);
      } else {
        form.resetFields();
      }

      fetchAllClassesForCreator();
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      setCoverImageUrl(null);
      setSelectedSessionIds([]);
      setVideoType(videoTypes.FREE.name);
      setIsCourseVideo(false);
      uppy.current = null;
    };
  }, [visible, editedVideo, fetchAllClassesForCreator, form, formPart]);

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
        currency: currency.toLowerCase(),
        title: values.title,
        description: values.description,
        price: videoType === videoTypes.FREE.name ? 0 : values.price,
        validity: values.validity,
        session_ids: selectedSessionIds || values.session_ids || [],
        thumbnail_url: coverImageUrl,
        watch_limit: values.watch_limit,
        is_course: isCourseVideo,
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
            if (shouldClone) {
              showSuccessModal(t('VIDEO_CLONED_SUCCESSFULLY'));
            } else {
              showSuccessModal(t('VIDEO_DETAILS_UPDATED_SUCCESSFULLY'));
            }

            closeModal(true);
          } else {
            setFormPart(2);
          }
        }
      }
    } catch (error) {
      showErrorModal(
        `${t('FAILED_TO')} ${editedVideo ? t('UPDATE').toLowerCase() : t('CREATE').toLowerCase()} ${t(
          'VIDEO'
        ).toLowerCase()}`
      );
    }

    setIsSubmitting(false);
  };

  const onCoverImageUpload = (imageUrl) => {
    setCoverImageUrl(imageUrl);
    form.setFieldsValue({ ...form.getFieldsValue(), thumbnail_url: imageUrl });
  };

  const onCourseTypeChange = (e) => {
    setIsCourseVideo(e.target.value === 'course');
  };

  // Pending this feature
  // const cancelUpload = async () => {
  //   uppy.current.pauseAll();
  //   uppy.current.cancelAll();
  //   uppy.current.close();

  //   if (editedVideo) {
  //     try {
  //       const { status } = await apis.videos.unlinkVideo(editedVideo.external_id);

  //       if (isAPISuccess(status)) {
  //         message.success('Video upload aborted');
  //       }
  //     } catch (error) {
  //       message.error(error.response?.data?.message || 'Failed to remove uploaded video');
  //     }
  //   }

  //   setVideoUploadPercent(0);
  //   setuploadingFlie(null);
  //   uppy.current = null;
  //   closeModal(true);
  // };

  return (
    <Modal
      title={editedVideo ? t('EDIT_VIDEO') : t('UPLOAD_NEW_VIDEO')}
      centered={true}
      visible={visible}
      footer={null}
      maskClosable={false}
      closable={formPart === 1}
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
                      label={t('COVER_IMAGE')}
                    />
                  </div>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item id="title" name="title" label={t('TITLE')} rules={validationRules.requiredValidation}>
                  <Input placeholder={t('ENTER_TITLE')} maxLength={50} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  className={classNames(styles.bgWhite, styles.textEditorLayout)}
                  name="description"
                  label={t('DESCRIPTION')}
                  rules={validationRules.requiredValidation}
                >
                  <TextEditor name="description" form={form} placeholder={t('ENTER_DESCRIPTION')} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item id="session_ids" name="session_ids" label={t('RELATED_TO_CLASSES')}>
                  <Select
                    showArrow
                    showSearch={false}
                    placeholder={t('SELECT_YOUR_CLASSES')}
                    mode="multiple"
                    maxTagCount={2}
                    value={selectedSessionIds}
                    onChange={(val) => setSelectedSessionIds(val)}
                    optionLabelProp="label"
                  >
                    <Select.OptGroup
                      label={<Text className={styles.optionSeparatorText}> {t('VISIBLE_PUBLICLY')} </Text>}
                      key="Published Sessions"
                    >
                      {classes
                        ?.filter((session) => session.is_active)
                        .map((session) => (
                          <Select.Option
                            value={session.session_id}
                            key={session.session_id}
                            label={
                              <>
                                {session.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {session.name}
                              </>
                            }
                          >
                            <Row gutter={[8, 8]}>
                              <Col xs={17} className={styles.productName}>
                                {session.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {session.name}
                              </Col>
                              <Col xs={7} className={styles.textAlignRight}>
                                <Text strong>
                                  {session.currency?.toUpperCase()} {session.price}
                                </Text>
                              </Col>
                            </Row>
                          </Select.Option>
                        ))}
                      {classes?.filter((session) => session.is_active).length <= 0 && (
                        <Text disabled> {t('NO_PUBLISHED_SESSIONS')} </Text>
                      )}
                    </Select.OptGroup>
                    <Select.OptGroup
                      label={<Text className={styles.optionSeparatorText}> {t('HIDDEN_FROM_EVERYONE')} </Text>}
                      key="Unpublished Sessions"
                    >
                      {classes
                        ?.filter((session) => !session.is_active)
                        .map((session) => (
                          <Select.Option
                            value={session.session_id}
                            key={session.session_id}
                            label={
                              <>
                                {session.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {session.name}
                              </>
                            }
                          >
                            <Row gutter={[8, 8]}>
                              <Col xs={17} className={styles.productName}>
                                {session.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {session.name}
                              </Col>
                              <Col xs={7} className={styles.textAlignRight}>
                                <Text strong>
                                  {session.currency?.toUpperCase()} {session.price}
                                </Text>
                              </Col>
                            </Row>
                          </Select.Option>
                        ))}
                      {classes?.filter((session) => !session.is_active).length <= 0 && (
                        <Text disabled> {t('NO_UNPUBLISHED_SESSIONS')} </Text>
                      )}
                    </Select.OptGroup>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  id="video_course_type"
                  name="video_course_type"
                  label={t('VIDEO_COURSE_TYPE')}
                  rules={validationRules.requiredValidation}
                  onChange={onCourseTypeChange}
                >
                  <Radio.Group className="video-type-radio">
                    <Radio value="normal"> {t('NORMAL_VIDEO')} </Radio>
                    <Radio value="course"> {t('COURSE_VIDEOS')} </Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  id="videoType"
                  name="videoType"
                  label={t('VIDEO_PRICING')}
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
                    label={`${t('PRICE')} (${currency.toUpperCase()})`}
                    rules={validationRules.numberValidation(t('VIDEO_PRICE_ERROR_TEXT'), 0, false)}
                  >
                    <InputNumber min={0} placeholder={t('PRICE')} className={styles.numericInput} />
                  </Form.Item>
                </Col>
              )}

              <Col xs={24}>
                <Form.Item
                  id="validity"
                  name="validity"
                  label={`${t('VALIDITY')} (${t('DAYS')})`}
                  extra={<Text className={styles.helpText}>{t('VIDEO_VALIDITY_HELP_TEXT')} </Text>}
                  rules={validationRules.numberValidation(t('VALIDITY_ERROR_TEXT'), 1, false)}
                >
                  <InputNumber min={1} placeholder={t('VALIDITY')} className={styles.numericInput} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  id="watch_limit"
                  name="watch_limit"
                  label={t('WATCH_COUNT')}
                  extra={<Text className={styles.helpText}>{t('WATCH_COUNT_HELP_TEXT')}</Text>}
                >
                  <InputNumber min={1} placeholder={t('WATCH_COUNT')} className={styles.numericInput} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item {...(!isMobileDevice && formTailLayout)}>
              <Row>
                <Col xs={12}>
                  <Button block type="default" onClick={() => closeModal(false)}>
                    {t('CANCEL')}
                  </Button>
                </Col>
                <Col xs={12}>
                  <Button className={styles.ml10} block type="primary" htmlType="submit" loading={isSubmitting}>
                    {t('CONTINUE')}
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
                    dropHereOr: `${t('DROP_YOUR_VIDEO_HERE_OR')} %{browse}`,
                    browse: t('BROWSE'),
                  },
                }}
              />
              {videoUploadPercent !== 0 && (
                <>
                  <Text>{uploadingFlie?.name}</Text>
                  <Progress percent={videoUploadPercent} status="active" />
                </>
              )}
            </div>
            <Row justify="center" className={styles.mt20}>
              <Col xs={12}>
                <Button block type="default" onClick={() => closeModal(true)} disabled={uploadingFlie ? true : false}>
                  {t('CANCEL')}
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
