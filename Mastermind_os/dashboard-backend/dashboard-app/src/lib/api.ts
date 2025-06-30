import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Error handling
const handleError = (error: any) => {
  if (error.response) {
    // The request was made and the server responded with an error status
    console.error('API Error:', error.response.data);
    return {
      error: error.response.data.detail || error.response.data.message || 'An error occurred',
      status: error.response.status
    };
  } else if (error.request) {
    // The request was made but no response was received
    console.error('API Request Error:', error.request);
    return {
      error: 'No response received from server',
      status: 0
    };
  } else {
    // Something else caused the error
    console.error('API Setup Error:', error.message);
    return {
      error: error.message,
      status: 0
    };
  }
};

// Database APIs
export const databaseApi = {
  // Get status of all databases
  getStatus: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/neon/status`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // List tables in a database
  listTables: async (database: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/neon/tables/${database}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Get table schema
  getTableSchema: async (database: string, table: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/neon/schema/${database}/${table}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Execute SQL query
  executeQuery: async (query: string, params?: any[], database: string = 'mastermindDb') => {
    try {
      const response = await axios.post(`${API_BASE_URL}/neon/query`, {
        query,
        params,
        database
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Execute SQL transaction
  executeTransaction: async (statements: string[], params_list?: any[][], database: string = 'mastermindDb') => {
    try {
      const response = await axios.post(`${API_BASE_URL}/neon/transaction`, {
        statements,
        params_list,
        database
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Execute cross-database query
  executeCrossQuery: async (query: string, databases?: string[]) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/neon/cross-query`, {
        query,
        databases
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Setup system tools
  setupSystemTools: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/neon/setup/system-tools`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Setup database connections
  setupDatabaseConnections: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/neon/setup/database-connections`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Setup vector store
  setupVectorStore: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/neon/setup/vector-store`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Test connection
  testConnection: async (source_db: string, destination_db: string, message: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/neon/connection-test`, {
        source_db,
        destination_db,
        message
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// Vector API
export const vectorApi = {
  // Search vector store
  search: async (text: string, metadata_filter?: any, similarity_threshold: number = 0.7, max_results: number = 10) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/neon/vector/search`, {
        text,
        metadata_filter,
        similarity_threshold,
        max_results
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Add to vector store
  add: async (text: string, metadata?: any) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/neon/vector/add`, {
        text,
        metadata
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// System API
export const systemApi = {
  // Initialize the system
  initialize: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/initialize`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Get system status
  getStatus: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/system/status`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Connect to Neon
  connectNeon: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/connect-neon`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// Combined API
export const api = {
  database: databaseApi,
  vector: vectorApi,
  system: systemApi
};

export default api;
