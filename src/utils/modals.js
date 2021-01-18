import { Modal } from 'antd';

export const showErrorModal = (title, message = '') => {
  Modal.error({
    title: title || 'Something wrong occured',
    message: message,
  });
};
