import React, { useState } from 'react';
import { Upload, message } from 'antd';
import ImgCrop from 'antd-img-crop';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
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
  const [loading, setLoading] = useState(false);

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

  return (
    <ImgCrop shape="rect" aspect={aspect}>
      <Upload
        className={className}
        listType="picture-card"
        name={name}
        multiple={multiple}
        action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
        onChange={onChange}
        beforeUpload={beforeUpload}
        showUploadList={showUploadList}
        value={value}
        label={label}
      >
        {value ? (
          <img src={value} alt="avatar" className={styles.w100} />
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
