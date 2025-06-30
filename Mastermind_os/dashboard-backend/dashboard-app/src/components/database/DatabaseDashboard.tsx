import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Database, 
  Server, 
  BarChart3, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  FileText, 
  Table 
} from 'lucide-react';

// Types
interface DatabaseStatus {
  connected: boolean;
  version?: string;
  error?: string;
}

interface AllDatabaseStatus {
  [key: string]: DatabaseStatus;
}

// Mock data for demonstration if API isn't available
const MOCK_DATA = {
  dbStatus: {
    mastermindDb: { connected: true, version: "PostgreSQL 15.3" },
    neuralDbApp: { connected: true, version: "PostgreSQL 15.3" },
    quadraticDb: { connected: false, error: "Connection timeout" },
    codexDocDb: { connected: true, version: "PostgreSQL 15.3" },
    codexMemoryDb: { connected: true, version: "PostgreSQL 15.3" }
  },
  tables: [
    { table_name: "system_tools", table_type: "BASE TABLE" },
    { table_name: "tool_usage_logs", table_type: "BASE TABLE" },
    { table_name: "database_connections", table_type: "BASE TABLE" },
    { table_name: "communication_test", table_type: "BASE TABLE" },
    { table_name: "communication_bridge", table_type: "BASE TABLE" },
    { table_name: "vector_store", table_type: "BASE TABLE" },
    { table_name: "available_tools", table_type: "VIEW" },
    { table_name: "mastermind_troubleshooting_view", table_type: "VIEW" }
  ]
};

const DatabaseDashboard: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<AllDatabaseStatus>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [tablesLoading, setTablesLoading] = useState<boolean>(false);
  const [useMockData, setUseMockData] = useState<boolean>(false);

  // Load database status on component mount
  useEffect(() => {
    fetchDatabaseStatus();
  }, []);

  // Fetch database status
  const fetchDatabaseStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (useMockData) {
        // Use mock data for demonstration
        setDbStatus(MOCK_DATA.dbStatus);
      } else {
        const response = await axios.get('/api/neon/status');
        setDbStatus(response.data.status);
      }
    } catch (err) {
      console.error('Error fetching database status:', err);
      setError('Failed to fetch database status. Using mock data instead.');
      setDbStatus(MOCK_DATA.dbStatus);
      setUseMockData(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tables for a specific database
  const fetchTables = async (database: string) => {
    setTablesLoading(true);
    setSelectedDb(database);
    
    try {
      if (useMockData) {
        // Use mock data for demonstration
        setTables(MOCK_DATA.tables);
      } else {
        const response = await axios.get(`/api/neon/tables/${database}`);
        setTables(response.data.tables);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
      setTables(MOCK_DATA.tables);
      setUseMockData(true);
    } finally {
      setTablesLoading(false);
    }
  };

  // Handle database click
  const handleDbClick = (dbName: string) => {
    fetchTables(dbName);
  };

  // Toggle between real and mock data
  const toggleMockData = () => {
    setUseMockData(!useMockData);
    if (!useMockData) {
      setDbStatus(MOCK_DATA.dbStatus);
      if (selectedDb) setTables(MOCK_DATA.tables);
    } else {
      fetchDatabaseStatus();
      if (selectedDb) fetchTables(selectedDb);
    }
  };

  return (
    <div className="relative bg-gray-900 min-h-screen text-white overflow-hidden">
      {/* Grid background */}
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, #2d3748 1px, transparent 1px), 
                           linear-gradient(to bottom, #2d3748 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Glow overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-pink-500/20 to-transparent z-0" />
      
      <div className="relative z-10 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Database size={32} className="text-cyan-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-transparent">
              Database Dashboard
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={fetchDatabaseStatus} 
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-cyan-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            
            <button
              onClick={toggleMockData}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                useMockData 
                  ? 'bg-yellow-700/30 text-yellow-300 border border-yellow-700' 
                  : 'bg-green-700/30 text-green-300 border border-green-700'
              }`}
            >
              {useMockData ? 'Using Mock Data' : 'Using Live Data'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/40 border border-red-500 rounded-lg flex items-center text-red-200">
            <AlertCircle className="mr-2 text-red-400" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin text-cyan-400">
              <RefreshCw size={32} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Database List */}
            <div className="lg:col-span-4 space-y-4">
              <h2 className="text-xl font-semibold text-pink-300 mb-4 flex items-center">
                <Server size={20} className="mr-2" />
                Database Connections
              </h2>
              
              <div className="space-y-4">
                {Object.entries(dbStatus).map(([dbName, status]) => (
                  <div 
                    key={dbName}
                    onClick={() => handleDbClick(dbName)}
                    className={`
                      relative rounded-lg p-4 cursor-pointer transition-all duration-200
                      ${selectedDb === dbName 
                        ? 'bg-gradient-to-r from-pink-900/40 to-cyan-900/40 border border-pink-500/50' 
                        : 'bg-gray-800/60 hover:bg-gray-800/80 border border-gray-700/50'}
                    `}
                  >
                    {/* Glow effect for selected item */}
                    {selectedDb === dbName && (
                      <div className="absolute inset-0 rounded-lg shadow-[0_0_15px_rgba(236,72,153,0.3)] pointer-events-none" />
                    )}
                    
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-lg">
                        <span 
                          className={selectedDb === dbName 
                            ? "bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent" 
                            : "text-gray-100"
                          }
                        >
                          {dbName}
                        </span>
                      </div>
                      
                      {status.connected ? (
                        <CheckCircle2 className="text-green-400" size={20} />
                      ) : (
                        <AlertCircle className="text-red-400" size={20} />
                      )}
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-400">
                      {status.connected ? (
                        <div className="flex flex-col">
                          <span className="text-cyan-300">{status.version?.split(' ')[0]}</span>
                          <span className="text-xs opacity-70 mt-1 truncate">
                            {status.version?.substring(status.version.indexOf('('))}
                          </span>
                        </div>
                      ) : (
                        <span className="text-red-300">{status.error}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Database Details */}
            <div className="lg:col-span-8">
              {selectedDb ? (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-cyan-300 mb-4 flex items-center">
                    <Table size={20} className="mr-2" />
                    {selectedDb} Tables
                  </h2>
                  
                  {tablesLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin text-cyan-400">
                        <RefreshCw size={24} />
                      </div>
                    </div>
                  ) : (
                    <>
                      {tables.length === 0 ? (
                        <div className="text-center p-8 bg-gray-800/40 rounded-lg border border-gray-700/50">
                          <FileText size={32} className="mx-auto mb-4 text-gray-500" />
                          <p className="text-gray-400">No tables found</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {tables.map((table, index) => (
                            <div 
                              key={index}
                              className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50 hover:border-cyan-500/30 transition-colors"
                            >
                              <div className="flex items-center space-x-2">
                                <div 
                                  className={`w-2 h-2 rounded-full ${
                                    table.table_type === 'BASE TABLE' 
                                      ? 'bg-pink-500' 
                                      : 'bg-cyan-500'
                                  }`} 
                                />
                                <span className="font-medium text-white">{table.table_name}</span>
                              </div>
                              <div className="mt-2 text-xs text-gray-400">
                                {table.table_type}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Database Stats */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-pink-300 mb-4 flex items-center">
                      <BarChart3 size={18} className="mr-2" />
                      Database Statistics
                    </h3>
                    
                    <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-md bg-gray-800/80">
                          <div className="text-sm text-gray-400">Tables</div>
                          <div className="text-2xl font-bold text-pink-300">{tables.length}</div>
                        </div>
                        
                        <div className="p-4 rounded-md bg-gray-800/80">
                          <div className="text-sm text-gray-400">Views</div>
                          <div className="text-2xl font-bold text-cyan-300">
                            {tables.filter(t => t.table_type === 'VIEW').length}
                          </div>
                        </div>
                        
                        <div className="p-4 rounded-md bg-gray-800/80">
                          <div className="text-sm text-gray-400">Status</div>
                          <div className="text-lg font-bold text-green-300">Active</div>
                        </div>
                        
                        <div className="p-4 rounded-md bg-gray-800/80">
                          <div className="text-sm text-gray-400">Version</div>
                          <div className="text-lg font-bold text-cyan-300">
                            {dbStatus[selectedDb]?.version?.split(' ')[0] || 'Unknown'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Retro bar chart */}
                      <div className="mt-6">
                        <div className="mb-2 text-sm text-gray-400">Table Distribution</div>
                        <div className="flex items-end space-x-1 h-24">
                          {/* We'll create bars with different heights based on the count of table types */}
                          <div className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-full bg-gradient-to-t from-pink-600 to-pink-400 rounded-t"
                              style={{ 
                                height: `${Math.min(100, (tables.filter(t => t.table_type === 'BASE TABLE').length / tables.length) * 100)}%`,
                                boxShadow: '0 0 10px rgba(236,72,153,0.5)'
                              }}
                            ></div>
                            <div className="mt-2 text-xs text-gray-400">Tables</div>
                          </div>
                          
                          <div className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t"
                              style={{ 
                                height: `${Math.min(100, (tables.filter(t => t.table_type === 'VIEW').length / tables.length) * 100)}%`,
                                boxShadow: '0 0 10px rgba(6,182,212,0.5)'
                              }}
                            ></div>
                            <div className="mt-2 text-xs text-gray-400">Views</div>
                          </div>
                          
                          <div className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t"
                              style={{ 
                                height: `${Math.min(100, (tables.filter(t => t.table_name.includes('system')).length / tables.length) * 100)}%`,
                                boxShadow: '0 0 10px rgba(168,85,247,0.5)'
                              }}
                            ></div>
                            <div className="mt-2 text-xs text-gray-400">System</div>
                          </div>
                          
                          <div className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                              style={{ 
                                height: `${Math.min(100, (tables.filter(t => !t.table_name.includes('system') && t.table_type === 'BASE TABLE').length / tables.length) * 100)}%`,
                                boxShadow: '0 0 10px rgba(96,165,250,0.5)'
                              }}
                            ></div>
                            <div className="mt-2 text-xs text-gray-400">Other</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-800/40 rounded-lg border border-gray-700/50 p-12">
                  <div className="text-center">
                    <Database size={48} className="mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400">Select a database to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseDashboard;
