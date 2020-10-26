import React from 'react';
import { Upload, message, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

import apis from 'apis';

const FileUpload = ({ name, value, onChange, listType, label }) => {
  const handleAction = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apis.user.uploadFile(formData);
      onChange(data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  return (
    <Upload name={name} action={handleAction} url={value} listType={listType}>
      <Button icon={<UploadOutlined />}>{label}</Button>
    </Upload>
  );
};

export default FileUpload;
