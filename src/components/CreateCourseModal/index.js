import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import moment from 'moment';

import { Row, Col, Button, Form, Input, InputNumber, Select, Typography, DatePicker, Modal, Tag } from 'antd';
import { TwitterPicker } from 'react-color';

import apis from 'apis';

import Loader from 'components/Loader';
import ImageUpload from 'components/ImageUpload';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import validationRules from 'utils/validation';
import { isAPISuccess, generateRandomColor } from 'utils/helper';

import { courseModalFormLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';

const courseTypes = {
  LIVE: {
    name: 'LIVE',
    label: 'Live Session Course',
  },
  VIDEO: {
    name: 'VIDEO',
    label: 'Video Course',
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
  videoList: [],
  colorCode: initialColor,
};

const { Text } = Typography;

const {
  timeCalculation: { dateIsBeforeDate },
  formatDate: { toLocaleTime, toLongDateWithDay },
} = dateUtil;

const CreateCourseModal = ({ visible, closeModal, editedCourse = null }) => {
  const [form] = Form.useForm();

  const [courseClasses, setCourseClasses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [currency, setCurrency] = useState('SGD');
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCourseClass, setSelectedCourseClass] = useState(null);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [colorCode, setColorCode] = useState(initialColor);
  const [courseStartDate, setCourseStartDate] = useState(null);
  const [courseEndDate, setCourseEndDate] = useState(null);
  const [courseImageUrl, setCourseImageUrl] = useState(null);

  const fetchAllCourseClassForCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.session.getSession();

      if (isAPISuccess(status) && data) {
        setCourseClasses(data.filter((session) => session.is_course));
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
        setVideos(
          data.filter((video) => video.price > 0).map((video) => ({ value: video.external_id, label: video.title }))
        );
      }
    } catch (error) {
      showErrorModal('Failed to fetch videos', error?.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (visible) {
      if (editedCourse) {
        form.setFieldsValue({
          courseImageUrl: editedCourse.course_image_url || '',
          courseName: editedCourse.name,
          courseStartDate: moment(editedCourse.start_date),
          courseEndDate: moment(editedCourse.end_date),
          selectedCourseClass: editedCourse.session?.session_id,
          maxParticipants: editedCourse.session?.max_participants,
          videoList: editedCourse.videos?.map((courseVideo) => courseVideo.external_id),
          price: editedCourse.price,
          colorCode: editedCourse.color_code || initialColor || whiteColor,
        });

        setCurrency(editedCourse.currency?.toUpperCase() || 'SGD');
        setSelectedCourseClass(editedCourse.session?.session_id);
        setSelectedVideos(editedCourse.videos?.map((courseVideo) => courseVideo.external_id));
        setColorCode(editedCourse.color_code || initialColor || whiteColor);
        setCourseStartDate(moment(editedCourse.start_date));
        setCourseEndDate(moment(editedCourse.end_date));
        setCourseImageUrl(editedCourse.course_image_url);
      } else {
        form.resetFields();
        setSelectedCourseClass(null);
        setSelectedVideos([]);
        setColorCode(initialColor);
        setCurrency('SGD');
        setCourseStartDate(null);
        setCourseEndDate(null);
        setCourseImageUrl(null);
      }
    }

    fetchAllCourseClassForCreator();
    fetchAllVideosForCreator();
  }, [visible, editedCourse, fetchAllCourseClassForCreator, fetchAllVideosForCreator, form]);

  const filterSessionInventoryInDateRange = (inventories) => {
    if (!inventories) {
      return [];
    }

    if (!courseStartDate || !courseEndDate) {
      return inventories;
    }

    return inventories.filter(
      (inventory) =>
        moment(inventory.start_time).isSameOrAfter(moment(courseStartDate).startOf('day')) &&
        moment(inventory.end_time).isSameOrBefore(moment(courseEndDate).endOf('day'))
    );
  };

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

    const targetCourseClass = courseClasses.find((courseClass) => courseClass.session_id === val);

    form.setFieldsValue({ ...form.getFieldsValue(), maxParticipants: targetCourseClass?.max_participants || null });
  };

  const handleCourseImageUpload = (imageUrl) => {
    setCourseImageUrl(imageUrl);
    form.setFieldsValue({ ...form.getFieldValue(), courseImageUrl: imageUrl });
  };

  const handleFinish = async (values) => {
    setSubmitting(true);

    const targetCourseClass = courseClasses.find((courseClass) => courseClass.session_id === selectedCourseClass);

    if (!targetCourseClass) {
      showErrorModal('Course Session not found', 'The course session you chose is invalid');
      setSubmitting(false);
      return;
    }

    const courseClassInventoriesInDateRange = filterSessionInventoryInDateRange(targetCourseClass?.inventory);

    if (courseClassInventoriesInDateRange.length <= 0) {
      showErrorModal(
        'No sessions scheduled',
        'The course session you selected has no schedules in the duration you choose.'
      );
      setSubmitting(false);
      return;
    }

    console.log(courseClassInventoriesInDateRange);

    try {
      let data = {
        name: values.courseName,
        session_id: selectedCourseClass,
        max_participants: values.maxParticipants || targetCourseClass?.max_participants,
        price: values.price || 1,
        currency: currency.toLowerCase(),
        color_code: colorCode || values.colorCode || whiteColor,
        course_image_url: courseImageUrl || values.courseImageUrl,
        video_ids: selectedVideos || values.videoList || [],
        start_date: moment(courseStartDate).startOf('day').utc().format(),
        end_date: moment(courseEndDate).endOf('day').utc().format(),
        type: courseTypes.LIVE.name.toLowerCase(),
        inventory_ids: courseClassInventoriesInDateRange.map((inventory) => inventory.inventory_id) || [],
      };

      const response = editedCourse
        ? await apis.courses.updateCourse(editedCourse.id, data)
        : await apis.courses.createCourse(data);

      if (isAPISuccess(response.status)) {
        showSuccessModal(`${data.name} successfully ${editedCourse ? 'updated' : 'created'}`);
        closeModal(true);
      }
    } catch (error) {
      showErrorModal(`Failed to ${editedCourse ? 'update' : 'create'} course`);
    }

    setSubmitting(false);
  };

  const renderSessionDates = () => {
    const noInventoryComponent = (
      <Col xs={24}>
        <Text type="secondary">No sessions found for this class</Text>
      </Col>
    );

    if (!selectedCourseClass) {
      return noInventoryComponent;
    }

    const selectedSession = courseClasses.find((courseClass) => courseClass.session_id === selectedCourseClass);

    if (!selectedSession || selectedSession.inventory?.length <= 0) {
      return noInventoryComponent;
    }

    const filteredInventories = filterSessionInventoryInDateRange(selectedSession.inventory);

    if (filteredInventories.length <= 0) {
      return (
        <Col xs={24}>
          <Text type="secondary">Course has no schedules for the duration you choose</Text>
        </Col>
      );
    }

    return filteredInventories.map((sessionInventory) => (
      <Col xs={24} key={`${selectedCourseClass}_${sessionInventory.inventory_id}`}>
        <Tag color="volcano">
          <div className={styles.courseDateTags}>
            {`${toLongDateWithDay(sessionInventory.start_time)}, ${toLocaleTime(
              sessionInventory.start_time
            )} - ${toLocaleTime(sessionInventory.end_time)}`}
          </div>
        </Tag>
      </Col>
    ));
  };

  return (
    <Modal
      title={`${editedCourse ? 'Edit' : 'Create New'} Course`}
      centered={true}
      visible={visible}
      footer={null}
      onCancel={() => closeModal(false)}
      width={530}
    >
      <Loader size="large" loading={isLoading}>
        <Form
          layout="horizontal"
          name="CourseForm"
          form={form}
          onFinish={handleFinish}
          initialValues={formInitialValues}
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
                    aspect={4}
                    className={classNames('avatar-uploader', styles.coverImage)}
                    name="courseImageUrl"
                    action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                    onChange={handleCourseImageUpload}
                    value={courseImageUrl}
                    label="Course Image"
                  />
                </div>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                {...courseModalFormLayout}
                id="coursename"
                name="courseName"
                label="Course Name"
                rules={validationRules.nameValidation}
              >
                <Input placeholder="Enter Course Name" maxLength={50} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item {...courseModalFormLayout} label="Course Duration" required={true}>
                <Row gutter={8}>
                  <Col xs={12}>
                    <Form.Item
                      id="courseStartDate"
                      name="courseStartDate"
                      rules={validationRules.requiredValidation}
                      noStyle
                    >
                      <DatePicker
                        placeholder="Select Start Date"
                        onChange={handleStartDateChange}
                        disabledDate={disabledStartDates}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12}>
                    <Form.Item
                      id="courseEndDate"
                      name="courseEndDate"
                      rules={validationRules.requiredValidation}
                      noStyle
                    >
                      <DatePicker
                        placeholder="Select End Date"
                        disabled={!Boolean(courseStartDate)}
                        onChange={handleEndDateChange}
                        disabledDate={disabledEndDates}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                {...courseModalFormLayout}
                id="selectedCourseClass"
                name="selectedCourseClass"
                label="Course Session"
                rules={validationRules.requiredValidation}
              >
                <Select
                  showArrow
                  showSearch={false}
                  placeholder="Select Class"
                  options={courseClasses?.map((courseClass) => ({
                    value: courseClass.session_id,
                    label: courseClass.name,
                  }))}
                  value={selectedCourseClass}
                  onChange={handleCourseClassChange}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                {...courseModalFormLayout}
                id="maxParticipants"
                name="maxParticipants"
                label="Max Participants"
                extra={
                  <Text className={styles.helpText}>
                    {' '}
                    This is the max attendee count of the session you selected. You can update the max count here and
                    we'll update it in the session too.
                  </Text>
                }
                rules={validationRules.requiredValidation}
              >
                <InputNumber min={1} placeholder="Max Participants" className={styles.numericInput} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Row gutter={[8, 4]}>
                <Col xs={24} md={8} className={styles.courseDatesText}>
                  Course Class Date & Time :
                </Col>
                <Col xs={24} md={16}>
                  <Row gutter={[8, 8]}>{renderSessionDates()}</Row>
                </Col>
              </Row>
            </Col>
            <Col xs={24}>
              <Form.Item {...courseModalFormLayout} id="videoList" name="videoList" label="Course Video(s)">
                <Select
                  showArrow
                  showSearch={false}
                  placeholder="Select Video(s)"
                  mode="multiple"
                  maxTagCount={2}
                  options={videos}
                  value={selectedVideos}
                  onChange={(val) => setSelectedVideos(val)}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item {...courseModalFormLayout} label="Course Price" required={true}>
                <Row gutter={8}>
                  <Col xs={20}>
                    <Form.Item
                      id="price"
                      name="price"
                      rules={validationRules.numberValidation('Please Input Course Price', 1, false)}
                      noStyle
                    >
                      <InputNumber min={1} placeholder="Course Price" className={styles.numericInput} />
                    </Form.Item>
                  </Col>
                  <Col xs={4} className={styles.textAlignCenter}>
                    <Text strong className={styles.currencyWrapper}>
                      {currency?.toUpperCase()}
                    </Text>
                  </Col>
                </Row>
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
                    width={300}
                  />
                </div>
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" align="center" gutter={8} className={styles.modalActionRow}>
            <Col xs={12} md={4}>
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
