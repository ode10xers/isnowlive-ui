import React from 'react';
import { Table as AntTable } from 'antd';
import { i18n } from 'utils/i18n';

const Table = ({ columns, data, loading, ...props }) => (
  <AntTable
    {...props}
    columns={columns}
    dataSource={data}
    pagination={false}
    loading={loading}
    locale={{ emptyText: i18n.t('NO_DATA_FOUND') }}
  />
);

export default Table;
