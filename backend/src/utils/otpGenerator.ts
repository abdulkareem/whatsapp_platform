export const generateOTP = (length = 6): string => {
  let code = '';
  for (let index = 0; index < length; index += 1) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
};
