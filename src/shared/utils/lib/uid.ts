export const uid = () => {
  return Math.random().toString(36).substring(2, 9);
};
