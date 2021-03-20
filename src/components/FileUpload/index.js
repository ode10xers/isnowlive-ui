import React from 'react';
import { Upload, message, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import apis from 'apis';

const FileUpload = ({ name, value, onChange, listType, label }) => {
  const { t: translate } = useTranslation();
  const handleAction = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apis.user.uploadFile(formData);
      onChange(data);
    } catch (error) {
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
    }
  };

  return (
    <Upload name={name} action={handleAction} url={value} listType={listType} fileList={[]}>
      <Button icon={<UploadOutlined />}>{label}</Button>
    </Upload>
  );
};

export default FileUpload;
