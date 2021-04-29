import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Tooltip, Modal, Form, Typography, Radio, Input, InputNumber, Select, Button } from 'antd';
import { TwitterPicker } from 'react-color';

import { BookTwoTone, InfoCircleOutlined, TagOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Loader from 'components/Loader';
import { showErrorModal, showSuccessModal, showTagOptionsHelperModal } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { isAPISuccess, generateRandomColor } from 'utils/helper';
import { fetchCreatorCurrency } from 'utils/payment';

import styles from './styles.module.scss';

const { Text } = Typography;

const passTypes = {
  LIMITED: {
    name: 'LIMITED',
    label: 'Limited',
  },
  UNLIMITED: {
    name: 'UNLIMITED',
    label: 'Unlimited',
  },
};

const initialColor = generateRandomColor();

const formInitialValues = {
  passName: '',
  classList: [],
  videoList: [],
  passType: passTypes.LIMITED.name,
  colorCode: initialColor,
  passTagType: 'anyone',
  selectedMemberTag: null,
};

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

const CreatePassModal = ({ visible, closeModal, editedPass = null, creatorMemberTags = [] }) => {
  const [form] = Form.useForm();
  const history = useHistory();

  const [classes, setClasses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [currency, setCurrency] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [passType, setPassType] = useState(passTypes.LIMITED.name);
  const [colorCode, setColorCode] = useState(initialColor);

  const [selectedTagType, setSelectedTagType] = useState('anyone');
  const [selectedTag, setSelectedTag] = useState(null);

  const fetchAllClassesForCreator = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.session.getSession();

      if (isAPISuccess(status) && data) {
        setClasses(data);
      }
    } catch (error) {
      showErrorModal('Failed to fetch classes', error?.response?.data?.message || 'Something went wrong');
    }

    setIsLoading(false);
  }, []);

  const fetchAllVideosForCreator = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.videos.getCreatorVideos();

      if (isAPISuccess(status) && data) {
        setVideos(data.filter((video) => video.price > 0));
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
      // if (error.response?.data?.message === 'unable to fetch user payment details') {
      //   Modal.confirm({
      //     title: `We need your bank account details to send you the earnings. Please add your bank account details and proceed with creating a paid pass`,
      //     okText: 'Setup payment account',
      //     cancelText: 'Keep it free',
      //     onOk: () => {
      //       history.push(`${Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount}`);
      //     },
      //   });
      // } else {
      //   showErrorModal(
      //     'Failed to fetch creator currency details',
      //     error?.response?.data?.message || 'Something went wrong'
      //   );
      // }
      showErrorModal(
        'Failed to fetch creator currency details',
        error?.response?.data?.message || 'Something went wrong'
      );
    }
    setIsLoading(false);
  }, [history, form]);

  useEffect(() => {
    if (visible) {
      if (editedPass) {
        form.setFieldsValue({
          passName: editedPass.name,
          classList: editedPass.sessions.map((session) => session.session_id),
          videoList: editedPass.videos.filter((video) => video.price > 0).map((video) => video.external_id),
          passType: editedPass.limited ? passTypes.LIMITED.name : passTypes.UNLIMITED.name,
          classCount: editedPass.class_count,
          validity: editedPass.validity,
          price: editedPass.currency ? editedPass.price : 0,
          color_code: editedPass.color_code || whiteColor,
          passTagType: editedPass.tag?.external_id ? 'selected' : 'anyone',
          selectedMemberTag: editedPass.tag?.external_id || null,
        });
        setSelectedTagType(editedPass.tag?.external_id ? 'selected' : 'anyone');
        setSelectedTag(editedPass.tag?.external_id || null);
        setCurrency(editedPass.currency.toUpperCase() || '');
        setPassType(editedPass.limited ? passTypes.LIMITED.name : passTypes.UNLIMITED.name);
        setSelectedClasses(editedPass.sessions.map((session) => session.session_id));
        setSelectedVideos(editedPass.videos.filter((video) => video.price > 0).map((video) => video.external_id));
        setColorCode(editedPass.color_code || whiteColor);
      } else {
        form.resetFields();
        setPassType(passTypes.LIMITED.name);
        setSelectedClasses([]);
        setSelectedVideos([]);
        setColorCode(initialColor);
        setCurrency('');
        setSelectedTag(null);
        setSelectedTagType('anyone');
      }

      getCreatorCurrencyDetails();
      fetchAllClassesForCreator();
      fetchAllVideosForCreator();
    }
  }, [visible, editedPass, fetchAllClassesForCreator, fetchAllVideosForCreator, getCreatorCurrencyDetails, form]);

  const handleChangeLimitType = (passLimitType) => {
    form.setFieldsValue({
      ...form.getFieldsValue(),
      classCount: passLimitType === passTypes.UNLIMITED.name ? 1000 : 10,
    });
    setPassType(passLimitType);
  };

  const handleColorChange = (color) => {
    setColorCode(color.hex || whiteColor);
    form.setFieldsValue({ ...form.getFieldsValue(), color_code: color.hex || whiteColor });
  };

  const handlePassTagTypeChange = (e) => {
    if (creatorMemberTags.length > 0) {
      setSelectedTagType(e.target.value);

      if (e.target.value === 'anyone') {
        setSelectedTag(null);
        form.setFieldsValue({ ...form.getFieldsValue(), selectedMemberTag: null });
      }
    } else {
      setSelectedTagType('anyone');
      form.setFieldsValue({ ...form.getFieldsValue(), courseTagType: 'anyone', selectedMemberTag: null });
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

  const onSelectedTagChange = (selectedTagExternalId) => {
    setSelectedTag(selectedTagExternalId ?? null);

    // Need to also filter currencly selected sessions and passes based on tag type
    if (selectedTagExternalId) {
      const tempFormValues = form.getFieldsValue();

      const refilteredClasses =
        classes
          .filter((session) => tempFormValues.classList.includes(session.session_id))
          .filter((session) => session.tags?.map((tag) => tag.external_id).includes(selectedTagExternalId) || false)
          .map((session) => session.session_id) || [];

      const refilteredVideos =
        videos
          .filter((video) => tempFormValues.videoList.includes(video.external_id))
          .filter((video) => video.tags?.map((tag) => tag.external_id).includes(selectedTagExternalId) || false)
          .map((video) => video.external_id) || [];

      setSelectedClasses(refilteredClasses);
      setSelectedVideos(refilteredVideos);

      form.setFieldsValue({
        ...tempFormValues,
        classList: refilteredClasses,
        videoList: refilteredVideos,
      });
    }
  };

  const handleFinish = async (values) => {
    setIsSubmitting(true);

    try {
      const noClassesSelected = selectedClasses.length <= 0 && values.classList.length <= 0;
      const noVideosSelected = selectedVideos.length <= 0 && values.videoList.length <= 0;

      if (noClassesSelected && noVideosSelected) {
        showErrorModal('Select Class/Video', 'Please select some class or videos to include in the pass');
        form.setFieldsValue(values);
        setIsSubmitting(false);
        return;
      }

      if (passType !== passTypes.LIMITED.name && passType !== passTypes.UNLIMITED.name) {
        showErrorModal('Select Pass Type', 'Please select a pass type for this pass');
        form.setFieldsValue(values);
        setIsSubmitting(false);
        return;
      }

      let data = {
        currency: currency?.toLowerCase() || '',
        price: currency ? values.price : 0, // Will be forced to 0 if currency is missing
        name: values.passName,
        validity: values.validity,
        session_ids: selectedClasses || values.classList || [],
        video_ids: selectedVideos || values.videoList || [],
        class_count: passTypes.LIMITED.name === passType ? values.classCount || 10 : 1000,
        limited: passTypes.LIMITED.name === passType,
        color_code: colorCode || whiteColor,
        tag_id: selectedTagType === 'anyone' ? '' : values.selectedMemberTag ?? '',
      };

      const response = editedPass
        ? await apis.passes.updateClassPass(editedPass.id, data)
        : await apis.passes.createClassPass(data);

      if (isAPISuccess(response.status)) {
        showSuccessModal(`${data.name} successfully ${editedPass ? 'updated' : 'created'}`);
        closeModal(true);
      }
    } catch (error) {
      showErrorModal(
        `Failed to ${editedPass ? 'update' : 'create'} pass`,
        error?.response?.data?.message || 'Something went wrong'
      );
    }

    setIsSubmitting(false);
  };

  return (
    <Modal
      title={`${editedPass ? 'Edit' : 'Create New'} Pass`}
      centered={true}
      visible={visible}
      footer={null}
      onCancel={() => closeModal(false)}
      width={800}
    >
      <Loader size="large" loading={isLoading}>
        <Form
          layout="vertical"
          name="PassForm"
          form={form}
          onFinish={handleFinish}
          initialValues={formInitialValues}
          scrollToFirstError={true}
        >
          <Row className={styles.classPassRow} gutter={[8, 16]}>
            <Col xs={24} md={12}>
              <Form.Item id="passName" name="passName" label="Pass Name" rules={validationRules.nameValidation}>
                <Input placeholder="Enter Pass Name" maxLength={50} />
              </Form.Item>
            </Col>
            <Col xs={24} md={{ span: 11, offset: 1 }}>
              <Form.Item required label="Bookable by member with Tag" hidden={creatorMemberTags.length === 0}>
                <Form.Item
                  name="passTagType"
                  rules={validationRules.requiredValidation}
                  onChange={handlePassTagTypeChange}
                  style={{ marginBottom: 8 }}
                  className={styles.inlineFormItem}
                >
                  <Radio.Group>
                    <Radio value="anyone"> Anyone </Radio>
                    <Radio value="selected"> Selected Member Tags </Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item className={styles.inlineFormItem}>
                  <Tooltip title="Understanding the tag options">
                    <Button
                      type="link"
                      onClick={() => showTagOptionsHelperModal('pass')}
                      icon={<InfoCircleOutlined />}
                    />
                  </Tooltip>
                </Form.Item>
              </Form.Item>
              <Form.Item
                name="selectedMemberTag"
                id="selectedMemberTag"
                hidden={selectedTagType === 'anyone' || creatorMemberTags.length === 0}
              >
                <Select
                  showArrow
                  allowClear
                  placeholder="Select a member tag"
                  disabled={selectedTagType === 'anyone'}
                  onChange={onSelectedTagChange}
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
          </Row>
          <Row className={styles.classPassRow} gutter={[8, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                id="passType"
                name="passType"
                label="Pass Type"
                extra={<Text className={styles.helpText}>Type of usage limit this pass will have</Text>}
              >
                <Radio.Group
                  className="pass-type-radio"
                  onChange={(e) => handleChangeLimitType(e.target.value)}
                  value={passType}
                  options={Object.values(passTypes).map((pType) => ({
                    label: pType.label,
                    value: pType.name,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={{ span: 11, offset: 1 }}>
              <Form.Item
                id="classList"
                name="classList"
                label="Apply to Class(es)"
                extra={<Text className={styles.helpText}> The classes that will be bookable using this pass </Text>}
              >
                <Select
                  showArrow
                  allowClear
                  showSearch={false}
                  placeholder="Select your Class(es)"
                  mode="multiple"
                  maxTagCount={2}
                  value={selectedClasses}
                  onChange={(val) => setSelectedClasses(val)}
                  optionLabelProp="label"
                >
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Visible Publicly </Text>}
                    key="Published Sessions"
                  >
                    {classes
                      ?.filter((session) => session.is_active)
                      .filter((session) =>
                        !selectedTag ? true : session.tags?.map((tag) => tag.external_id).includes(selectedTag)
                      )
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
                              {session.price > 0 ? `${session.currency?.toUpperCase()} ${session.price}` : 'Free'}
                            </Col>
                          </Row>
                        </Select.Option>
                      ))}
                    {classes?.filter((session) => session.is_active).length <= 0 && (
                      <Text disabled> No published sessions </Text>
                    )}
                  </Select.OptGroup>
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Hidden from anyone </Text>}
                    key="Unpublished Sessions"
                  >
                    {classes
                      ?.filter((session) => !session.is_active)
                      .filter((session) =>
                        !selectedTag ? true : session.tags?.map((tag) => tag.external_id).includes(selectedTag)
                      )
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
                              {session.price > 0 ? `${session.currency?.toUpperCase()} ${session.price}` : 'Free'}
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
          </Row>
          <Row className={styles.classPassRow} gutter={[8, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                id="validity"
                name="validity"
                label="Pass Validity (days)"
                extra={
                  <Text className={styles.helpText}>The duration in days this pass will be usable after purchase</Text>
                }
                rules={validationRules.numberValidation('Please Input Pass Validity', 1, false)}
              >
                <InputNumber min={1} placeholder="Pass Validity" className={styles.numericInput} />
              </Form.Item>
            </Col>
            <Col xs={24} md={{ span: 11, offset: 1 }}>
              <Form.Item
                id="videoList"
                name="videoList"
                label="Apply to Video(s)"
                extra={<Text className={styles.helpText}> The videos that will be bookable using this pass </Text>}
              >
                <Select
                  showArrow
                  allowClear
                  showSearch={false}
                  placeholder="Select your Video(s)"
                  mode="multiple"
                  maxTagCount={2}
                  value={selectedVideos}
                  onChange={(val) => setSelectedVideos(val)}
                  optionLabelProp="label"
                >
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Visible Publicly </Text>}
                    key="Published Videos"
                  >
                    {videos
                      ?.filter((video) => video.is_published)
                      .filter((video) =>
                        !selectedTag ? true : video.tags?.map((tag) => tag.external_id).includes(selectedTag)
                      )
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
                              {video.price > 0 ? `${video.currency?.toUpperCase()} ${video.price}` : 'Free'}
                            </Col>
                          </Row>
                        </Select.Option>
                      ))}
                    {videos?.filter((video) => video.is_published).length <= 0 && (
                      <Text disabled> No published videos </Text>
                    )}
                  </Select.OptGroup>
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Hidden from anyone </Text>}
                    key="Unpublished Videos"
                  >
                    {videos
                      ?.filter((video) => !video.is_published)
                      .filter((video) =>
                        !selectedTag ? true : video.tags?.map((tag) => tag.external_id).includes(selectedTag)
                      )
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
                              {video.price > 0 ? `${video.currency?.toUpperCase()} ${video.price}` : 'Free'}
                            </Col>
                          </Row>
                        </Select.Option>
                      ))}
                    {videos?.filter((video) => !video.is_published).length <= 0 && (
                      <Text disabled> No unpublished videos </Text>
                    )}
                  </Select.OptGroup>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row className={styles.classPassRow} gutter={[8, 16]}>
            <Col xs={24} md={12}>
              <Row>
                <Col xs={24}>
                  <Form.Item
                    id="price"
                    name="price"
                    label="Pass Price"
                    rules={validationRules.numberValidation('Please Input Pass Price', 0, false)}
                  >
                    <InputNumber
                      min={0}
                      disabled={currency === ''}
                      placeholder="Pass Price"
                      className={styles.numericInput}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    id="classCount"
                    name="classCount"
                    label="Pass Credits"
                    extra={
                      <Text className={styles.helpText}>
                        The maximum amount of live classes and videos bookable with this pass
                      </Text>
                    }
                    rules={[
                      {
                        required: true,
                        validator: (_, value) => {
                          if (passType === passTypes.LIMITED.name && !value) {
                            return Promise.reject('Please select the amount of classes');
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber
                      disabled={passType === passTypes.UNLIMITED.name}
                      min={1}
                      placeholder="Amount of Credits"
                      className={styles.numericInput}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
            <Col xs={24} md={{ span: 11, offset: 1 }}>
              <Form.Item name="colorCode" label="Color Tag">
                <div className={styles.colorPickerPreview} style={{ borderColor: colorCode }}>
                  <TwitterPicker
                    className={styles.colorPicker}
                    color={colorCode}
                    onChangeComplete={handleColorChange}
                    triangle="hide"
                    colors={colorPickerChoices}
                  />
                </div>
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" align="center" gutter={8} className={styles.modalActionRow}>
            <Col xs={12} md={4}>
              <Button block type="default" onClick={() => closeModal(false)} loading={isSubmitting}>
                Cancel
              </Button>
            </Col>
            <Col xs={12} md={6}>
              <Button block type="primary" htmlType="submit" loading={isSubmitting}>
                {editedPass ? 'Update' : 'Create'} Pass
              </Button>
            </Col>
          </Row>
        </Form>
      </Loader>
    </Modal>
  );
};

export default CreatePassModal;
