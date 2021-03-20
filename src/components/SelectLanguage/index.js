import React from 'react';
import { Select } from 'antd';
import i18next from 'i18next';
import { getLanguage, setLanguage } from 'utils/storage';

const { Option } = Select;

const SelectLanguage = ({ className }) => {
  function handleChange(value) {
    i18next.changeLanguage(value);
    setLanguage(value);
  }
  return (
    <Select className={className || 'w100'} defaultValue={getLanguage()} onChange={handleChange}>
      <Option value="en">English</Option>
      <Option value="hi">हिन्दी</Option>
    </Select>
  );
};

export default SelectLanguage;
