export const getSession = () => {
  try {
    const raw = localStorage.getItem("ludo_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setSession = (session) => {
  localStorage.setItem("ludo_user", JSON.stringify(session));
};

export const clearSession = () => {
  localStorage.removeItem("ludo_user");
};