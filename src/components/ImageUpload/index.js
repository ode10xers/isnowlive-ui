import React, { useState } from 'react';
import classNames from 'classnames';
import { Upload, Row, Col, message } from 'antd';
// import ImgCrop from 'antd-img-crop';
import ImgCrop from '@hugorezende/antd-img-crop';
import { PlusOutlined } from '@ant-design/icons';

import apis from 'apis';

import Loader from 'components/Loader';

import styles from './styles.module.scss';

const ImageUpload = ({
  value,
  label,
  onChange,
  listType = 'picture-card',
  showUploadList = false,
  multiple = false,
  name,
  aspect = 2.7015 / 1,
  overlayHelpText = 'Click here to change the image',
  className,
  shape = 'rect',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    const isValidFileSize = file.size / 1024 / 1024 < 2;
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
    }
    if (!isValidFileSize) {
      message.error('Image must smaller than 2MB!');
    }
    return isJpgOrPng && isValidFileSize;
  };

  const handleImageUpload = async (fileData) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      // const reducer = ImageBlobReduce();
      // const reducedImageFile = await reducer.toBlob(fileData.file, { max: 600 });
      // formData.append('file', new File([reducedImageFile], fileData.file.name, { lastModified: new Date() }));
      formData.append('file', fileData.file);
      const { data } = await apis.user.uploadImage(formData);
      onChange(data);
      // Fix for scroll issue after image upload
      document.getElementsByClassName('ant-scrolling-effect')[0].style.overflow = 'auto';
    } catch (error) {
      if (error.response?.data?.message) {
        message.error(error.response?.data?.message);
      }
    }
    setIsLoading(false);
  };

  const handleOnChange = (values) => {
    console.log('On Change Handler');
    console.log(values);
  };

  return (
    <ImgCrop shape={shape} aspect={aspect} modalOk="Confirm Image" resizeMaxSize={1080}>
      <Upload
        className={classNames(className, value ? styles.hideBorder : styles.showBorder)}
        listType={listType}
        name={name}
        multiple={multiple}
        customRequest={handleImageUpload}
        beforeUpload={beforeUpload}
        showUploadList={showUploadList}
        onChange={handleOnChange}
      >
        <Loader loading={isLoading} text="Uploading new image...">
          {value ? (
            <div className={styles.imageContainer}>
              <Row
                className={classNames(styles.imageHoverOverlay, shape === 'round' ? styles.roundImage : undefined)}
                justify="center"
                align="middle"
              >
                <Col className={styles.helpText}>{overlayHelpText}</Col>
              </Row>
              <img
                src={value}
                alt={label}
                className={classNames(styles.w100, styles.image, shape === 'round' ? styles.roundImage : undefined)}
              />
            </div>
          ) : (
            <div>
              <PlusOutlined />
              <div className={styles.mt10}>{label}</div>
            </div>
          )}
        </Loader>
      </Upload>
    </ImgCrop>
  );
};
export default ImageUpload;
