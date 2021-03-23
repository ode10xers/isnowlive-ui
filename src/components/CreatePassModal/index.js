import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Modal, Form, Typography, Radio, Input, InputNumber, Select, Button } from 'antd';
import { TwitterPicker } from 'react-color';
import { useTranslation } from 'react-i18next';

import { BookTwoTone } from '@ant-design/icons';

import apis from 'apis';

import Loader from 'components/Loader';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { isAPISuccess, generateRandomColor } from 'utils/helper';
import { i18n } from 'utils/i18n';

import styles from './styles.module.scss';

const { Text } = Typography;

const passTypes = {
  LIMITED: {
    name: 'LIMITED',
    label: i18n.t('LIMITED'),
  },
  UNLIMITED: {
    name: 'UNLIMITED',
    label: i18n.t('UNLIMITED'),
  },
};

const initialColor = generateRandomColor();

const formInitialValues = {
  passName: '',
  classList: [],
  videoList: [],
  passType: passTypes.LIMITED.name,
  colorCode: initialColor,
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

const CreatePassModal = ({ visible, closeModal, editedPass = null }) => {
  const { t } = useTranslation();

  const [form] = Form.useForm();

  const [classes, setClasses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [currency, setCurrency] = useState('SGD');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [passType, setPassType] = useState(passTypes.LIMITED.name);
  const [colorCode, setColorCode] = useState(initialColor);

  const fetchAllClassesForCreator = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.session.getSession();

      if (isAPISuccess(status) && data) {
        setClasses(data);
        setCurrency(data[0].currency.toUpperCase());
      }
    } catch (error) {
      showErrorModal(t('FAILED_TO_FETCH_CLASSES'), error?.response?.data?.message || t('SOMETHING_WENT_WRONG'));
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
      showErrorModal(t('FAILED_TO_FETCH_VIDEOS'), error?.response?.data?.message || t('SOMETHING_WENT_WRONG'));
    }

    setIsLoading(false);
  }, []);

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
          price: editedPass.price,
          color_code: editedPass.color_code || whiteColor,
        });
        setCurrency(editedPass.currency.toUpperCase());
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
        setCurrency('SGD');
      }

      fetchAllClassesForCreator();
      fetchAllVideosForCreator();
    }
  }, [visible, editedPass, fetchAllClassesForCreator, fetchAllVideosForCreator, form]);

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

  const handleFinish = async (values) => {
    setIsSubmitting(true);

    try {
      const noClassesSelected = selectedClasses.length <= 0 && values.classList.length <= 0;
      const noVideosSelected = selectedVideos.length <= 0 && values.videoList.length <= 0;

      if (noClassesSelected && noVideosSelected) {
        showErrorModal(t('NO_CLASS_OR_VIDEO_IN_PASS_ERROR_TITLE'), t('NO_CLASS_OR_VIDEO_IN_PASS_ERROR_TEXT'));
        form.setFieldsValue(values);
        setIsSubmitting(false);
        return;
      }

      if (passType !== passTypes.LIMITED.name && passType !== passTypes.UNLIMITED.name) {
        showErrorModal(t('NO_PASS_TYPE_ERROR_TITLE'), t('NO_PASS_TYPE_ERROR_TEXT'));
        form.setFieldsValue(values);
        setIsSubmitting(false);
        return;
      }

      let data = {
        currency: currency.toLowerCase(),
        price: values.price,
        name: values.passName,
        validity: values.validity,
        session_ids: selectedClasses || values.classList || [],
        video_ids: selectedVideos || values.videoList || [],
        class_count: passTypes.LIMITED.name === passType ? values.classCount || 10 : 1000,
        limited: passTypes.LIMITED.name === passType,
        color_code: colorCode || whiteColor,
      };

      const response = editedPass
        ? await apis.passes.updateClassPass(editedPass.id, data)
        : await apis.passes.createClassPass(data);

      if (isAPISuccess(response.status)) {
        showSuccessModal(
          `${data.name} ${t('SUCCESSFULLY')} ${editedPass ? t('UPDATED').toLowerCase() : t('CREATED').toLowerCase()}`
        );
        closeModal(true);
      }
    } catch (error) {
      showErrorModal(
        `${t('FAILED_TO')} ${editedPass ? t('UPDATE').toLowerCase() : t('CREATE').toLowerCase()} ${t(
          'PASS'
        ).toLowerCase()}`
      );
    }

    setIsSubmitting(false);
  };

  return (
    <Modal
      title={`${editedPass ? t('EDIT') : t('CREATE')} ${t('PASS')}`}
      centered={true}
      visible={visible}
      footer={null}
      onCancel={() => closeModal(false)}
      width={720}
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
              <Form.Item id="passName" name="passName" label={t('PASS_NAME')} rules={validationRules.nameValidation}>
                <Input placeholder={t('PASS_NAME')} maxLength={50} />
              </Form.Item>
            </Col>
            <Col xs={24} md={{ span: 11, offset: 1 }}>
              <Form.Item
                id="classList"
                name="classList"
                label={t('APPLY_TO_CLASSES')}
                extra={<Text className={styles.helpText}> {t('APPLY_TO_CLASSES_HELP_TEXT')} </Text>}
              >
                <Select
                  showArrow
                  showSearch={false}
                  placeholder={t('SELECT_YOUR_CLASSES')}
                  mode="multiple"
                  maxTagCount={2}
                  value={selectedClasses}
                  onChange={(val) => setSelectedClasses(val)}
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
                              {session.currency?.toUpperCase()} {session.price}
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
                              {session.currency?.toUpperCase()} {session.price}
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
          </Row>
          <Row className={styles.classPassRow} gutter={[8, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                id="passType"
                name="passType"
                label={t('PASS_TYPE')}
                extra={<Text className={styles.helpText}> {t('PASS_TYPE_HELP_TEXT')} </Text>}
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
                id="videoList"
                name="videoList"
                label={t('APPLY_TO_VIDEOS')}
                extra={<Text className={styles.helpText}> {t('APPLY_TO_VIDEOS_HELP_TEXT')} </Text>}
              >
                <Select
                  showArrow
                  showSearch={false}
                  placeholder={t('SELECT_YOUR_VIDEOS')}
                  mode="multiple"
                  maxTagCount={2}
                  value={selectedVideos}
                  onChange={(val) => setSelectedVideos(val)}
                  optionLabelProp="label"
                >
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> {t('VISIBLE_PUBLICLY')} </Text>}
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
                              {video.currency?.toUpperCase()} {video.price}
                            </Col>
                          </Row>
                        </Select.Option>
                      ))}
                    {videos?.filter((video) => video.is_published).length <= 0 && (
                      <Text disabled> {t('NO_PUBLISHED_VIDEOS')} </Text>
                    )}
                  </Select.OptGroup>
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> {t('HIDDEN_FROM_EVERYONE')} </Text>}
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
                              {video.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {video.title}
                            </>
                          }
                        >
                          <Row gutter={[8, 8]}>
                            <Col xs={17} className={styles.productName}>
                              {video.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {video.title}
                            </Col>
                            <Col xs={7} className={styles.textAlignRight}>
                              {video.currency?.toUpperCase()} {video.price}
                            </Col>
                          </Row>
                        </Select.Option>
                      ))}
                    {videos?.filter((video) => !video.is_published).length <= 0 && (
                      <Text disabled> {t('NO_UNPUBLISHED_VIDEOS')} </Text>
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
                    id="validity"
                    name="validity"
                    label={`${t('PASS_VALIDITY')} (${t('DAYS')})`}
                    extra={<Text className={styles.helpText}>{t('PASS_VALIDITY_HELP_TEXT')}</Text>}
                    rules={validationRules.numberValidation(t('PASS_VALIDITY_ERROR_TEXT'), 1, false)}
                  >
                    <InputNumber min={1} placeholder={t('PASS_VALIDITY')} className={styles.numericInput} />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    id="price"
                    name="price"
                    label={t('PASS_PRICE')}
                    rules={validationRules.numberValidation(t('PASS_PRICE_ERROR_TEXT'), 0, false)}
                  >
                    <InputNumber min={0} placeholder={t('PASS_PRICE')} className={styles.numericInput} />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    id="classCount"
                    name="classCount"
                    label={t('PASS_CREDITS')}
                    extra={<Text className={styles.helpText}>{t('PASS_CREDITS_HELP_TEXT')}</Text>}
                    rules={[
                      {
                        required: true,
                        validator: (_, value) => {
                          if (passType === passTypes.LIMITED.name && !value) {
                            return Promise.reject(t('PASS_CREDITS_ERROR_TEXT'));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber
                      disabled={passType === passTypes.UNLIMITED.name}
                      min={1}
                      placeholder={t('AMOUNT_OF_CREDITS')}
                      className={styles.numericInput}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
            <Col xs={24} md={{ span: 11, offset: 1 }}>
              <Form.Item name="colorCode" label={t('COLOR_CODE')}>
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
                {t('CANCEL')}
              </Button>
            </Col>
            <Col xs={12} md={6}>
              <Button block type="primary" htmlType="submit" loading={isSubmitting}>
                {editedPass ? t('UPDATE') : t('CREATE')} {t('PASS')}
              </Button>
            </Col>
          </Row>
        </Form>
      </Loader>
    </Modal>
  );
};

export default CreatePassModal;
