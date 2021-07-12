import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import moment from 'moment';
import { showErrorModal, resetBodyStyle, showSuccessModal } from 'components/Modals/modals';
import { MinusCircleOutlined, PlusOutlined, PlayCircleOutlined, VideoCameraAddOutlined } from '@ant-design/icons';
import { Row, Col, Button, Form, Typography, Modal, Collapse, Input, Image } from 'antd';
import { PlusCircleOutlined, MinusCircleTwoTone } from '@ant-design/icons';
import apis from 'apis';

import DefaultImage from 'components/Icons/DefaultImage';
import Routes from 'routes';
import Loader from 'components/Loader';
import dateUtil from 'utils/date';
import { isAPISuccess, generateRandomColor, getRandomTagColor, tagColors } from 'utils/helper';
import { fetchCreatorCurrency } from 'utils/payment';
import styles from './styles.module.scss';
const { Panel } = Collapse;
const courseTypes = {
  MIXED: {
    name: 'MIXED',
    label: 'Live Session Course',
  },
  VIDEO_NON_SEQ: {
    name: 'VIDEO_NON_SEQUENCE',
    label: 'Non-Sequential Video Course',
  },
};

const initialColor = generateRandomColor();

const whiteColor = '#ffffff';

const formInitialValues = {
  courseName: '',
  price: 10,
  courseTagType: 'anyone',
  videoList: [],
  selectedMemberTags: [],
  colorCode: initialColor,
  module: [
    {
      content: [
        {
          content_name: 'content',
        },
      ],
    },
  ],
};

const { Title } = Typography;
const { Text, Paragraph } = Typography;

const {
  formatDate: { toLocaleDate },
} = dateUtil;

const CreateCourseModule = ({
  visible,
  closeModal,
  editedCourse = null,
  isVideoModal = false,
  creatorMemberTags = [],
}) => {
  const [form] = Form.useForm();
  const history = useHistory();

  const [courseClasses, setCourseClasses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [videoPopup, setVideosPopup] = useState(false);
  const [sessionPopup, setSessionPopup] = useState(false);
  const [addMethod, setAddMethod] = useState(null);
  const [sessionMethod, setSessionMethod] = useState(null);
  const [currency, setCurrency] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCourseClass, setSelectedCourseClass] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [colorCode, setColorCode] = useState(initialColor);
  const [courseStartDate, setCourseStartDate] = useState(null);
  const [courseEndDate, setCourseEndDate] = useState(null);
  const [courseImageUrl, setCourseImageUrl] = useState(null);
  const [highestMaxParticipantCourseSession, setHighestMaxParticipantCourseSession] = useState(null);
  const [selectedInventories, setSelectedInventories] = useState([]);
  // const [isSequentialVideos, setIsSequentialVideos] = useState(false);
  const [selectedTagType, setSelectedTagType] = useState('anyone');

  const fetchAllCourseClassForCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.session.getSession();

      if (isAPISuccess(status) && data) {
        setCourseClasses(data.filter((session) => session.inventory.length > 0));
      }
    } catch (error) {
      showErrorModal('Failed to fetch course classes', error?.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  }, []);

  const fetchAllVideosForCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.videos.getCreatorVideos();

      if (isAPISuccess(status) && data) {
        let filteredVideos = data;
        setVideos(filteredVideos);
      }
    } catch (error) {
      showErrorModal('Failed to fetch videos', error?.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  }, []);

  const openVideoPopup = (addMethodRow) => {
    setAddMethod(() => addMethodRow);
    setVideosPopup(true);
  };

  const openSessionPopup = (sessionMethodRow) => {
    setSessionMethod(() => sessionMethodRow);
    setSessionPopup(true);
  };

  const addVidoestoContent = (data) => {
    if (addMethod !== null) {
      addMethod(data);
    }
  };

  const addSessiontoContent = (data) => {
    if (sessionMethod !== null) {
      sessionMethod(data);
    }
  };

  const getCreatorCurrencyDetails = useCallback(async () => {
    setIsLoading(true);

    try {
      const creatorCurrency = await fetchCreatorCurrency();

      if (creatorCurrency) {
        setCurrency(creatorCurrency);
      } else {
        setCurrency('');
        form.setFieldsValue({ ...form.getFieldsValue(), price: 0 });
        Modal.confirm({
          title: `We need your bank account details to send you the earnings. Please add your bank account details and proceed with creating a paid pass`,
          okText: 'Setup payment account',
          cancelText: 'Keep it free',
          onOk: () => {
            history.push(`${Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount}`);
          },
        });
      }
    } catch (error) {
      showErrorModal(
        'Failed to fetch creator currency details',
        error?.response?.data?.message || 'Something went wrong'
      );
    }

    setIsLoading(false);
  }, [form, history]);

  const getSelectedCourseClasses = useCallback(
    (selectedClassIds = []) => {
      if (courseClasses?.length <= 0 || selectedClassIds?.length <= 0) {
        return [];
      }

      return courseClasses.filter((courseClass) => selectedClassIds.includes(courseClass.session_id));
    },
    [courseClasses]
  );

  const filterSessionInventoryInDateRange = useCallback((inventories, startDate, endDate) => {
    if (!inventories) {
      return [];
    }

    if (!startDate || !endDate) {
      return inventories;
    }

    return inventories.filter(
      (inventory) =>
        moment(inventory.start_time).isSameOrAfter(moment(startDate).startOf('day')) &&
        moment(inventory.end_time).isSameOrBefore(moment(endDate).endOf('day'))
    );
  }, []);

  //Try useMemo so colors don't change as much
  const generatedSessionInventoryArray = useMemo(() => {
    const selectedSessions = getSelectedCourseClasses(selectedCourseClass);

    if (selectedSessions?.length <= 0) {
      return [];
    }

    let sessionInventoryArr = [];
    let usedColors = [];

    selectedSessions.forEach((selectedSession) => {
      const filteredInventories = filterSessionInventoryInDateRange(
        selectedSession.inventory,
        courseStartDate,
        courseEndDate
      );

      // Temporary logic to prevent same colors showing up
      if (usedColors.length >= tagColors.length) {
        usedColors = [];
      }

      let colorForSession = '';
      do {
        colorForSession = getRandomTagColor();
      } while (usedColors.includes(colorForSession));

      usedColors.push(colorForSession);

      if (filteredInventories.length > 0) {
        sessionInventoryArr = [
          ...sessionInventoryArr,
          ...filteredInventories.map((inventory) => ({
            session_id: selectedSession.session_id,
            inventory_id: inventory.inventory_id,
            name: selectedSession.name,
            start_time: inventory.start_time,
            end_time: inventory.end_time,
            color: colorForSession,
          })),
        ];
      }
    });

    // Group By Date
    let groupedByDateInventories = [];

    sessionInventoryArr.forEach((inventory) => {
      const foundIndex = groupedByDateInventories.findIndex((val) => val.date === toLocaleDate(inventory.start_time));

      if (foundIndex >= 0) {
        groupedByDateInventories[foundIndex].children.push(inventory);
      } else {
        groupedByDateInventories.push({
          date: toLocaleDate(inventory.start_time),
          is_date: true,
          name: inventory.start_time,
          children: [inventory],
        });
      }
    });

    return groupedByDateInventories.sort((a, b) => moment(a.date) - moment(b.date));
  }, [
    filterSessionInventoryInDateRange,
    getSelectedCourseClasses,
    selectedCourseClass,
    courseStartDate,
    courseEndDate,
  ]);

  const getAllInventoryIdInTable = useCallback(
    () =>
      [].concat.apply(
        [],
        [
          ...generatedSessionInventoryArray.map((data) => {
            return [...data.children.map((inventory) => inventory.inventory_id)];
          }),
        ]
      ),
    [generatedSessionInventoryArray]
  );

  useEffect(() => {
    if (true) {
      if (!isVideoModal) {
        fetchAllCourseClassForCreator();
      }

      if (editedCourse) {
        if (isVideoModal) {
          form.setFieldsValue({
            courseImageUrl: editedCourse?.course_image_url || '',
            courseName: editedCourse?.name,
            validity: editedCourse?.validity,
            // video_type: editedCourse?.course_sequence ? 'sequential' : 'non_sequential',
            videoList: editedCourse?.videos?.map((courseVideo) => courseVideo.external_id),
            price: editedCourse?.currency ? editedCourse?.price : 0,
            colorCode: editedCourse?.color_code || initialColor || whiteColor,
            courseTagType: editedCourse?.tag?.length > 0 ? 'selected' : 'anyone',
            selectedMemberTags: editedCourse?.tag?.map((tag) => tag.external_id) || [],
          });

          //setIsSequentialVideos(editedCourse.course_sequence || false);
          setSelectedTagType(editedCourse?.tag?.length > 0 ? 'selected' : 'anyone');
          setSelectedCourseClass([]);
          setCourseEndDate(null);
          setCourseStartDate(null);
        } else {
          form.setFieldsValue({
            courseImageUrl: editedCourse?.course_image_url || '',
            courseName: editedCourse?.name,
            courseStartDate: moment(editedCourse?.start_date),
            courseEndDate: moment(editedCourse?.end_date),
            selectedCourseClass: editedCourse?.sessions?.map((courseSession) => courseSession.session_id),
            maxParticipants: editedCourse?.max_participants,
            videoList: editedCourse?.videos?.map((courseVideo) => courseVideo.external_id),
            price: editedCourse?.currency ? editedCourse?.price : 0,
            colorCode: editedCourse?.color_code || initialColor || whiteColor,
            courseTagType: editedCourse?.tag?.length > 0 ? 'selected' : 'anyone',
            selectedMemberTags: editedCourse?.tag?.map((tag) => tag.external_id) || [],
          });

          setSelectedTagType(editedCourse?.tag?.length > 0 ? 'selected' : 'anyone');
          setSelectedCourseClass(editedCourse?.sessions?.map((courseSession) => courseSession.session_id));
          setCourseStartDate(moment(editedCourse?.start_date));
          setCourseEndDate(moment(editedCourse?.end_date));
          setSelectedInventories(editedCourse?.inventory_ids);

          // setIsSequentialVideos(false);
        }

        setSelectedVideos(editedCourse.videos?.map((courseVideo) => courseVideo.external_id));
        setCurrency(editedCourse.currency?.toUpperCase() || '');
        setCourseImageUrl(editedCourse.course_image_url);
        setColorCode(editedCourse.color_code || initialColor || whiteColor);
      } else {
        form.resetFields();
        setSelectedCourseClass([]);
        setSelectedVideos([]);
        setColorCode(initialColor);
        setCurrency('');
        setCourseStartDate(null);
        setCourseEndDate(null);
        setCourseImageUrl(null);
        setHighestMaxParticipantCourseSession(null);
        setSelectedTagType('anyone');
        // setIsSequentialVideos(false);
      }

      fetchAllVideosForCreator();
      getCreatorCurrencyDetails();
    }
  }, [
    visible,
    editedCourse,
    isVideoModal,
    fetchAllCourseClassForCreator,
    fetchAllVideosForCreator,
    getCreatorCurrencyDetails,
    form,
  ]);

  useEffect(() => {
    if (!editedCourse || editedCourse?.max_participants === 0) {
      let highestMaxParticipantCourseSession = null;
      let highestMaxParticipantCount = 0;

      if (selectedCourseClass?.length > 0) {
        const courseSessionsList = getSelectedCourseClasses(selectedCourseClass).filter(
          (selectedClass) => selectedClass.is_course
        );

        if (courseSessionsList.length > 0) {
          courseSessionsList.forEach((courseSession) => {
            if (courseSession.max_participants > highestMaxParticipantCount) {
              highestMaxParticipantCount = courseSession.max_participants;
              highestMaxParticipantCourseSession = courseSession;
            }
          });
        }
      }

      setHighestMaxParticipantCourseSession(highestMaxParticipantCourseSession);
      form.setFieldsValue({ ...form.getFieldsValue(), maxParticipants: highestMaxParticipantCount });
    } else {
      setHighestMaxParticipantCourseSession(editedCourse.max_participants);
      form.setFieldsValue({ ...form.getFieldsValue(), maxParticipants: editedCourse.max_participants });
    }
  }, [selectedCourseClass, getSelectedCourseClasses, editedCourse, form]);

  const saveChangesToCourse = async (payload, modalRef = null) => {
    setSubmitting(true);

    if (modalRef) {
      modalRef.destroy();
    }

    try {
      const response = editedCourse
        ? await apis.courses.updateCourse(editedCourse.id, payload)
        : await apis.courses.createCourse(payload);

      if (isAPISuccess(response.status)) {
        showSuccessModal(`${payload.name} successfully ${editedCourse ? 'updated' : 'created'}`);
        closeModal(true);
      }
    } catch (error) {
      showErrorModal(
        `Failed to ${editedCourse ? 'update' : 'create'} course`,
        error?.response?.data?.message || 'Something went wrong.'
      );
    }

    setSubmitting(false);
  };

  const handleFinish = async (values) => {
    setSubmitting(true);
    let payload = {};

    if (isVideoModal) {
      let processedVideosIDs = selectedVideos;

      if (processedVideosIDs.length <= 0) {
        showErrorModal('Course Video Required', 'Please select at least one course video to include in this course');
        setSubmitting(false);
        return;
      }

      payload = {
        name: values.courseName,
        color_code: colorCode || values.colorCode || whiteColor,
        course_image_url: courseImageUrl || values.courseImageUrl,
        access: values.courseAccessType,
        type: courseTypes.VIDEO_NON_SEQ.name.toUpperCase(),
        price: currency ? values.price ?? 1 : 0,
        currency: currency?.toLowerCase() || '',
        tag_ids: selectedTagType === 'anyone' ? [] : values.selectedMemberTags || [],
        video_ids: processedVideosIDs,
        validity: values.validity || 1,
      };
    } else {
      // This filter is to make sure that only the inventory IDs shown in the table will get sent to BE
      const allInventoryIds = getAllInventoryIdInTable();
      const sessionInventories = selectedInventories.filter((inv) => allInventoryIds.includes(inv));

      if (!sessionInventories || sessionInventories?.length <= 0) {
        showErrorModal('Schedule not found', 'Please select at least one schedule in the table');
        setSubmitting(false);
        return;
      }

      payload = {
        name: values.courseName,
        color_code: colorCode || values.colorCode || whiteColor,
        course_image_url: courseImageUrl || values.courseImageUrl,
        access: values.courseAccessType,
        type: courseTypes.MIXED.name.toUpperCase(),
        price: currency ? values.price ?? 1 : 0,
        currency: currency?.toLowerCase() || '',
        tag_ids: selectedTagType === 'anyone' ? [] : values.selectedMemberTags || [],
        video_ids: selectedVideos || [],
        session_ids: selectedCourseClass,
        max_participants: values.maxParticipants || highestMaxParticipantCourseSession?.max_participants,
        start_date: moment(courseStartDate).startOf('day').utc().format(),
        end_date: moment(courseEndDate).endOf('day').utc().format(),
        inventory_ids: sessionInventories,
      };
    }

    if (editedCourse) {
      const isIncludedVideoChanged =
        JSON.stringify(editedCourse?.videos?.map((courseVideo) => courseVideo.external_id)) !==
        JSON.stringify(payload.video_ids);

      if (isIncludedVideoChanged) {
        const modalRef = Modal.confirm({
          centered: true,
          closable: true,
          maskClosable: false,
          title: 'Some items in this course have changed',
          width: 640,
          content: (
            <Row gutter={[8, 4]}>
              <Col xs={24}>
                <Paragraph>It seems you have added or removed some items in this course.</Paragraph>
              </Col>
              <Col xs={24}>
                <Paragraph>
                  Would you like these changes to also reflect in the course orders already purchased by some attendees?
                </Paragraph>
              </Col>
              <Col xs={24}>
                <Row gutter={8} justify="end">
                  <Col>
                    <Button
                      block
                      type="default"
                      onClick={() => saveChangesToCourse({ ...payload, new_videos_to_orders: false }, modalRef)}
                    >
                      Don't change existing orders
                    </Button>
                  </Col>
                  <Col>
                    <Button
                      block
                      type="primary"
                      onClick={() => saveChangesToCourse({ ...payload, new_videos_to_orders: true }, modalRef)}
                    >
                      Change existing orders
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>
          ),
          okButtonProps: { style: { display: 'none' } },
          cancelButtonProps: { style: { display: 'none' } },
        });
      } else {
        saveChangesToCourse({ ...payload, new_videos_to_orders: false });
      }
    } else {
      saveChangesToCourse(payload);
    }

    setSubmitting(false);
  };

  return (
    <>
      <Modal
        title={<Title level={5}> Add Sessions</Title>}
        visible={sessionPopup}
        centered={true}
        onCancel={() => setSessionPopup(false)}
        footer={null}
        width={1080}
        afterClose={resetBodyStyle}
      >
        <Row gutter={[8, 16]}>
          <Col xs={24}>
            <Loader loading={isLoading} size="large">
              <div>
                {courseClasses.map((session) => (
                  <>
                    <Row className={styles.videoPopupRow}>
                      <Col span={6} offset={2}>
                        <Image
                          src={session.session_image_url || 'error'}
                          alt={session.name}
                          height={100}
                          fallback={DefaultImage()}
                          className={styles.thumbnailImage}
                        />
                      </Col>
                      <Col xs={12} offset={2}>
                        <Title level={4}>{session.name}</Title>
                        <Button
                          onClick={() =>
                            addSessiontoContent({
                              content_name: session.name,
                              content_id: session.session_external_id,
                              type: 'SESSION',
                            })
                          }
                        >
                          Add to Course
                        </Button>
                      </Col>
                    </Row>
                  </>
                ))}
              </div>
            </Loader>
          </Col>
        </Row>
      </Modal>
      <Modal
        title={<Title level={5}> Add Videos</Title>}
        visible={videoPopup}
        centered={true}
        onCancel={() => setVideosPopup(false)}
        footer={null}
        width={1080}
        afterClose={resetBodyStyle}
      >
        <Row gutter={[8, 16]}>
          <Col xs={24}>
            <Loader loading={isLoading} size="large">
              <div>
                {videos.map((video) => (
                  <>
                    <Row className={styles.videoPopupRow}>
                      <Col span={6} offset={2}>
                        <Image
                          src={video.thumbnail_url || 'error'}
                          alt={video.title}
                          height={100}
                          fallback={DefaultImage()}
                          className={styles.thumbnailImage}
                        />
                      </Col>
                      <Col xs={12} offset={2}>
                        <Title level={4}>{video.title}</Title>
                        <Button
                          onClick={() =>
                            addVidoestoContent({
                              content_name: video.title,
                              content_id: video.external_id,
                              type: 'VIDEO',
                            })
                          }
                        >
                          Add to Course
                        </Button>
                      </Col>
                    </Row>
                  </>
                ))}
              </div>
            </Loader>
          </Col>
        </Row>
      </Modal>
      <Loader size="large" loading={isLoading}>
        <Form
          layout="horizontal"
          name="CourseForm"
          form={form}
          onFinish={handleFinish}
          initialValues={formInitialValues}
          scrollToFirstError={true}
        >
          <Row className={styles.courseRow} gutter={[8, 16]}>
            <Col xs={24}>
              <Form.Item required={true}>
                <Form.List name="module">
                  {(fields, { add, remove }, { errors }) => (
                    <Row className={styles.ml10} gutter={[8, 12]}>
                      <Col xs={24}>
                        <Collapse expandIconPosition="left">
                          {fields.map(({ key, name, fieldKey, ...restField }) => (
                            <Panel
                              header={<Text>Module</Text>}
                              key="1"
                              extra={<MinusCircleOutlined onClick={() => remove(name)} />}
                            >
                              <Form.Item
                                key={key}
                                {...restField}
                                name={[name, 'module']}
                                fieldKey={[fieldKey, 'module']}
                              >
                                <Row>
                                  <Col xs={24}>
                                    <Form.Item required={true}>
                                      <Form.List name={[name, 'content']}>
                                        {(fieldss, { add, remove }, { errors1 }) => (
                                          <>
                                            {fieldss.map(
                                              ({ key: key1, name: name1, fieldKey: fieldKey1, ...restField }) => (
                                                <Row>
                                                  <Col span={6} offset={1}>
                                                    <Form.Item
                                                      {...restField}
                                                      name={[name1, 'content_name']}
                                                      fieldKey={[fieldKey1, 'content_name']}
                                                      id="content_name"
                                                      initialValue="Content"
                                                    >
                                                      <Input maxLength={50} />
                                                    </Form.Item>
                                                  </Col>
                                                  <Col span={2} offset={8}>
                                                    <PlayCircleOutlined onClick={() => openVideoPopup(add)} />
                                                  </Col>
                                                  <Col span={2}>
                                                    <VideoCameraAddOutlined onClick={() => openSessionPopup(add)} />
                                                  </Col>
                                                  <Col span={2}>
                                                    <MinusCircleTwoTone
                                                      twoToneColor="#FF0000"
                                                      onClick={() => remove(name)}
                                                    />
                                                  </Col>
                                                </Row>
                                              )
                                            )}
                                            <Form.Item>
                                              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                Add Content
                                              </Button>
                                            </Form.Item>
                                          </>
                                        )}
                                      </Form.List>
                                    </Form.Item>
                                  </Col>
                                </Row>
                              </Form.Item>
                            </Panel>
                          ))}
                        </Collapse>
                      </Col>
                      <Col xs={24}>
                        <Button block type="dashed" onClick={() => add()} icon={<PlusCircleOutlined />}>
                          Add more Modules
                        </Button>
                      </Col>
                      {errors && (
                        <Col xs={24}>
                          <Text type="danger"> {errors} </Text>
                        </Col>
                      )}
                    </Row>
                  )}
                </Form.List>
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" align="center" gutter={8} className={styles.modalActionRow}>
            <Col xs={12} md={8}>
              <Button block type="primary" htmlType="submit" loading={submitting}>
                Update Course
              </Button>
            </Col>
          </Row>
        </Form>
      </Loader>
    </>
  );
};

export default CreateCourseModule;
