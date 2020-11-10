import React, { useState } from 'react';
import classNames from 'classnames';
import { Upload, message } from 'antd';
import ImgCrop from 'antd-img-crop';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';

import apis from 'apis';

import styles from './styles.module.scss';

const ImageUpload = ({
  value,
  label,
  onChange,
  showUploadList = false,
  multiple = false,
  name,
  aspect = 1,
  className,
}) => {
  const [loading] = useState(false);

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

  const handleImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apis.user.uploadImage(formData);
      onChange(data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  return (
    <ImgCrop shape="rect" aspect={aspect}>
      <Upload
        className={className}
        listType="picture-card"
        name={name}
        multiple={multiple}
        action={handleImageUpload}
        beforeUpload={beforeUpload}
        showUploadList={showUploadList}
      >
        {value ? (
          <img src={value} alt={label} className={classNames(styles.w100, styles.image)} />
        ) : (
          <div>
            {loading ? <LoadingOutlined /> : <PlusOutlined />}
            <div className={styles.mt10}>{label}</div>
          </div>
        )}
      </Upload>
    </ImgCrop>
  );
};
export default ImageUpload;
