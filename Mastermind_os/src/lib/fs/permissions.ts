import { z } from 'zod';
import type { FilePermissions } from '../ai/types';

const defaultBlockedPaths = [
  '/etc/passwd',
  '/etc/shadow',
  '/etc/sudoers',
  '/usr/bin',
  '/var/lib',
  '/sys',
  '/proc',
  '/.git',
  'node_modules',
];

const defaultAllowedPaths = [
  '/home/project',
  './src',
  './public',
];

export const filePermissionsSchema = z.object({
  read: z.boolean(),
  write: z.boolean(),
  allowedPaths: z.array(z.string()),
  blockedPaths: z.array(z.string()),
  maxFileSize: z.number(),
  allowedExtensions: z.array(z.string()),
  requireBackup: z.boolean(),
  checksum: z.boolean(),
});

export function validatePath(path: string, permissions: FilePermissions): boolean {
  const normalizedPath = path.toLowerCase();
  
  // Always block critical system paths
  if (defaultBlockedPaths.some(blocked => 
    normalizedPath.includes(blocked.toLowerCase())
  )) {
    return false;
  }

  // Check if path is in allowed paths
  const isAllowed = permissions.allowedPaths.some(allowed => 
    normalizedPath.startsWith(allowed.toLowerCase())
  );

  // Check if path is in blocked paths
  const isBlocked = permissions.blockedPaths.some(blocked => 
    normalizedPath.includes(blocked.toLowerCase())
  );

  return isAllowed && !isBlocked;
}

export function createDefaultPermissions(): FilePermissions {
  return {
    read: true,
    write: true,
    allowedPaths: defaultAllowedPaths,
    blockedPaths: defaultBlockedPaths,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.txt', '.json', '.js', '.ts', '.jsx', '.tsx', '.css', '.md'],
    requireBackup: true,
    checksum: true,
  };
}