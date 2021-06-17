import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import classNames from 'classnames';
import moment from 'moment';

import {
  Row,
  Col,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  DatePicker,
  Modal,
  Tag,
  Checkbox,
  Radio,
} from 'antd';
import { BookTwoTone, TagOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { TwitterPicker } from 'react-color';

import apis from 'apis';
import Routes from 'routes';

import Table from 'components/Table';
import Loader from 'components/Loader';
import ImageUpload from 'components/ImageUpload';
import { resetBodyStyle, showErrorModal, showSuccessModal, showTagOptionsHelperModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import validationRules from 'utils/validation';
import { isMobileDevice } from 'utils/device';
import { isAPISuccess, generateRandomColor, getRandomTagColor, tagColors } from 'utils/helper';
import { fetchCreatorCurrency } from 'utils/payment';

import { courseModalFormLayout, courseModalTailLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';

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

const colorPickerChoices = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#1890ff',
  '#009688',
  '#4caf50',
  '#ffc107',
  '#ff9800',
  '#ff5722',
  '#795548',
  '#607d8b',
  '#9ae2b6',
  '#bf6d11',
  '#f379b2',
  '#34727c',
  '#5030fd',
];

const formInitialValues = {
  courseName: '',
  price: 10,
  courseTagType: 'anyone',
  videoList: [],
  selectedMemberTags: [],
  colorCode: initialColor,
};

const { Text, Title, Paragraph } = Typography;

const {
  timeCalculation: { dateIsBeforeDate },
  formatDate: { toLocaleTime, toLocaleDate, toLongDateWithDay, toLongDateWithLongDay },
} = dateUtil;

const CreateCourseModal = ({
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

  const selectAllInventory = () => setSelectedInventories(getAllInventoryIdInTable());

  const unselectAllInventory = () => setSelectedInventories([]);

  useEffect(() => {
    if (visible) {
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

  const handleColorChange = (color) => {
    setColorCode(color.hex || whiteColor);
    form.setFieldsValue({ ...form.getFieldsValue(), color_code: color.hex || whiteColor });
  };

  const handleStartDateChange = (date) => {
    setCourseStartDate(date);

    if (!date || (courseEndDate && dateIsBeforeDate(courseEndDate, date))) {
      setCourseEndDate(null);
      form.setFieldsValue({ ...form.getFieldsValue(), courseEndDate: undefined });
    }
  };

  const disabledStartDates = (currentDate) => {
    return dateIsBeforeDate(currentDate, moment().startOf('day'));
  };

  const handleEndDateChange = (date) => {
    if (dateIsBeforeDate(courseStartDate, date)) {
      setCourseEndDate(date);
    }
  };

  const disabledEndDates = (currentDate) => {
    return dateIsBeforeDate(currentDate, moment().startOf('day')) || dateIsBeforeDate(currentDate, courseStartDate);
  };

  const handleCourseClassChange = (val) => {
    setSelectedCourseClass(val);
  };

  const handleCourseImageUpload = (imageUrl) => {
    setCourseImageUrl(imageUrl);
    form.setFieldsValue({ ...form.getFieldValue(), courseImageUrl: imageUrl });
  };

  const handleSelectAllCheckboxChanged = (e) => {
    if (e.target.checked) {
      selectAllInventory();
    } else {
      unselectAllInventory();
    }
  };

  const handleCourseTagTypeChange = (e) => {
    if (creatorMemberTags.length > 0) {
      setSelectedTagType(e.target.value);
    } else {
      setSelectedTagType('anyone');
      form.setFieldsValue({ ...form.getFieldsValue(), courseTagType: 'anyone' });
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

  const renderSessionDates = () => {
    const noInventoryComponent = (
      <Col xs={24}>
        <Text type="secondary">No sessions found for the date range</Text>
      </Col>
    );

    let tableData = generatedSessionInventoryArray;

    if (tableData.length <= 0) {
      return noInventoryComponent;
    }

    const tableColumns = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => {
          if (record.is_date) {
            return {
              props: {
                colSpan: 2,
              },
              children: (
                <Title level={5} className={styles.dateText}>
                  {toLongDateWithLongDay(text)}
                </Title>
              ),
            };
          } else {
            return {
              children: (
                <Tag className={styles.courseScheduleName} color={record.color || 'blue'}>
                  {record.name}
                </Tag>
              ),
            };
          }
        },
      },
      {
        title: 'Date & Time',
        dataIndex: 'start_date',
        key: 'start_date',
        align: 'right',
        width: '300px',
        render: (text, record) =>
          record.is_date
            ? { props: { colSpan: 0, rowSpan: 0 } }
            : `${toLongDateWithDay(record?.start_time)}, ${toLocaleTime(record?.start_time)} - ${toLocaleTime(
                record?.end_time
              )}`,
      },
    ];

    return (
      <Col xs={24}>
        <Table
          columns={tableColumns}
          data={tableData}
          rowKey={(record) => (record.is_date ? record.date : record.inventory_id)}
          rowSelection={{
            columnWidth: '120px',
            columnTitle: (
              <Checkbox checked={selectedInventories.length > 0} onChange={handleSelectAllCheckboxChanged}>
                <Text strong className={styles.checkboxText}>
                  {' '}
                  Select All{' '}
                </Text>
              </Checkbox>
            ),
            selectedRowKeys: selectedInventories,
            onChange: setSelectedInventories,
            getCheckboxProps: (record) => ({
              style: {
                display: record.is_date ? 'none' : 'inline-block',
              },
            }),
          }}
          expandable={{
            defaultExpandAllRows: true,
            expandedRowKeys: tableData.map((data) => data.date),
            rowExpandable: (record) => false,
            expandIconColumnIndex: -1,
          }}
        />
      </Col>
    );
  };

  const renderLiveCourseInputs = () => (
    <>
      <Col xs={isVideoModal ? 0 : 24}>
        <Form.Item
          {...courseModalFormLayout}
          id="selectedCourseClass"
          name="selectedCourseClass"
          label="Course Session"
          hidden={isVideoModal}
          rules={isVideoModal ? [] : validationRules.arrayValidation}
        >
          <Select
            showArrow
            showSearch={false}
            mode="multiple"
            maxTagCount={2}
            placeholder="Select Class"
            value={selectedCourseClass}
            onChange={handleCourseClassChange}
            optionLabelProp="label"
          >
            <Select.OptGroup
              label={<Text className={styles.optionSeparatorText}> Visible publicly </Text>}
              key="Published Session"
            >
              {courseClasses
                ?.filter((courseClass) => courseClass.is_active)
                .map((courseClass) => (
                  <Select.Option
                    value={courseClass.session_id}
                    key={courseClass.session_id}
                    label={
                      <>
                        {courseClass.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {courseClass.name}
                      </>
                    }
                  >
                    <Row gutter={[8, 8]}>
                      <Col xs={17} className={styles.productName}>
                        {courseClass.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {courseClass.name}
                      </Col>
                      <Col xs={7} className={styles.textAlignRight}>
                        <Text strong>
                          {courseClass.pay_what_you_want
                            ? `min. ${courseClass.price}`
                            : courseClass.price > 0
                            ? `${courseClass.currency?.toUpperCase()} ${courseClass.price}`
                            : 'Free'}
                        </Text>
                      </Col>
                    </Row>
                  </Select.Option>
                ))}
              {courseClasses?.filter((courseClass) => courseClass.is_active).length <= 0 && (
                <Select.Option disabled value="no_published_session">
                  <Text disabled> No published sessions </Text>
                </Select.Option>
              )}
            </Select.OptGroup>
            <Select.OptGroup
              label={<Text className={styles.optionSeparatorText}> Hidden from anyone </Text>}
              key="Unpublished Sessions"
            >
              {courseClasses
                ?.filter((courseClass) => !courseClass.is_active)
                .map((courseClass) => (
                  <Select.Option
                    value={courseClass.session_id}
                    key={courseClass.session_id}
                    label={
                      <>
                        {courseClass.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {courseClass.name}
                      </>
                    }
                  >
                    <Row gutter={[8, 8]}>
                      <Col xs={17} className={styles.productName}>
                        {courseClass.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {courseClass.name}
                      </Col>
                      <Col xs={7} className={styles.textAlignRight}>
                        <Text strong>
                          {courseClass.pay_what_you_want
                            ? `min. ${courseClass.price}`
                            : courseClass.price > 0
                            ? `${courseClass.currency?.toUpperCase()} ${courseClass.price}`
                            : 'Free'}
                        </Text>
                      </Col>
                    </Row>
                  </Select.Option>
                ))}
              {courseClasses?.filter((courseClass) => !courseClass.is_active).length <= 0 && (
                <Select.Option disabled value="no_unpublished_session">
                  <Text disabled> No unpublished sessions </Text>
                </Select.Option>
              )}
            </Select.OptGroup>
          </Select>
        </Form.Item>
      </Col>
      <Col xs={isVideoModal ? 0 : 24}>
        <Form.Item {...courseModalFormLayout} label="Course Duration" required={true} hidden={isVideoModal}>
          <Row gutter={8}>
            <Col xs={12}>
              <Form.Item
                id="courseStartDate"
                name="courseStartDate"
                rules={isVideoModal ? [] : validationRules.requiredValidation}
                noStyle
              >
                <DatePicker
                  placeholder="Select Start Date"
                  onChange={handleStartDateChange}
                  disabledDate={disabledStartDates}
                  className={styles.datePicker}
                />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item
                id="courseEndDate"
                name="courseEndDate"
                rules={isVideoModal ? [] : validationRules.requiredValidation}
                noStyle
              >
                <DatePicker
                  placeholder="Select End Date"
                  disabled={!Boolean(courseStartDate)}
                  onChange={handleEndDateChange}
                  disabledDate={disabledEndDates}
                  className={styles.datePicker}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>
      </Col>
      <Col xs={isVideoModal ? 0 : 24}>
        <Form.Item
          {...courseModalFormLayout}
          id="maxParticipants"
          name="maxParticipants"
          label="Max Course Participants"
          extra={
            <Text className={styles.helpText}>
              This is the max attendee count of the{' '}
              <Text type="danger"> {highestMaxParticipantCourseSession?.name} </Text>
              session you selected. You can update the max count here and we'll update it in the sessions too.
            </Text>
          }
          hidden={isVideoModal}
          rules={
            isVideoModal
              ? []
              : validationRules.numberValidation('Please Input Max Participants Value (min. 2)', 2, true, 100)
          }
        >
          <InputNumber min={0} placeholder="Max Participants" className={styles.numericInput} />
        </Form.Item>
      </Col>
      <Col xs={isVideoModal ? 0 : 24}>
        <Row gutter={[8, 4]}>
          <Col xs={24} className={styles.courseDatesText}>
            Course Classes Date & Time :{' '}
            <Text type="danger"> Please select the session checkbox you want to add to this course </Text>
          </Col>
          <Col xs={24}>
            <Row gutter={[8, 8]}>{renderSessionDates()}</Row>
          </Col>
        </Row>
      </Col>
    </>
  );

  const renderVideoCourseInputs = () => (
    <>
      {/*<Col xs={!isVideoModal ? 0 : 24}> 
        <Form.Item 
          {...courseModalFormLayout} 
          id="video_type" 
          name="video_type" 
          label="Video Course Type" 
          hidden={!isVideoModal} 
          rules={!isVideoModal ? [] : validationRules.requiredValidation}
          onChange={handleVideoCourseTypeChange}
        >
          <Radio.Group>
            <Radio value="non_sequential">Non-Sequential</Radio>
            <Radio value="sequential">Sequential</Radio>
          </Radio.Group>
        </Form.Item> 
      </Col> */}
      <Col xs={!isVideoModal ? 0 : 24}>
        <Form.Item
          {...courseModalFormLayout}
          label="Course Duration"
          required={true}
          hidden={!isVideoModal}
          scrollToFirstError={true}
        >
          <Row gutter={8}>
            <Col xs={20}>
              <Form.Item
                id="validity"
                name="validity"
                rules={
                  !isVideoModal
                    ? []
                    : validationRules.numberValidation('Please Input Course Duration in days', 1, false)
                }
                noStyle
              >
                <InputNumber min={1} placeholder="Course Duration" className={styles.numericInput} />
              </Form.Item>
            </Col>
            <Col xs={4} className={styles.textAlignCenter}>
              <Text className={styles.currencyWrapper}>days</Text>
            </Col>
          </Row>
        </Form.Item>
      </Col>
    </>
  );

  return (
    <Modal
      title={`${editedCourse ? 'Edit' : 'Create New'} ${isVideoModal ? 'Video' : 'Live'} Course`}
      centered={true}
      visible={visible}
      footer={null}
      onCancel={() => closeModal(false)}
      width={820}
      afterClose={resetBodyStyle}
    >
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
              <Form.Item
                id="courseImageUrl"
                name="courseImageUrl"
                rules={validationRules.requiredValidation}
                wrapperCol={{ span: 24 }}
              >
                <div className={styles.imageWrapper}>
                  <ImageUpload
                    className={classNames('avatar-uploader', styles.coverImage)}
                    name="courseImageUrl"
                    action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                    onChange={handleCourseImageUpload}
                    value={courseImageUrl}
                    label="Course Image (size of Facebook Cover Image)"
                    overlayHelpText="Click to change image (size of Facebook Cover Image)"
                  />
                </div>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                {...courseModalFormLayout}
                id="courseName"
                name="courseName"
                label="Course Name"
                rules={validationRules.nameValidation}
              >
                <Input placeholder="Enter Course Name" maxLength={50} />
              </Form.Item>
            </Col>
            {renderVideoCourseInputs()}
            {renderLiveCourseInputs()}
            <Col xs={24}>
              <Form.Item
                {...courseModalFormLayout}
                id="videoList"
                name="videoList"
                label="Course Video(s)"
                rules={isVideoModal ? validationRules.arrayValidation : []}
              >
                <Select
                  showArrow
                  showSearch={false}
                  placeholder="Select Video(s)"
                  mode="multiple"
                  maxTagCount={2}
                  value={selectedVideos}
                  onChange={(val) => setSelectedVideos(val)}
                  optionLabelProp="label"
                >
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Visible publicly </Text>}
                    key="Published Videos"
                  >
                    {videos
                      ?.filter((video) => video.is_published)
                      .map((video) => (
                        <Select.Option
                          value={video.external_id}
                          key={video.external_id}
                          label={
                            <>
                              {video.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {video.title}
                            </>
                          }
                        >
                          <Row gutter={[8, 8]}>
                            <Col xs={17} className={styles.productName}>
                              {video.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {video.title}
                            </Col>
                            <Col xs={7} className={styles.textAlignRight}>
                              <Text strong>
                                {video.pay_what_you_want
                                  ? `min. ${video.price}`
                                  : video.price > 0
                                  ? `${video.currency?.toUpperCase()} ${video.price}`
                                  : 'Free'}
                              </Text>
                            </Col>
                          </Row>
                        </Select.Option>
                      ))}
                    {videos?.filter((video) => video.is_published).length <= 0 && (
                      <Select.Option disabled value="no_published_video">
                        <Text disabled> No published video </Text>
                      </Select.Option>
                    )}
                  </Select.OptGroup>
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Hidden from anyone </Text>}
                    key="Unpublished Videos"
                  >
                    {videos
                      ?.filter((video) => !video.is_published)
                      .map((video) => (
                        <Select.Option
                          value={video.external_id}
                          key={video.external_id}
                          label={
                            <>
                              {' '}
                              {video.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {video.title}{' '}
                            </>
                          }
                        >
                          <Row gutter={[8, 8]}>
                            <Col xs={17} className={styles.productName}>
                              {video.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {video.title}
                            </Col>
                            <Col xs={7} className={styles.textAlignRight}>
                              <Text strong>
                                {video.pay_what_you_want
                                  ? `min. ${video.price}`
                                  : video.price > 0
                                  ? `${video.currency?.toUpperCase()} ${video.price}`
                                  : 'Free'}
                              </Text>
                            </Col>
                          </Row>
                        </Select.Option>
                      ))}
                    {videos?.filter((video) => !video.is_published).length <= 0 && (
                      <Select.Option disabled value="no_unpublished_video">
                        <Text disabled> No unpublished video </Text>
                      </Select.Option>
                    )}
                  </Select.OptGroup>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item {...courseModalFormLayout} label="Course Price" required={true}>
                <Row gutter={8}>
                  <Col xs={20}>
                    <Form.Item
                      id="price"
                      name="price"
                      rules={validationRules.numberValidation('Please Input Course Price', 0, false)}
                      noStyle
                    >
                      <InputNumber
                        min={0}
                        disabled={currency === ''}
                        placeholder="Course Price"
                        className={styles.numericInput}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={4} className={styles.textAlignCenter}>
                    <Text strong className={styles.currencyWrapper}>
                      {currency?.toUpperCase() || ''}
                    </Text>
                  </Col>
                </Row>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Bookable by member with Tag"
                required
                {...courseModalFormLayout}
                hidden={creatorMemberTags.length === 0}
              >
                <Form.Item
                  name="courseTagType"
                  rules={validationRules.requiredValidation}
                  onChange={handleCourseTagTypeChange}
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
                    onClick={() => showTagOptionsHelperModal('course')}
                    icon={<InfoCircleOutlined />}
                  >
                    Understanding the options
                  </Button>
                </Form.Item>
              </Form.Item>

              <Form.Item
                name="selectedMemberTags"
                id="selectedMemberTags"
                {...courseModalTailLayout}
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
              <Form.Item {...courseModalFormLayout} name="colorCode" label="Color Tag">
                <div className={styles.colorPickerPreview} style={{ borderColor: colorCode }}>
                  <TwitterPicker
                    triangle="hide"
                    color={colorCode}
                    colors={colorPickerChoices}
                    className={styles.colorPicker}
                    onChangeComplete={handleColorChange}
                    width={isMobileDevice ? 290 : 300}
                  />
                </div>
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" align="center" gutter={8} className={styles.modalActionRow}>
            <Col xs={12} md={6}>
              <Button block type="default" onClick={() => closeModal(false)} loading={submitting}>
                Cancel
              </Button>
            </Col>
            <Col xs={12} md={8}>
              <Button block type="primary" htmlType="submit" loading={submitting}>
                {editedCourse ? 'Update' : 'Create'} Course
              </Button>
            </Col>
          </Row>
        </Form>
      </Loader>
    </Modal>
  );
};

export default CreateCourseModal;
