import jwt from 'jsonwebtoken';

export const signToken = (id) => {
  return jwt.sign({ id }, process.env.MYCODE, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.MYCODE);
};