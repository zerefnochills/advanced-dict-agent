export interface User {
  name?: string;
  email: string;
  password: string;
}

export const signupUser = (user: User) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const loginUser = (email: string, password: string): boolean => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return false;

  const user: User = JSON.parse(storedUser);
  return user.email === email && user.password === password;
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("auth");
};

export const setAuthenticated = () => {
  localStorage.setItem("auth", "true");
};

export const logout = () => {
  localStorage.removeItem("auth");
};
