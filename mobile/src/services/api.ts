import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(async (config) => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          SecureStore.deleteItemAsync('auth_token');
          SecureStore.deleteItemAsync('auth_user');
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    if (response.data?.token) {
      await SecureStore.setItemAsync('auth_token', response.data.token);
      await SecureStore.setItemAsync('auth_user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async register(name: string, email: string, password: string) {
    const response = await this.client.post('/auth/register', { name, email, password });
    if (response.data?.token) {
      await SecureStore.setItemAsync('auth_token', response.data.token);
      await SecureStore.setItemAsync('auth_user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async logout() {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('auth_user');
  }

  async getDashboard() {
    const response = await this.client.get('/dashboard/my');
    return response.data;
  }

  async getActionItems() {
    const response = await this.client.get('/action-items/my');
    return response.data;
  }

  async updateActionItemStatus(id: string, status: string) {
    const response = await this.client.patch(`/action-items/${id}/status`, { status });
    return response.data;
  }

  async getTeams() {
    const response = await this.client.get('/teams');
    return response.data;
  }

  async getToken() {
    return await SecureStore.getItemAsync('auth_token');
  }

  async getUser() {
    const userStr = await SecureStore.getItemAsync('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const apiService = new ApiService();
