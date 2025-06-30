import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface MCPServer {
  id: string;
  name: string;
  path: string;
  package: {
    name: string;
    main: string;
    [key: string]: any;
  };
  process?: ChildProcess;
  status: 'stopped' | 'starting' | 'running' | 'error';
  services?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export class MCPDirectoryScanner {
  private servers: Map<string, MCPServer> = new Map();

  getServer(serverId: string): MCPServer | undefined {
    return this.servers.get(serverId);
  }

  async queryServer(serverId: string, query: any): Promise<any> {
    const server = this.getServer(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }
    // TODO: Implement actual server query logic
    return { status: 'success', serverId, query };
  }

  async findServers(): Promise<MCPServer[]> {
    const mcpPaths = [
      path.join(process.env.HOME || '', 'Documents', 'Cline', 'MCP'),
      path.join(__dirname, '..', '..', 'mcp-servers')
    ];

    for (const mcpPath of mcpPaths) {
      if (fs.existsSync(mcpPath)) {
        const dirs = fs.readdirSync(mcpPath, { withFileTypes: true });
        for (const dir of dirs) {
          if (dir.isDirectory()) {
            const serverPath = path.join(mcpPath, dir.name);
            const packagePath = path.join(serverPath, 'package.json');
            
            if (fs.existsSync(packagePath)) {
              const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
              if (pkg.name && pkg.main) {
                const serverId = `mcp:${pkg.name}`;
                this.servers.set(serverId, {
                  id: serverId,
                  name: pkg.name,
                  path: serverPath,
                  package: pkg,
                  status: 'stopped'
                });
              }
            }
          }
        }
      }
    }

    return Array.from(this.servers.values());
  }

  async startServer(serverId: string): Promise<MCPServer> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    server.status = 'starting';
    const child = spawn('node', [path.join(server.path, server.package.main)], {
      cwd: server.path,
      stdio: 'pipe'
    });

    server.process = child;
    server.status = 'running';

    child.on('error', (err) => {
      server.status = 'error';
      console.error(`Server ${serverId} error:`, err);
    });

    child.on('exit', (code) => {
      server.status = code === 0 ? 'stopped' : 'error';
      console.log(`Server ${serverId} exited with code ${code}`);
    });

    return server;
  }
}
