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
import { isAPISuccess } from 'utils/helper';
import { isMobileDevice } from 'utils/device';
import { fetchCreatorCurrency } from 'utils/payment';
import { generateYoutubeThumbnailURL } from 'utils/video';

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

const videoSourceTypes = {
  CLOUDFLARE: {
    value: 'CLOUDFLARE',
    label: 'Upload a video',
  },
  YOUTUBE: {
    value: 'YOUTUBE',
    label: 'Youtube video',
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

const uploadVideoFormInitialValues = {
  video_url_type: videoSourceTypes.CLOUDFLARE.value,
  youtube_url: '',
};

// TODO: Currently the document URL implementation is very hacky
const UploadVideoModal = ({
  formPart,
  setFormPart,
  visible,
  closeModal,
  editedVideo = null,
  updateEditedVideo,
  shouldClone,
  creatorMemberTags = [],
  refetchVideos,
}) => {
  const [form] = Form.useForm();
  const [uploadForm] = Form.useForm();

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
  const [videoUrlType, setVideoUrlType] = useState(videoSourceTypes.CLOUDFLARE.value);
  const [, setVideoLength] = useState(0);
  const [updateVideoDetails, setUpdateVideoDetails] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('preview');
  const [videoPreviewLoading, setVideoPreviewLoading] = useState(true);

  const [creatorPasses, setCreatorPasses] = useState([]);
  const [selectedPassIds, setSelectedPassIds] = useState([]);
  const [creatorMemberships, setCreatorMemberships] = useState([]);
  const [selectedMembershipIds, setSelectedMembershipIds] = useState([]);

  const [creatorDocuments, setCreatorDocuments] = useState([]);

  //#region Start of Uppy Related Methods

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

  uppy.current.on('cancel-all', () => {
    setVideoUploadPercent(0);
    setUploadingFile(null);
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
              console.error(error);
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

  const removeUppyListeners = () => {
    if (uppy.current) {
      const eventNames = ['complete', 'cancel-all', 'progress', 'file-added'];
      eventNames.forEach((eventName) => uppy.current.off(eventName));
    }
  };

  //#endregion End of Uppy Related Methods

  //#region Start of API Calls

  const fetchAllClassesForCreator = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data } = await apis.session.getSession();

      if (data) {
        setClasses(data);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to fetch classes');
      console.error(error);
    }

    setIsLoading(false);
  }, []);

  const fetchPassesForCreator = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.passes.getCreatorPasses();

      if (isAPISuccess(status) && data) {
        setCreatorPasses(data);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to fetch passes');
      console.error(error);
    }

    setIsLoading(false);
  }, []);

  const fetchSubscriptionsForCreator = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.subscriptions.getCreatorSubscriptions(1, 25);

      if (isAPISuccess(status) && data) {
        setCreatorMemberships(data.Data ?? []);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to fetch memberships');
      console.error(error);
    }

    setIsLoading(false);
  }, []);

  const fetchCreatorDocuments = useCallback(async () => {
    try {
      const { status, data } = await apis.documents.getCreatorDocuments();

      if (isAPISuccess(status) && data) {
        setCreatorDocuments(data.data ?? []);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to fetch user documents');
    }
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

  //#endregion End of API Calls

  //#region Start of Use Effects

  useEffect(() => {
    fetchCreatorDocuments();
    fetchAllClassesForCreator();
    fetchPassesForCreator();
    fetchSubscriptionsForCreator();
  }, [fetchAllClassesForCreator, fetchPassesForCreator, fetchSubscriptionsForCreator, fetchCreatorDocuments]);

  useEffect(() => {
    if (visible) {
      if (editedVideo) {
        // TODO: Current hacky implementation of document Url
        form.setFieldsValue({
          ...editedVideo,
          description: editedVideo.description.split('!~!~!~')[0],
          document_url: editedVideo.description.split('!~!~!~')[1],
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
        setVideoUrlType(editedVideo.source ?? videoSourceTypes.CLOUDFLARE.value);
        setActiveTabKey(
          editedVideo.thumbnail_url && editedVideo.thumbnail_url?.endsWith('.gif') ? 'preview' : 'static'
        );

        updateUppyListeners(editedVideo.external_id);

        uploadForm.setFieldsValue({
          video_url_type: editedVideo.source ?? videoSourceTypes.CLOUDFLARE.value,
          youtube_url: editedVideo.video_url ?? '',
        });

        if (editedVideo.source === videoSourceTypes.YOUTUBE.value && formPart === 3) {
          setActiveTabKey('static');
        }
      } else {
        form.resetFields();
        uploadForm.resetFields();
      }

      if (formPart === 1) {
        getCreatorCurrencyDetails();
      }
    } else {
      resetBodyStyle();
    }
    return () => {
      setCoverImageUrl(null);
      setSelectedSessionIds([]);
      setSelectedPassIds([]);
      setSelectedMembershipIds([]);
      setVideoType(videoPriceTypes.FREE.name);
      setVideoPreviewTime('');
      setIsCourseVideo(false);
      setSelectedTagType('anyone');
      setCurrency('');
      setActiveTabKey('preview');
      removeUppyListeners();
      resetBodyStyle();
      setVideoUrlType(videoSourceTypes.CLOUDFLARE.name);
    };
    //eslint-disable-next-line
  }, [visible, editedVideo, getCreatorCurrencyDetails, form, formPart]);

  useEffect(() => {
    if (editedVideo || formPart === 2) {
      setUpdateVideoDetails(true);
    }
    // eslint-disable-next-line
  }, []);

  //#endregion End of Use Effects

  //#region Start of Form Logics

  //#region Start of Form Part 1 Logics
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

  // NOTE : This handles the form submit logic on the first part of the modal
  const handleFinish = async (values) => {
    setIsSubmitting(true);

    try {
      const videoSourceData =
        editedVideo?.source === videoSourceTypes.YOUTUBE.value
          ? {
              source: videoSourceTypes.YOUTUBE.value,
              video_url: editedVideo.video_url,
            }
          : {
              source: videoSourceTypes.CLOUDFLARE.value,
            };

      // TODO: Current hacky implementation for document_url
      // without involving BE
      let payload = {
        currency: currency.toLowerCase(),
        title: values.title,
        description: `${values.description}!~!~!~${values.document_url ?? ''}`,
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
        ...videoSourceData,
      };

      const { status, data } = editedVideo
        ? await apis.videos.updateVideo(editedVideo.external_id, payload)
        : await apis.videos.createVideo(payload);

      if (isAPISuccess(status)) {
        if (!editedVideo) {
          pushToDataLayer(gtmTriggerEvents.CREATOR_CREATE_VIDEO, {
            video_name: data.title,
            video_price: data.price,
            video_id: data.external_id,
            video_creator_username: getLocalUserDetails().username,
            video_currency: data.currency || customNullValue,
          });

          const targetPassIds = selectedPassIds || values.pass_ids || [];
          const targetPasses = creatorPasses.filter((cPass) => targetPassIds.includes(cPass.external_id));
          try {
            await Promise.all(
              targetPasses.map(async (pass) => {
                const passPayload = {
                  currency: pass.currency,
                  price: pass.price,
                  name: pass.name,
                  validity: pass.validity,
                  session_ids: pass.sessions.map((session) => session.session_id),
                  video_ids: [...new Set([...pass.videos.map((video) => video.external_id), data.external_id])],
                  limited: pass.limited,
                  class_count: pass.limited ? pass.class_count : 1000,
                  color_code: pass.color_code,
                  tag_id: pass.tag?.external_id,
                };

                const updatePassResponse = await apis.passes.updateClassPass(pass.id, passPayload);
                console.log(updatePassResponse.status);
              })
            );

            await fetchPassesForCreator();
          } catch (error) {
            message.error('Failed to attach video to pass');
            console.error(error);
          }

          const targetMembershipIds = selectedMembershipIds || values.membership_ids || [];
          const targetMemberships = creatorMemberships?.filter((cSubs) =>
            targetMembershipIds.includes(cSubs.external_id)
          );

          try {
            await Promise.all(
              targetMemberships.map(async (subs) => {
                let sessionsProductInfo = subs.products['SESSION'] ?? null;
                let videosProductInfo = subs.products['VIDEO'] ?? null;

                if (videosProductInfo) {
                  videosProductInfo.product_ids = [...new Set([...videosProductInfo.product_ids, data.external_id])];
                } else if (sessionsProductInfo) {
                  const totalCredits = sessionsProductInfo.credits;

                  sessionsProductInfo.credits = Math.floor(totalCredits / 2) + (totalCredits % 2);
                  videosProductInfo = {
                    credits: Math.floor(totalCredits / 2),
                    product_ids: [data.external_id],
                  };
                }

                let productsData = {
                  VIDEO: videosProductInfo,
                };

                if (sessionsProductInfo) {
                  productsData.SESSION = sessionsProductInfo;
                }

                const subsPayload = {
                  name: subs.name,
                  price: subs.price,
                  validity: subs.validity,
                  tag_id: subs.tag.external_id,
                  color_code: subs.color_code,
                  products: productsData,
                };

                const updateSubsResponse = await apis.subscriptions.updateSubscription(subs.external_id, subsPayload);
                console.log(updateSubsResponse.status);
              })
            );

            await fetchSubscriptionsForCreator();
          } catch (error) {
            message.error('Failed to attach video to membership');
            console.error(error);
          }
        }

        refetchVideos();
        updateEditedVideo(data);

        if (data.source === videoSourceTypes.CLOUDFLARE.value) {
          // NOTE : Video UID is required here in order to
          // know whether the video has been uploaded or not
          // If it's uploaded, we proceed to step 3 (change thumbnail)
          // Else we proceed to step 2 (upload the video)
          if (data.video_uid?.length) {
            apis.videos
              .getVideoToken(data.external_id)
              .then((res) => {
                setVideoPreviewToken(res.data.token);
                setFormPart(3);
              })
              .catch((error) => {
                console.error(error);
                showErrorModal(`Failed to get video token`);
              });
          } else {
            updateUppyListeners(data.external_id);
            setFormPart(2);
          }
        } else {
          setVideoPreviewToken(null);
          setFormPart(3);
        }
      }
    } catch (error) {
      console.error(error);
      showErrorModal(
        `Failed to ${editedVideo ? 'update' : 'create'} video`,
        error?.response?.data?.message || 'Something went wrong.'
      );
    }

    setIsSubmitting(false);
  };

  //#endregion End of Form Part 1 Logics

  //#region Start of Form Part 2 Logics

  // NOTE : This is the logic used when the user
  // wants to cancel an video upload halfway through the process
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

  const handleVideoUrlTypeChange = (e) => {
    setVideoUrlType(e.target.value);
  };

  // NOTE : this logic handles the form submit on 2nd part of the modal
  // only when the video type is Youtube Video URL
  const handleUploadVideoFormFinish = async (values) => {
    setIsLoading(true);

    try {
      const payload = {
        currency: currency.toLowerCase(),
        title: editedVideo.title,
        description: editedVideo.description,
        price: videoType === videoPriceTypes.FREE.name ? 0 : editedVideo.price,
        validity: editedVideo.validity,
        session_ids: selectedSessionIds || editedVideo.session_ids || [],
        watch_limit: editedVideo.watch_limit,
        is_course: isCourseVideo,
        tag_ids: editedVideo.tags?.map((tag) => tag.external_id) ?? [],
        pay_what_you_want: videoType === videoPriceTypes.FLEXIBLE.name,
        source: values.video_url_type ?? videoUrlType,
        video_url: values.youtube_url,
        thumbnail_url: generateYoutubeThumbnailURL(values.youtube_url),
      };

      const { status, data } = await apis.videos.updateVideo(editedVideo.external_id, payload);

      if (isAPISuccess(status) && data) {
        message.success('Youtube Video Linked');
        updateEditedVideo(data);
        refetchVideos();
        setFormPart(3);
      }
    } catch (error) {
      console.error(error);
      showErrorModal(
        'Failed setting Youtube Link for video',
        error?.response?.data?.message || 'Something went wrong.'
      );
    }

    setIsLoading(false);
  };

  //#endregion End of Form Part 2 Logics

  //#region Start of Form Part 3 Logics

  // NOTE : This logic is used for getting the thumbnail URL
  // in a GIF format (for live thumbnail)
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
      console.error(error);
      setIsLoading(false);
      showErrorModal('Something went wrong!');
    }
  };

  // NOTE : This is the handler when the button is clicked
  // For Static Thumbnail URL
  const handleUploadStaticImage = () => {
    if (!coverImageUrl?.endsWith('.gif')) {
      updateVideoWithImageUrl(coverImageUrl);
    }
  };

  // NOTE : This is the actual logic that this the API and updates
  // ONLY THE THUMBNAIL_URL of the video
  const updateVideoWithImageUrl = async (imageUrl) => {
    setIsLoading(true);

    try {
      const videoSourceData =
        editedVideo?.source === videoSourceTypes.YOUTUBE.value
          ? {
              source: videoSourceTypes.YOUTUBE.value,
              video_url: editedVideo.video_url,
            }
          : {
              source: videoSourceTypes.CLOUDFLARE.value,
            };

      const payload = {
        currency: currency.toLowerCase(),
        title: editedVideo.title,
        description: editedVideo.description,
        price: videoType === videoPriceTypes.FREE.name ? 0 : editedVideo.price,
        validity: editedVideo.validity,
        session_ids: selectedSessionIds || editedVideo.session_ids || [],
        thumbnail_url: imageUrl,
        watch_limit: editedVideo.watch_limit,
        is_course: isCourseVideo,
        tag_ids: editedVideo.tags?.map((tag) => tag.external_id) ?? [],
        pay_what_you_want: videoType === videoPriceTypes.FLEXIBLE.name,
        ...videoSourceData,
      };

      const { status } = await apis.videos.updateVideo(editedVideo.external_id, payload);

      if (isAPISuccess(status)) {
        setIsLoading(false);
        closeModal(true);

        if (shouldClone) {
          showSuccessModal('Video cloned successfully');
        } else if (updateVideoDetails) {
          showSuccessModal('Video details updated successfully');
        } else {
          if (editedVideo.source === videoSourceTypes.CLOUDFLARE.value) {
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
          } else {
            showSuccessModal('Video Successfully Uploaded');
          }
          if (editedVideo && uploadingFile) {
            pushToDataLayer(gtmTriggerEvents.CREATOR_UPLOAD_VIDEO, {
              video_id: editedVideo?.external_id || customNullValue,
            });
          }
        }
      }
    } catch (error) {
      console.error(error);
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

  const handleCustomTabBarRender = (props, DefaultTabBar) => (
    <div className={styles.mb20}>
      <Radio.Group size="large" value={activeTabKey} onChange={handleRadioTabChange}>
        {Array.isArray(props.panes) ? (
          props.panes.map((pane) => (pane ? <Radio.Button value={pane.key}>{pane.props.tab}</Radio.Button> : null))
        ) : (
          <Radio.Button value={props.panes.key}>{props.panes.props.tab}</Radio.Button>
        )}
      </Radio.Group>
    </div>
  );

  const handleRadioTabChange = (e) => {
    setActiveTabKey(e.target.value);
  };

  //#endregion End of Form Part 3 Logics

  //#endregion End of Form Logics

  //#region Start of UI Components/Methods

  const modalTitle = () => {
    if (formPart === 1) {
      return 'Create Video Product';
    } else if (formPart === 2) {
      return 'Upload Video';
    } else if (formPart === 3) {
      return 'Set a preview thumbnail';
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
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        ></iframe>
      ) : (
        <div className={styles.mt50}>
          <Paragraph strong className={styles.greenText}>
            If you wish to replace the video preview as shown on the left, Select a time from your video below and we
            will generate a 15 second preview from that point.
          </Paragraph>
        </div>
      ),
    [videoPreviewTime, videoPreviewToken, editedVideo]
  );

  //#endregion End of UI Components/Methods

  return (
    <Modal
      title={modalTitle()}
      centered={true}
      visible={visible}
      footer={null}
      maskClosable={false}
      closable={[1, 3].includes(formPart)}
      onCancel={() => closeModal(false)}
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
            scrollToFirstError={true}
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
                <Form.Item id="document_url" name="document_url" label="Attached File">
                  <Select
                    showArrow
                    placeholder="Select documents you want to include"
                    options={creatorDocuments.map((document) => ({
                      label: document.name,
                      value: document.url,
                    }))}
                  />
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
                    onChange={setSelectedSessionIds}
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
              <Col xs={editedVideo ? 0 : 24}>
                <Form.Item id="pass_ids" name="pass_ids" label="Related Pass(es)">
                  <Select
                    showArrow
                    showSearch={false}
                    mode="multiple"
                    value={selectedPassIds}
                    onChange={setSelectedPassIds}
                    placeholder="Select the passes usable for this video"
                    maxTagCount={2}
                    optionLabelProp="label"
                  >
                    <Select.OptGroup
                      label={<Text className={styles.optionSeparatorText}> Visible publicly </Text>}
                      key="Published Passes"
                    >
                      {creatorPasses
                        ?.filter((pass) => pass.is_published)
                        .map((pass) => (
                          <Select.Option key={pass.external_id} value={pass.external_id} label={pass.name}>
                            <Row gutter={[8, 8]}>
                              <Col xs={17}>{pass.name}</Col>
                              <Col xs={7}>
                                {pass.price > 0 ? `${pass.currency.toUpperCase()} ${pass.price}` : 'Free'}
                              </Col>
                            </Row>
                          </Select.Option>
                        ))}
                      {creatorPasses?.filter((pass) => pass.is_published).length <= 0 && (
                        <Select.Option disabled value="no_published_pass">
                          <Text disabled> No published passes </Text>
                        </Select.Option>
                      )}
                    </Select.OptGroup>
                    <Select.OptGroup
                      label={<Text className={styles.optionSeparatorText}> Hidden from anyone </Text>}
                      key="Unpublished Passes"
                    >
                      {creatorPasses
                        ?.filter((pass) => !pass.is_published)
                        .map((pass) => (
                          <Select.Option key={pass.external_id} value={pass.external_id} label={pass.name}>
                            <Row gutter={[8, 8]}>
                              <Col xs={17}>{pass.name}</Col>
                              <Col xs={7}>
                                {pass.price > 0 ? `${pass.currency.toUpperCase()} ${pass.price}` : 'Free'}
                              </Col>
                            </Row>
                          </Select.Option>
                        ))}
                      {creatorPasses?.filter((pass) => !pass.is_published).length <= 0 && (
                        <Select.Option disabled value="no_unpublished_pass">
                          <Text disabled> No unpublished passes </Text>
                        </Select.Option>
                      )}
                    </Select.OptGroup>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={editedVideo ? 0 : 24}>
                <Form.Item id="membership_ids" name="membership_ids" label="Related Memberships(s)">
                  <Select
                    showArrow
                    showSearch={false}
                    mode="multiple"
                    value={selectedMembershipIds}
                    onChange={setSelectedMembershipIds}
                    placeholder="Select the memberships usable for this video"
                    maxTagCount={2}
                    optionLabelProp="label"
                  >
                    <Select.OptGroup
                      label={<Text className={styles.optionSeparatorText}> Visible publicly </Text>}
                      key="Published Memberships"
                    >
                      {creatorMemberships
                        ?.filter((subs) => subs.is_published)
                        .map((subs) => (
                          <Select.Option key={subs.external_id} value={subs.external_id} label={subs.name}>
                            <Row gutter={[8, 8]}>
                              <Col xs={17}>{subs.name}</Col>
                              <Col xs={7}>
                                {subs.price > 0 ? `${subs.currency.toUpperCase()} ${subs.price}` : 'Free'}
                              </Col>
                            </Row>
                          </Select.Option>
                        ))}
                      {creatorMemberships?.filter((subs) => subs.is_published).length <= 0 && (
                        <Select.Option disabled value="no_published_subs">
                          <Text disabled> No published memberships </Text>
                        </Select.Option>
                      )}
                    </Select.OptGroup>
                    <Select.OptGroup
                      label={<Text className={styles.optionSeparatorText}> Hidden from anyone </Text>}
                      key="Unpublished Memberships"
                    >
                      {creatorMemberships
                        ?.filter((subs) => !subs.is_published)
                        .map((subs) => (
                          <Select.Option key={subs.external_id} value={subs.external_id} label={subs.name}>
                            <Row gutter={[8, 8]}>
                              <Col xs={17}>{subs.name}</Col>
                              <Col xs={7}>
                                {subs.price > 0 ? `${subs.currency.toUpperCase()} ${subs.price}` : 'Free'}
                              </Col>
                            </Row>
                          </Select.Option>
                        ))}
                      {creatorMemberships?.filter((subs) => !subs.is_published).length <= 0 && (
                        <Select.Option disabled value="no_unpublished_subs">
                          <Text disabled> No unpublished memberships </Text>
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
                    <Radio.Group>
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
                  <Button block type="default" onClick={() => closeModal(false)}>
                    Cancel
                  </Button>
                </Col>
                <Col xs={12}>
                  <Button className={styles.ml10} block type="primary" htmlType="submit" loading={isSubmitting}>
                    Save & Continue
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          </Form>
        )}

        {formPart === 2 && (
          <Form
            name="uploadVideoForm"
            form={uploadForm}
            initialValue={uploadVideoFormInitialValues}
            onFinish={handleUploadVideoFormFinish}
            scrollToFirstError={true}
          >
            <Form.Item
              id="video_url_type"
              name="video_url_type"
              label="Video Type"
              rules={validationRules.requiredValidation}
              onChange={handleVideoUrlTypeChange}
            >
              <Radio.Group
                disabled={videoUploadPercent > 0}
                options={Object.entries(videoSourceTypes).map(([key, urlTypeData]) => ({ ...urlTypeData }))}
              />
            </Form.Item>
            <Form.Item
              id="youtube_url"
              name="youtube_url"
              label="Youtube Video URL"
              hidden={videoUrlType !== videoSourceTypes.YOUTUBE.value}
              rules={videoUrlType !== videoSourceTypes.YOUTUBE.value ? [] : validationRules.requiredValidation}
            >
              <Input placeholder="Paste your youtube video url here" maxLength={100} />
            </Form.Item>
            {videoUrlType === videoSourceTypes.CLOUDFLARE.value ? (
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
                      <Button block type="default" onClick={() => closeModal(false)}>
                        Cancel
                      </Button>
                    )}
                  </Col>
                </Row>
              </div>
            ) : (
              <Row justify="center">
                <Col>
                  <Button type="primary" htmlType="submit">
                    Set Youtube Video
                  </Button>
                </Col>
              </Row>
            )}
          </Form>
        )}

        {formPart === 3 && (
          <Tabs renderTabBar={handleCustomTabBarRender} activeKey={activeTabKey}>
            {editedVideo?.source === videoSourceTypes.CLOUDFLARE.value ? (
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
                            <Image
                              preview={false}
                              src={editedVideo?.thumbnail_url}
                              className={styles.centeredPreview}
                            />
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
                  <Col xs={editedVideo?.thumbnail_url ? { span: 12, offset: 12 } : 24}>
                    Select Time:{' '}
                    <TimePicker
                      showNow={false}
                      value={videoPreviewTime ? moment(videoPreviewTime, 'hh:mm:ss') : null}
                      onChange={handleVideoPreviewTimeChange}
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <Button block type="default" onClick={() => closeModal(false)}>
                      Finish changes
                    </Button>
                  </Col>
                  <Col xs={24} md={12}>
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
            ) : null}
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
                      label="Cover Image (size of Facebook Cover Image)"
                      overlayHelpText="Click to change image (size of Facebook Cover Image)"
                    />
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <Button block type="default" onClick={() => closeModal(false)}>
                    Finish changes
                  </Button>
                </Col>
                <Col xs={24} md={12}>
                  <Button
                    block
                    type="primary"
                    disabled={!coverImageUrl || coverImageUrl?.endsWith('.gif')}
                    onClick={handleUploadStaticImage}
                  >
                    Save new preview
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
