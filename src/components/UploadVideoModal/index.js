import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import classNames from 'classnames';
import {
  Row,
  Col,
  Modal,
  Form,
  Typography,
  Radio,
  Image,
  Input,
  InputNumber,
  Select,
  Spin,
  Button,
  Progress,
  TimePicker,
  Tabs,
  message,
  Popconfirm,
} from 'antd';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { DragDrop, useUppy } from '@uppy/react';

import { BookTwoTone, InfoCircleOutlined, TagOutlined } from '@ant-design/icons';

import config from 'config';
import apis from 'apis';
import Routes from 'routes';

import Loader from 'components/Loader';
import TextEditor from 'components/TextEditor';
import ImageUpload from 'components/ImageUpload';
import {
  showErrorModal,
  showSuccessModal,
  showCourseOptionsHelperModal,
  showTagOptionsHelperModal,
  resetBodyStyle,
} from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { isMobileDevice } from 'utils/device';
import { isAPISuccess } from 'utils/helper';
import { fetchCreatorCurrency } from 'utils/payment';

import { formLayout, formTailLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';
import { customNullValue, gtmTriggerEvents, pushToDataLayer } from 'services/integrations/googleTagManager';
import { getLocalUserDetails } from 'utils/storage';
import moment from 'moment';

const { Text, Paragraph } = Typography;

const videoPriceTypes = {
  FREE: {
    name: 'FREE',
    label: 'Free',
  },
  PAID: {
    name: 'PAID',
    label: 'Paid',
  },
  FLEXIBLE: {
    name: 'FLEXIBLE',
    label: 'Let attendees pay what they can',
  },
};

const formInitialValues = {
  title: '',
  description: '',
  classList: [],
  videoType: videoPriceTypes.FREE.name,
  price: 0,
  watch_limit: 1,
  video_course_type: 'normal',
  videoTagType: 'anyone',
  selectedMemberTags: [],
};

const UploadVideoModal = ({
  formPart,
  setFormPart,
  visible,
  closeModal,
  editedVideo = null,
  updateEditedVideo,
  shouldClone,
  creatorMemberTags = [],
}) => {
  const [form] = Form.useForm();

  const [classes, setClasses] = useState([]);
  const [currency, setCurrency] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  const [videoType, setVideoType] = useState(videoPriceTypes.FREE.name);
  const [coverImageUrl, setCoverImageUrl] = useState(null);
  const [videoUploadPercent, setVideoUploadPercent] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [isCourseVideo, setIsCourseVideo] = useState(false);
  const [selectedTagType, setSelectedTagType] = useState('anyone');
  const [videoPreviewToken, setVideoPreviewToken] = useState(null);
  const [videoPreviewTime, setVideoPreviewTime] = useState('');
  const [, setVideoLength] = useState(0);
  const [updateVideoDetails, setUpdateVideoDetails] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('preview');
  const [videoPreviewLoading, setVideoPreviewLoading] = useState(true);

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

  const updateUppyListeners = (external_id) => {
    if (uppy.current) {
      // Set the upload URL
      uppy.current.getPlugin('Tus').setOptions({
        endpoint: `${config.server.baseURL}/creator/videos/${external_id}/upload`,
      });

      // Set the on complete listener
      uppy.current.on('complete', async (result) => {
        if (result.successful.length) {
          apis.videos
            .getVideoToken(external_id)
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

        uppy.current.reset();

        setTimeout(() => {
          setVideoUploadPercent(0);
          setUploadingFile(null);
          setIsLoading(false);

          uppy.current = null;
        }, 500);
      });
    }
  };

  uppy.current.on('cancel-all', () => {
    setVideoUploadPercent(0);
    setUploadingFile(null);
  });

  const removeUppyListeners = () => {
    if (uppy.current) {
      const eventNames = ['complete', 'cancel-all', 'progress', 'file-added'];
      eventNames.forEach((eventName) => uppy.current.off(eventName));
    }
  };

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

  const getCreatorCurrencyDetails = useCallback(async () => {
    setIsLoading(true);

    try {
      const creatorCurrency = await fetchCreatorCurrency();

      if (creatorCurrency) {
        setCurrency(creatorCurrency);
      } else {
        setCurrency('');
        setFreeVideo();
      }
    } catch (error) {
      showErrorModal(
        'Failed to fetch creator currency details',
        error?.response?.data?.message || 'Something went wrong'
      );
    }

    setIsLoading(false);
    //eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (visible) {
      // document.body.style.overflow = 'hidden';

      if (editedVideo) {
        form.setFieldsValue({
          ...editedVideo,
          price: editedVideo.currency === '' ? 0 : editedVideo.price,
          session_ids: editedVideo.sessions.map((session) => session.session_id),
          videoType:
            editedVideo.currency === ''
              ? videoPriceTypes.FREE.name
              : editedVideo.pay_what_you_want
              ? videoPriceTypes.FLEXIBLE.name
              : editedVideo.price === 0
              ? videoPriceTypes.FREE.name
              : videoPriceTypes.PAID.name,
          video_course_type: editedVideo.is_course ? 'course' : 'normal',
          videoTagType: editedVideo.tags?.length > 0 ? 'selected' : 'anyone',
          selectedMemberTags: editedVideo.tags?.map((tag) => tag.external_id),
        });
        setSelectedTagType(editedVideo.tags?.length > 0 ? 'selected' : 'anyone');
        setCurrency(editedVideo.currency.toUpperCase() || '');
        setVideoType(
          editedVideo.pay_what_you_want
            ? videoPriceTypes.FLEXIBLE.name
            : editedVideo.price === 0
            ? videoPriceTypes.FREE.name
            : videoPriceTypes.PAID.name
        );
        setSelectedSessionIds(editedVideo.sessions.map((session) => session.session_id));
        setCoverImageUrl(editedVideo.thumbnail_url);
        setIsCourseVideo(editedVideo.is_course || false);

        setActiveTabKey(
          editedVideo.thumbnail_url && editedVideo.thumbnail_url?.endsWith('.gif') ? 'preview' : 'static'
        );

        updateUppyListeners(editedVideo.external_id);
      } else {
        form.resetFields();
      }

      if (formPart === 1) {
        getCreatorCurrencyDetails();
      }
      fetchAllClassesForCreator();
    } else {
      resetBodyStyle();
    }
    return () => {
      setCoverImageUrl(null);
      setSelectedSessionIds([]);
      setVideoType(videoPriceTypes.FREE.name);
      setVideoPreviewTime('');
      setIsCourseVideo(false);
      setSelectedTagType('anyone');
      setCurrency('');
      setActiveTabKey('preview');
      removeUppyListeners();
      resetBodyStyle();
    };
    //eslint-disable-next-line
  }, [visible, editedVideo, fetchAllClassesForCreator, getCreatorCurrencyDetails, form, formPart]);

  useEffect(() => {
    if (editedVideo || formPart === 2) {
      setUpdateVideoDetails(true);
    }
    // eslint-disable-next-line
  }, []);

  const setFreeVideo = () => {
    form.setFieldsValue({
      ...form.getFieldsValue(),
      videoType: videoPriceTypes.FREE.name,
      price: 0,
    });
    setVideoType(videoPriceTypes.FREE.name);
  };

  const handleChangeLimitType = (e) => {
    const priceType = e.target.value;

    if (priceType === videoPriceTypes.FREE.name) {
      setFreeVideo();
    } else {
      if (currency) {
        const values = form.getFieldsValue();
        form.setFieldsValue({
          ...values,
          videoType: priceType,
          price: priceType === videoPriceTypes.FREE.name ? 0 : values.price || 10,
        });
        setVideoType(priceType);
      } else {
        Modal.confirm({
          title: `We need your bank account details to send you the earnings. Please add your bank account details and proceed with creating a paid session`,
          okText: 'Setup payment account',
          cancelText: 'Keep it free',
          onCancel: () => setFreeVideo(),
          onOk: () => {
            setFreeVideo();
            const newWindow = window.open(
              `${Routes.creatorDashboard.rootPath}${Routes.creatorDashboard.paymentAccount}`
            );
            newWindow.blur();
            window.focus();
          },
        });
      }
    }
  };

  const handleVideoTagTypeChange = (e) => {
    if (creatorMemberTags.length > 0) {
      setSelectedTagType(e.target.value);
    } else {
      setSelectedTagType('anyone');
      form.setFieldsValue({ ...form.getFieldsValue(), videoTagType: 'anyone' });
      Modal.confirm({
        title: `You currently don't have any member tags. You need to create tags to limit access to this product.`,
        okText: 'Setup Member Tags',
        cancelText: 'Cancel',
        onOk: () => {
          const newWindow = window.open(`${Routes.creatorDashboard.rootPath + Routes.creatorDashboard.membersTags}`);
          newWindow.blur();
          window.focus();
        },
      });
    }
  };

  const onCourseTypeChange = (e) => {
    setIsCourseVideo(e.target.value === 'course');
  };

  const cancelUpload = async () => {
    setIsLoading(true);
    uppy.current.cancelAll();

    try {
      const { status } = await apis.videos.unlinkVideo(editedVideo.external_id);

      if (isAPISuccess(status)) {
        message.success('Video upload aborted');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to remove uploaded video');
    }
    setIsLoading(false);
  };

  const handleFinish = async (values) => {
    setIsSubmitting(true);

    try {
      let data = {
        currency: currency.toLowerCase(),
        title: values.title,
        description: values.description,
        price:
          videoType === videoPriceTypes.FREE.name
            ? 0
            : values.price ?? (videoType === videoPriceTypes.FLEXIBLE.name ? 5 : 0),
        validity: values.validity,
        session_ids: selectedSessionIds || values.session_ids || [],
        thumbnail_url: coverImageUrl,
        watch_limit: values.watch_limit || 1,
        is_course: isCourseVideo,
        tag_ids: selectedTagType === 'anyone' ? [] : values.selectedMemberTags || [],
        pay_what_you_want: videoType === videoPriceTypes.FLEXIBLE.name,
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

        updateEditedVideo(response.data);

        if (response.data.video_uid.length) {
          apis.videos
            .getVideoToken(response.data.external_id)
            .then((res) => {
              setVideoPreviewToken(res.data.token);
              setFormPart(3);
            })
            .catch((error) => {
              console.log(error);
              showErrorModal(`Failed to get video token`);
            });
        } else {
          updateUppyListeners(response.data.external_id);
          setFormPart(2);
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

  const updateVideoWithImageUrl = (imageUrl) => {
    apis.videos
      .updateVideo(editedVideo.external_id, {
        currency: currency.toLowerCase(),
        title: editedVideo.title,
        description: editedVideo.description,
        price: videoType === videoPriceTypes.FREE.name ? 0 : editedVideo.price,
        validity: editedVideo.validity,
        session_ids: selectedSessionIds || editedVideo.session_ids || [],
        thumbnail_url: imageUrl,
        watch_limit: editedVideo.watch_limit,
        is_course: isCourseVideo,
        pay_what_you_want: videoType === videoPriceTypes.FLEXIBLE.name,
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
                We have received your video. It takes us about 10 minutes to process your video. Until then your video
                is hidden.
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
          updateVideoWithImageUrl(data);
        }
      }
    } catch (error) {
      console.log(error);
      setIsLoading(false);
      showErrorModal('Something went wrong!');
    }
  };

  const handleVideoPreviewTimeChange = (time, timeString) => {
    setVideoPreviewTime(timeString.length > 0 ? timeString : '');
    setVideoPreviewLoading(true);
  };

  const parseTimeString = (timeString) => {
    if (!timeString) {
      return '';
    }

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

  const handleUploadStaticImage = () => {
    if (!coverImageUrl?.endsWith('.gif')) {
      updateVideoWithImageUrl(coverImageUrl);
    }
  };

  const videoThumbnailPreview = useMemo(
    () =>
      videoPreviewTime ? (
        <iframe
          onLoad={() => setVideoPreviewLoading(false)}
          className={styles.thumbnailPreview}
          key={videoPreviewTime}
          title={editedVideo?.title || ''}
          src={`https://videodelivery.net/${videoPreviewToken}/thumbnails/thumbnail.gif?time=${parseTimeString(
            videoPreviewTime
          )}&height=200&duration=15s`}
          // style={{
          //   border: 'none',
          //   width: 400,
          //   height: 200,
          // }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        ></iframe>
      ) : (
        <div className={styles.mt50}>
          <Text strong> Select a timestamp below and click OK to see a preview </Text>
        </div>
      ),
    [videoPreviewTime, videoPreviewToken, editedVideo]
  );

  const handleRadioTabChange = (e) => {
    setActiveTabKey(e.target.value);
  };

  const handleCustomTabBarRender = (props, DefaultTabBar) => (
    <div className={styles.mb20}>
      <Radio.Group value={activeTabKey} onChange={handleRadioTabChange}>
        {Array.isArray(props.panes) ? (
          props.panes.map((pane) => <Radio.Button value={pane.key}>{pane.props.tab}</Radio.Button>)
        ) : (
          <Radio.Button value={props.panes.key}>{props.panes.props.tab}</Radio.Button>
        )}
      </Radio.Group>
    </div>
  );

  return (
    <Modal
      title={modalTitle()}
      centered={true}
      visible={visible}
      footer={null}
      maskClosable={false}
      closable={[1, 3].includes(formPart)}
      onCancel={() => closeModal(true)}
      width={850}
      afterClose={resetBodyStyle}
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
                <Form.Item
                  id="session_ids"
                  name="session_ids"
                  label="Related class(es) [for upselling]"
                  extra={
                    <Text className={styles.helpText}>
                      This is an optional field. You can select any of your existing live sessions here to link this
                      video to that live session. This helps you upsell this video on that live session’s page so that
                      customers who can’t find a suitable time for your live session can instead buy your video and
                      still learn while you still make a sale.
                    </Text>
                  }
                >
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
                                  {session.pay_what_you_want
                                    ? `min. ${session.price}`
                                    : session.price > 0
                                    ? `${session.currency?.toUpperCase()} ${session.price}`
                                    : 'Free'}
                                </Text>
                              </Col>
                            </Row>
                          </Select.Option>
                        ))}
                      {classes?.filter((session) => session.is_active).length <= 0 && (
                        <Select.Option disabled value="no_published_session">
                          <Text disabled> No published sessions </Text>
                        </Select.Option>
                      )}
                    </Select.OptGroup>
                    <Select.OptGroup
                      label={<Text className={styles.optionSeparatorText}> Hidden from anyone </Text>}
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
                                  {session.pay_what_you_want
                                    ? `min. ${session.price}`
                                    : session.price > 0
                                    ? `${session.currency?.toUpperCase()} ${session.price}`
                                    : 'Free'}
                                </Text>
                              </Col>
                            </Row>
                          </Select.Option>
                        ))}
                      {classes?.filter((session) => !session.is_active).length <= 0 && (
                        <Select.Option disabled value="no_unpublished_session">
                          <Text disabled> No unpublished sessions </Text>
                        </Select.Option>
                      )}
                    </Select.OptGroup>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="Video Course Type" required>
                  <Form.Item
                    id="video_course_type"
                    name="video_course_type"
                    className={styles.inlineFormItem}
                    rules={validationRules.requiredValidation}
                    onChange={onCourseTypeChange}
                  >
                    <Radio.Group className="video-type-radio">
                      <Radio value="normal"> Normal Video </Radio>
                      <Radio value="course"> Course Video </Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item className={styles.inlineFormItem}>
                    <Button
                      size="small"
                      type="link"
                      onClick={() => showCourseOptionsHelperModal('video')}
                      icon={<InfoCircleOutlined />}
                    >
                      Understanding the options
                    </Button>
                  </Form.Item>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  id="videoType"
                  name="videoType"
                  label="Video Pricing"
                  rules={validationRules.requiredValidation}
                  onChange={handleChangeLimitType}
                >
                  <Radio.Group
                    className="video-type-radio"
                    // value={videoType}
                    options={Object.values(videoPriceTypes).map((pType) => ({
                      label: pType.label,
                      value: pType.name,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={videoType === videoPriceTypes.FREE.name ? 0 : 24}>
                {/* NOTE : Currently the minimum for PWYW is 5, adjust when necessary */}
                <Form.Item
                  id="price"
                  name="price"
                  label={`Price (${currency.toUpperCase()})`}
                  extra={`Set your ${videoType === videoPriceTypes.FLEXIBLE.name ? 'minimum' : ''} price`}
                  hidden={videoType === videoPriceTypes.FREE.name}
                  rules={validationRules.numberValidation(
                    `Please input the price ${videoType === videoPriceTypes.FLEXIBLE.name ? '(min. 5)' : ''}`,
                    videoType === videoPriceTypes.FLEXIBLE.name ? 5 : 0,
                    false
                  )}
                >
                  <InputNumber
                    min={videoType === videoPriceTypes.FLEXIBLE.name ? 5 : 0}
                    disabled={currency === ''}
                    placeholder="Price"
                    className={styles.numericInput}
                  />
                </Form.Item>
              </Col>

              <Col xs={creatorMemberTags.length === 0 ? 0 : 24}>
                <Form.Item label="Bookable by member with Tag" required hidden={creatorMemberTags.length === 0}>
                  <Form.Item
                    name="videoTagType"
                    rules={validationRules.requiredValidation}
                    onChange={handleVideoTagTypeChange}
                    className={styles.inlineFormItem}
                  >
                    <Radio.Group>
                      <Radio value="anyone"> Anyone </Radio>
                      <Radio value="selected"> Selected Member Tags </Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item className={styles.inlineFormItem}>
                    <Button
                      size="small"
                      type="link"
                      onClick={() => showTagOptionsHelperModal('video')}
                      icon={<InfoCircleOutlined />}
                    >
                      Understanding the tag options
                    </Button>
                  </Form.Item>
                </Form.Item>
              </Col>

              <Col xs={selectedTagType === 'anyone' || creatorMemberTags.length === 0 ? 0 : 24}>
                <Form.Item
                  name="selectedMemberTags"
                  id="selectedMemberTags"
                  {...formTailLayout}
                  hidden={selectedTagType === 'anyone' || creatorMemberTags.length === 0}
                >
                  <Select
                    showArrow
                    mode="multiple"
                    maxTagCount={2}
                    placeholder="Select a member tag"
                    disabled={selectedTagType === 'anyone'}
                    options={creatorMemberTags.map((tag) => ({
                      label: (
                        <>
                          {' '}
                          {tag.name} {tag.is_default ? <TagOutlined /> : null}{' '}
                        </>
                      ),
                      value: tag.external_id,
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  id="validity"
                  name="validity"
                  label="Validity (days)"
                  extra={
                    <Text className={styles.helpText}>
                      No. of days this video is viewable starting from the purchase date
                    </Text>
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
                  rules={validationRules.numberValidation('Please Input Watch Count', 1, false)}
                  extra={
                    <Text className={styles.helpText}>
                      Maximum number of time a buyer can watch this video within the validity period
                    </Text>
                  }
                >
                  <InputNumber min={1} placeholder="Watch Count" className={styles.numericInput} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item {...(!isMobileDevice && formTailLayout)}>
              <Row>
                <Col xs={12}>
                  <Button block type="default" onClick={() => closeModal(true)}>
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
                  <Popconfirm
                    arrowPointAtCenter
                    title={<Text> Are you sure you want to cancel the video upload? </Text>}
                    onConfirm={cancelUpload}
                    okText="Yes, Cancel the Upload"
                    okButtonProps={{ danger: true, type: 'primary' }}
                    cancelText="No"
                  >
                    <Button block danger type="primary">
                      Cancel Upload
                    </Button>
                  </Popconfirm>
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
          <Tabs renderTabBar={handleCustomTabBarRender} type="card" activeKey={activeTabKey}>
            <Tabs.TabPane key="preview" tab="Video Preview">
              <Row justify="center" gutter={[12, 20]} className={styles.textAlignCenter}>
                {editedVideo?.thumbnail_url ? (
                  <>
                    <Col xs={24} md={12}>
                      <Row justify="center" align="middle" gutter={[8, 16]}>
                        <Col xs={24}>
                          <Text strong> Previous Thumbnail </Text>
                        </Col>
                        <Col xs={24}>
                          <Image preview={false} src={editedVideo?.thumbnail_url} className={styles.centeredPreview} />
                        </Col>
                      </Row>
                    </Col>
                    <Col xs={24} md={12}>
                      <Row justify="center" align="middle" gutter={[8, 16]}>
                        <Col xs={24}>
                          <Text strong> New Thumbnail </Text>
                        </Col>
                        <Col xs={24} className={styles.relativeContainer}>
                          {videoPreviewLoading && videoPreviewTime && (
                            <div className={styles.videoPreviewLoaderContainer}>
                              <Spin
                                className={styles.videoPreviewLoader}
                                size="large"
                                spinning={true}
                                tip="Loading preview"
                              />
                            </div>
                          )}
                          {videoThumbnailPreview}
                        </Col>
                      </Row>
                    </Col>
                  </>
                ) : (
                  <Col xs={24} className={styles.relativeContainer}>
                    {videoPreviewLoading && videoPreviewTime && (
                      <div className={styles.videoPreviewLoaderContainer}>
                        <Spin
                          className={styles.videoPreviewLoader}
                          size="large"
                          spinning={true}
                          tip="Loading preview"
                        />
                      </div>
                    )}
                    {videoThumbnailPreview}
                  </Col>
                )}
                <Col xs={24}>
                  We'll generate a 15 seconds preview starting from that time you enter below box in HH:MM:SS format.
                </Col>
                <Col xs={editedVideo?.thumbnail_url ? { span: 12, offset: 12 } : 24}>
                  Select Time:{' '}
                  <TimePicker
                    showNow={false}
                    value={videoPreviewTime ? moment(videoPreviewTime, 'hh:mm:ss') : null}
                    onChange={handleVideoPreviewTimeChange}
                  />
                </Col>
                <Col xs={24}>
                  <Button
                    block
                    type="primary"
                    className="submit-video-thumbnail-btn"
                    onClick={() => onCoverImageUpload()}
                    disabled={!videoPreviewTime}
                  >
                    Submit
                  </Button>
                </Col>
              </Row>
            </Tabs.TabPane>
            <Tabs.TabPane key="static" tab="Static Image">
              <Row justify="center" gutter={[8, 8]}>
                {coverImageUrl && !coverImageUrl?.endsWith('.gif') && (
                  <Col xs={24}>
                    <Paragraph strong>
                      You can click on the image below to change the image. You will have to click on submit for the
                      changes to be saved.
                    </Paragraph>
                  </Col>
                )}
                <Col xs={24}>
                  <div className={styles.imageWrapper}>
                    <ImageUpload
                      className={classNames('avatar-uploader', styles.coverImage)}
                      name="thumbnail_url"
                      action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                      onChange={setCoverImageUrl}
                      value={coverImageUrl?.endsWith('.gif') ? null : coverImageUrl}
                      label="Cover Image"
                    />
                  </div>
                </Col>
                <Col xs={24}>
                  <Button
                    block
                    type="primary"
                    disabled={!coverImageUrl || coverImageUrl?.endsWith('.gif')}
                    onClick={handleUploadStaticImage}
                  >
                    Submit
                  </Button>
                </Col>
              </Row>
            </Tabs.TabPane>
          </Tabs>
        )}
      </Loader>
    </Modal>
  );
};

export default UploadVideoModal;
