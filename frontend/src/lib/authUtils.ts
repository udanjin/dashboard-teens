import { jwtDecode } from 'jwt-decode'; // Lebih aman menggunakan library

// Tentukan tipe data untuk hasil decode token
interface DecodedToken {
  name: string;
  id: number;
  username: string;
  roles: string[];
  grade:number,
  gender:string,
  iat: number;
  exp: number;
}

const TOKEN_NAME = 'authToken';
// Set token untuk 1 hari
const TOKEN_EXPIRATION_SECONDS = 24 * 60 * 60; 

export const setToken = (token: string) => {
  // Opsi secure hanya akan bekerja di HTTPS
  const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
  document.cookie = `${TOKEN_NAME}=${token}; path=/; max-age=${TOKEN_EXPIRATION_SECONDS}; ${secureFlag} SameSite=Strict;`;
};

export const getToken = (): string | null => {
  const cookie = document.cookie.split("; ").find(row => row.startsWith(`${TOKEN_NAME}=`));
  return cookie ? cookie.split("=")[1] : null;
};

export const removeToken = () => {
  document.cookie = `${TOKEN_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
};

// Menggunakan library jwt-decode lebih disarankan daripada atob manual
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    if (!token) return null;
    return jwtDecode<DecodedToken>(token);
  } catch (error) {
    console.error("Failed to decode token:", error);
    removeToken(); // Hapus token yang rusak
    return null;
  }
};