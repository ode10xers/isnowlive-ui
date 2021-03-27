import { i18n } from 'utils/i18n';

const validationRules = {
  nameValidation: [{ required: true, message: i18n.t('NAME_VALIDATION_MESSAGE') }],
  publicUrlValidation: [
    { required: true, message: i18n.t('PUBLIC_URL_REQUIRED_VALIDATION_MESSAGE') },
    {
      pattern: new RegExp('^[a-z]*$'),
      message: i18n.t('PUBLIC_URL_LOWERCASE_VALIDATION_MESSAGE'),
    },
  ],
  emailValidation: [{ type: 'email', required: true, message: i18n.t('EMAIL_REQUIRED_VALIDATION_MESSAGE') }],
  passwordValidation: [{ required: true, message: i18n.t('PASSWORD_REQUIRED_VALIDATION_MESSAGE') }],
  requiredValidation: [{ required: true, message: i18n.t('FIELD_REQUIRED_VALIDATION_MESSAGE') }],
  arrayValidation: [
    {
      type: 'array',
      required: true,
      message: i18n.t('ARRAY_REQUIRED_VALIDATION_MESSAGE'),
      min: 1,
      // validator: (_, value) => (value.length > 0 ? Promise.resolve() : Promise.reject('Select at least one item')),
    },
  ],
  numberValidation: (message, min = 0, maxLimited = true, max = 10000) => {
    const errorMessage = message || `${i18n.t('NUMBER_RANGE_DEFAULT_VALIDATION_MESSAGE')} (${min} - ${max})`;
    const invalidValue = (value) => value === undefined || value === null || value < min || (maxLimited && value > max);

    return [
      {
        required: true,
        message: errorMessage,
        validator: (_, value) => (invalidValue(value) ? Promise.reject(errorMessage) : Promise.resolve()),
      },
    ];
  },
  discountCodeValidation: [
    {
      required: true,
      message: i18n.t('DISCOUNT_CODE_REQUIRED_VALIDATION_MESSAGE'),
    },
    {
      pattern: new RegExp('^[a-zA-Z0-9]*$'),
      message: i18n.t('DISCOUNT_CODE_FORMAT_VALIDATION_MESSAGE'),
    },
  ],
};

export default validationRules;
