import React from 'react';
import { Table as AntTable } from 'antd';
import { useTranslation } from 'react-i18next';

const Table = ({ columns, data, loading, ...props }) => {
  const { t } = useTranslation();

  return (
    <AntTable
      {...props}
      columns={columns}
      dataSource={data}
      pagination={false}
      loading={loading}
      locale={{ emptyText: t('NO_DATA_FOUND') }}
    />
  );
};

export default Table;
