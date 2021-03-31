import React, { useState } from 'react';
import { Upload, message, Button } from 'antd';
import { EditOutlined, UploadOutlined } from '@ant-design/icons';

import apis from 'apis';

const FileUpload = ({ name, value, onChange, listType, label, isEdit = false }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (file) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apis.user.uploadFile(formData);
      onChange(data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  };

  return (
    <Upload name={name} action={handleAction} url={value} listType={listType} fileList={[]}>
      <Button
        loading={isLoading}
        icon={isEdit ? <EditOutlined /> : <UploadOutlined />}
        type={isEdit ? 'primary' : 'default'}
      >
        {label}
      </Button>
    </Upload>
  );
};

export default FileUpload;
