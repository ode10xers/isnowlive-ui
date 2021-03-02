const validationRules = {
  nameValidation: [{ required: true, message: 'Please input name' }],
  publicUrlValidation: [
    { required: true, message: 'Please input public URL' },
    {
      pattern: new RegExp('^[a-zA-Z]*$'),
      message: 'field does not accept numbers and special characters',
    },
  ],
  emailValidation: [{ type: 'email', required: true, message: 'Please input your email' }],
  passwordValidation: [{ required: true, message: 'Please input your password' }],
  requiredValidation: [{ required: true, message: 'This field is required.' }],
  arrayValidation: [
    {
      type: 'array',
      required: true,
      message: 'Please select min. one item',
      min: 1,
      // validator: (_, value) => (value.length > 0 ? Promise.resolve() : Promise.reject('Select at least one item')),
    },
  ],
  numberValidation: (message, min = 0, maxLimited = true, max = 10000) => {
    const errorMessage = message || `Please input valid amount (${min} - ${max})`;
    const invalidValue = (value) => value === undefined || value === null || value < min || (maxLimited && value > max);

    return [
      {
        required: true,
        message: errorMessage,
        validator: (_, value) => (invalidValue(value) ? Promise.reject(errorMessage) : Promise.resolve()),
      },
    ];
  },
};

export default validationRules;
