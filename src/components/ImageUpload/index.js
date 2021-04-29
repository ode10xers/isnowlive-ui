import React, { useState } from 'react';
import classNames from 'classnames';
import { Upload, message } from 'antd';
import ImgCrop from 'antd-img-crop';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
// import ImageBlobReduce from 'image-blob-reduce';

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

  const handleImageUpload = async (fileData) => {
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
  };

  return (
    <ImgCrop shape="rect" aspect={aspect}>
      <Upload
        className={classNames(className, value ? styles.hideBorder : styles.showBorder)}
        listType="picture-card"
        name={name}
        multiple={multiple}
        customRequest={handleImageUpload}
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
