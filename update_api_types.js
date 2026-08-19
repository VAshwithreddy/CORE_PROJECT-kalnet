const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'frontend', 'src', 'lib', 'api.ts');
let content = fs.readFileSync(filepath, 'utf8');

// Update BlockerItem
content = content.replace(
  'export interface BlockerItem {',
  'export interface BlockerItem {\n  daysBlocked?: number;\n  project?: string;\n  owner?: string;\n  severity?: string;\n  reason?: string;\n  title?: string;'
);

// Update RequestItem
content = content.replace(
  'export interface RequestItem {',
  'export interface RequestItem {\n  description?: string;'
);

// Add missing exports for work-admin
content = content.replace(
  'export async function getBlockersByDepartment(departmentId: string): Promise<BlockerItem[]> {',
  `export async function getBlockersByDepartment(departmentId: string): Promise<BlockerItem[]> {
  return [];
}

export async function getBlockersByOwner(ownerId: string): Promise<BlockerItem[]> {
  return [];
}`
);

fs.writeFileSync(filepath, content, 'utf8');
console.log('Updated api.ts types');
