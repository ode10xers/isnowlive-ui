import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import classNames from 'classnames';
import {
  Row,
  Col,
  Modal,
  Form,
  Typography,
  Radio,
  Input,
  InputNumber,
  Select,
  Button,
  Progress,
  TimePicker,
} from 'antd';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { DragDrop, useUppy } from '@uppy/react';

import { BookTwoTone } from '@ant-design/icons';

import config from 'config';
import apis from 'apis';
import Routes from 'routes';

import Loader from 'components/Loader';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';
import TextEditor from 'components/TextEditor';

import validationRules from 'utils/validation';
import { isMobileDevice } from 'utils/device';
import { isAPISuccess } from 'utils/helper';

import { formLayout, formTailLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';
import { customNullValue, gtmTriggerEvents, pushToDataLayer } from 'services/integrations/googleTagManager';
import { getLocalUserDetails } from 'utils/storage';
import moment from 'moment';

const { Text, Paragraph } = Typography;

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
  const [form] = Form.useForm();
  const history = useHistory();

  const [classes, setClasses] = useState([]);
  const [currency, setCurrency] = useState('SGD');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  const [videoType, setVideoType] = useState(videoTypes.FREE.name);
  const [coverImageUrl, setCoverImageUrl] = useState(null);
  const [videoUploadPercent, setVideoUploadPercent] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [isCourseVideo, setIsCourseVideo] = useState(false);
  const [videoPreviewToken, setVideoPreviewToken] = useState(null);
  const [videoPreviewTime, setVideoPreviewTime] = useState('00:00:01');
  const [, setVideoLength] = useState(0);
  const [updateVideoDetails, setUpdateVideoDetails] = useState(false);

  const uppy = useRef(null);
  uppy.current = useUppy(() => {
    return new Uppy({
      meta: { type: 'avatar' },
      restrictions: { maxNumberOfFiles: 1 },
      autoProceed: true,
      logger: Uppy.debugLogger,
    }).use(Tus, {
      endpoint: `${config.server.baseURL}/creator/videos/${editedVideo?.external_id}/upload`,
      resume: false,
      autoRetry: false,
      retryDelays: null,
      chunkSize: 5 * 1024 * 1024, // Required a minimum chunk size of 5 MB, here we use 5 MB.
    });
  });

  uppy.current.on('file-added', (file) => {
    setUploadingFile(file);
    setIsLoading(true);

    var blob = new Blob([file.data]), // create a blob of buffer
      url = URL.createObjectURL(blob), // create o-URL of blob
      video = document.createElement('video'); // create video element

    video.preload = 'metadata'; // preload setting
    video.addEventListener('loadedmetadata', function () {
      setVideoLength(video.duration);
    });
    video.src = url;
  });

  uppy.current.on('progress', (result) => {
    setIsLoading(false);
    setVideoUploadPercent(result);
  });

  uppy.current.on('complete', (result) => {
    if (result.successful.length) {
      apis.videos
        .getVideoToken(editedVideo.external_id)
        .then((res) => {
          setVideoPreviewToken(res.data.token);
          setFormPart(3);
        })
        .catch((error) => {
          console.log(error);
          showErrorModal(`Failed to get video token`);
        });
    } else {
      showErrorModal(`Failed to upload video`);
    }

    setTimeout(() => {
      setVideoUploadPercent(0);
      setUploadingFile(null);
      setIsLoading(false);

      uppy.current = null;
    }, 500);
  });

  uppy.current.on('cancel-all', () => {
    console.log('Cancel All is called here');
    setVideoUploadPercent(0);
    setUploadingFile(null);
  });

  const fetchAllClassesForCreator = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data } = await apis.session.getSession();

      if (data) {
        setClasses(data);
      }
    } catch (error) {
      showErrorModal('Failed to fetch classes', error?.response?.data?.message || 'Something went wrong');
    }

    setIsLoading(false);
  }, []);

  const fetchCreatorCurrency = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.session.getCreatorBalance();

      if (isAPISuccess(status) && data?.currency) {
        setCurrency(data.currency.toUpperCase());
      }
    } catch (error) {
      if (error.response?.data?.message === 'unable to fetch user payment details') {
        Modal.confirm({
          title: `We need your bank account details to send you the earnings. Please add your bank account details and proceed with creating a paid video`,
          okText: 'Setup payment account',
          cancelText: 'Keep it free',
          onOk: () => {
            history.push(`${Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount}`);
          },
        });
      } else {
        showErrorModal(
          'Failed to fetch creator currency details',
          error?.response?.data?.message || 'Something went wrong'
        );
      }
    }
    setIsLoading(false);
  }, [history]);

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

        if (uppy.current) {
          uppy.current.getPlugin('Tus').setOptions({
            endpoint: `${config.server.baseURL}/creator/videos/${editedVideo?.external_id}/upload`,
          });
        }
      } else {
        form.resetFields();
      }

      if (formPart === 1) {
        fetchCreatorCurrency();
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
  }, [visible, editedVideo, fetchAllClassesForCreator, fetchCreatorCurrency, form, formPart]);

  useEffect(() => {
    if (editedVideo || formPart === 2) {
      setUpdateVideoDetails(true);
    }
    // eslint-disable-next-line
  }, []);

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
        if (!editedVideo) {
          pushToDataLayer(gtmTriggerEvents.CREATOR_CREATE_VIDEO, {
            video_name: response.data.title,
            video_price: response.data.price,
            video_id: response.data.external_id,
            video_creator_username: getLocalUserDetails().username,
            video_currency: response.data.currency || customNullValue,
          });
        }

        if (response.data) {
          updateEditedVideo(response.data);

          if (response.data.video_uid.length) {
            apis.videos
              .getVideoToken(editedVideo.external_id)
              .then((res) => {
                setVideoPreviewToken(res.data.token);
                setFormPart(3);
              })
              .catch((error) => {
                console.log(error);
                showErrorModal(`Failed to get video token`);
              });
          } else {
            setFormPart(2);
          }
        } else {
          if (editedVideo.video_uid.length) {
            apis.videos
              .getVideoToken(editedVideo.external_id)
              .then((res) => {
                setVideoPreviewToken(res.data.token);
                setFormPart(3);
              })
              .catch((error) => {
                console.log(error);
                showErrorModal(`Failed to get video token`);
              });
          } else {
            setFormPart(2);
          }
        }
      }
    } catch (error) {
      showErrorModal(
        `Failed to ${editedVideo ? 'update' : 'create'} video`,
        error?.response?.data?.message || 'Something went wrong.'
      );
    }

    setIsSubmitting(false);
  };

  const onCoverImageUpload = async () => {
    try {
      setIsLoading(true);
      let blob = await fetch(
        `https://videodelivery.net/${videoPreviewToken}/thumbnails/thumbnail.gif?time=${parseTimeString(
          videoPreviewTime
        )}&height=200&duration=15s`
      ).then((res) => res.blob());

      if (blob) {
        const formData = new FormData();
        formData.append('file', new File([blob], 'thumbnail.gif', { type: 'image/gif' }));
        const { data } = await apis.user.uploadImage(formData);
        if (data) {
          apis.videos
            .updateVideo(editedVideo.external_id, {
              currency: currency.toLowerCase(),
              title: editedVideo.title,
              description: editedVideo.description,
              price: videoType === videoTypes.FREE.name ? 0 : editedVideo.price,
              validity: editedVideo.validity,
              session_ids: selectedSessionIds || editedVideo.session_ids || [],
              thumbnail_url: data,
              watch_limit: editedVideo.watch_limit,
              is_course: isCourseVideo,
            })
            .then(() => {
              setIsLoading(false);
              closeModal(true);

              if (shouldClone) {
                showSuccessModal('Video cloned successfully');
              } else if (updateVideoDetails) {
                showSuccessModal('Video details updated successfully');
              } else {
                showSuccessModal(
                  'Video Successfully Uploaded',
                  <>
                    <Paragraph>
                      We have received your video. It takes us about 10 minutes to process your video. Until then your
                      video is hidden.
                    </Paragraph>
                    <Paragraph>Come back after 10 minutes to unhide the video and start selling.</Paragraph>
                  </>
                );
                if (editedVideo && uploadingFile) {
                  pushToDataLayer(gtmTriggerEvents.CREATOR_UPLOAD_VIDEO, {
                    video_id: editedVideo?.external_id || customNullValue,
                  });
                }
              }
            })
            .catch((error) => {
              console.log(error);
              setIsLoading(false);
              showErrorModal('Something went wrong!');
            });
        }
      }
    } catch (error) {
      console.log(error);
      setIsLoading(false);
      showErrorModal('Something went wrong!');
    }
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
  //   setUploadingFile(null);
  //   uppy.current = null;
  //   closeModal(true);
  // };

  const cancelUpload = () => uppy.current.cancelAll();

  const handleVideoPreviewTimeChange = (time, timeString) => {
    setVideoPreviewTime(timeString.length > 0 ? timeString : '00:00:01');
  };

  const parseTimeString = (timeString) => {
    let time = timeString.split(':');
    return `${time[0] || 0}h${time[1] || 0}m${time[2] || 0}s`;
  };

  const modalTitle = () => {
    if (formPart === 1) {
      return 'Create Video Product';
    } else if (formPart === 2) {
      return 'Upload Video';
    } else if (formPart === 3) {
      return 'Set a preview thumbnail';
    }
  };

  return (
    <Modal
      title={modalTitle()}
      centered={true}
      visible={visible}
      footer={null}
      maskClosable={false}
      closable={[1, 3].includes(formPart)}
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
                    value={selectedSessionIds}
                    onChange={(val) => setSelectedSessionIds(val)}
                    optionLabelProp="label"
                  >
                    <Select.OptGroup
                      label={<Text className={styles.optionSeparatorText}> Visible publicly </Text>}
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
                        <Text disabled> No published sessions </Text>
                      )}
                    </Select.OptGroup>
                    <Select.OptGroup
                      label={<Text className={styles.optionSeparatorText}> Hidden from everyone </Text>}
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
                        <Text disabled> No unpublished sessions </Text>
                      )}
                    </Select.OptGroup>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  id="video_course_type"
                  name="video_course_type"
                  label="Video Course Type"
                  rules={validationRules.requiredValidation}
                  onChange={onCourseTypeChange}
                >
                  <Radio.Group className="video-type-radio">
                    <Radio value="normal"> Normal Video </Radio>
                    <Radio value="course"> Course Video </Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  id="videoType"
                  name="videoType"
                  label="Video Pricing"
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
                    label={`Price (${currency.toUpperCase()})`}
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
                  label="Validity (days)"
                  extra={
                    <Text className={styles.helpText}>The duration in days this will be usable after purchase</Text>
                  }
                  rules={validationRules.numberValidation('Please Input Validity', 1, false)}
                >
                  <InputNumber min={1} placeholder="Validity" className={styles.numericInput} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  id="watch_limit"
                  name="watch_limit"
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
            <div className={styles.uppyDragDrop} style={{ pointerEvents: uploadingFile ? 'none' : 'auto' }}>
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
                  <Text>{uploadingFile?.name}</Text>
                  <Progress percent={videoUploadPercent} status="active" />
                </>
              )}
            </div>

            <Row justify="center" className={styles.mt20}>
              <Col xs={12}>
                {uploadingFile ? (
                  <Button block danger type="primary" onClick={() => cancelUpload()}>
                    Cancel Upload
                  </Button>
                ) : (
                  <Button block type="default" onClick={() => closeModal(true)}>
                    Cancel
                  </Button>
                )}
              </Col>
            </Row>
          </div>
        )}

        {formPart === 3 && (
          <Row justify="center" style={{ textAlign: 'center' }}>
            <Col xs={24}>
              {videoPreviewTime && (
                <iframe
                  key={videoPreviewTime}
                  title={editedVideo?.title || ''}
                  src={`https://videodelivery.net/${videoPreviewToken}/thumbnails/thumbnail.gif?time=${parseTimeString(
                    videoPreviewTime
                  )}&height=200&duration=15s`}
                  style={{
                    border: 'none',
                    width: 400,
                    height: 200,
                  }}
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                ></iframe>
              )}
            </Col>
            <Col xs={24} className={styles.mt20}>
              We'll generate a 15 seconds preview starting from that time you enter below box in HH:MM:SS format.
            </Col>
            <Col xs={24} className={styles.mt20}>
              Select Time:{' '}
              <TimePicker
                showNow={false}
                defaultValue={moment(videoPreviewTime, 'hh:mm:ss')}
                onChange={handleVideoPreviewTimeChange}
              />
            </Col>
            <Col xs={24} className={styles.mt20}>
              <Button block type="default" onClick={() => onCoverImageUpload()}>
                Submit
              </Button>
            </Col>
          </Row>
        )}
      </Loader>
    </Modal>
  );
};

export default UploadVideoModal;
