export type UserDto = {
  id: string;
  email: string;
  name: string;
};

export type AuthSessionDto = {
  token: string;
  user: UserDto;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  name: string;
};
