import React from 'react';
import { Table as AntTable } from 'antd';

const Table = ({ columns, data, loading, ...props }) => (
  <AntTable {...props} columns={columns} dataSource={data} pagination={false} loading={loading} />
);

export default Table;
