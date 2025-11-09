/**
 * File System Constants
 * Shared constants for file system operations
 */

/**
 * Maximum file size for reading (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Maximum number of files to return per request
 */
export const MAX_FILES_PER_REQUEST = 1000

/**
 * Maximum directory depth for recursive operations
 */
export const MAX_DIRECTORY_DEPTH = 10

/**
 * Backup file extension
 */
export const BACKUP_EXTENSION = '.backup'

/**
 * Default file encoding
 */
export const DEFAULT_ENCODING: BufferEncoding = 'utf-8'

/**
 * Debounce time for file watcher (ms)
 */
export const WATCHER_DEBOUNCE_MS = 100

/**
 * Sensitive file/directory patterns to block access
 * These patterns will be matched against both path and filename
 */
export const BLOCKED_PATTERNS = [
  // Environment and secrets
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  '.env.test',
  '*.pem',
  '*.key',
  '*.cert',
  'secrets.json',
  'credentials.json',

  // Git
  '.git',
  '.gitignore',

  // Dependencies and build artifacts
  'node_modules',
  '.next',
  '.nuxt',
  'dist',
  'build',
  'out',
  '.cache',
  '.turbo',

  // IDE and system
  '.vscode',
  '.idea',
  '.DS_Store',
  'Thumbs.db',

  // Database
  '*.db',
  '*.sqlite',
  '*.sqlite3',

  // Logs
  '*.log',
  'logs',

  // Package manager
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
]

/**
 * Patterns to exclude from directory structure
 * These are typically large or irrelevant directories
 */
export const EXCLUDED_PATTERNS = [
  'node_modules/**',
  '.git/**',
  '.next/**',
  'dist/**',
  'build/**',
  'out/**',
  'coverage/**',
  '.cache/**',
  '.turbo/**',
]

/**
 * Common text file extensions
 */
export const TEXT_FILE_EXTENSIONS = new Set([
  // Code
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.rb', '.php', '.java', '.c', '.cpp', '.cs', '.go', '.rs',
  '.swift', '.kt', '.scala', '.sh', '.bash', '.zsh',

  // Markup and data
  '.html', '.htm', '.xml', '.svg',
  '.json', '.yaml', '.yml', '.toml', '.ini', '.conf', '.config',

  // Documentation
  '.md', '.markdown', '.txt', '.rst',

  // Styles
  '.css', '.scss', '.sass', '.less', '.styl',

  // Other
  '.sql', '.graphql', '.proto', '.prisma',
  '.env.example', '.gitignore', '.dockerignore',
])

/**
 * Binary file extensions (non-exhaustive list of common types)
 */
export const BINARY_FILE_EXTENSIONS = new Set([
  // Images
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.ico', '.svg',

  // Documents
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',

  // Archives
  '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar',

  // Executables
  '.exe', '.dll', '.so', '.dylib', '.bin',

  // Media
  '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.wav',

  // Fonts
  '.ttf', '.otf', '.woff', '.woff2', '.eot',

  // Other
  '.db', '.sqlite', '.sqlite3',
])

/**
 * File type to icon mapping
 */
export const FILE_TYPE_ICONS: Record<string, string> = {
  // Folders
  directory: 'folder',

  // JavaScript/TypeScript
  '.js': 'file-code',
  '.jsx': 'file-code',
  '.ts': 'file-code',
  '.tsx': 'file-code',
  '.mjs': 'file-code',
  '.cjs': 'file-code',

  // Markup
  '.html': 'file-code',
  '.xml': 'file-code',
  '.svg': 'image',

  // Styles
  '.css': 'file-code',
  '.scss': 'file-code',
  '.sass': 'file-code',
  '.less': 'file-code',

  // Data
  '.json': 'braces',
  '.yaml': 'file-text',
  '.yml': 'file-text',
  '.toml': 'file-text',

  // Documentation
  '.md': 'file-text',
  '.txt': 'file-text',

  // Images
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.gif': 'image',
  '.webp': 'image',

  // Media
  '.mp4': 'video',
  '.avi': 'video',
  '.mov': 'video',
  '.mp3': 'music',
  '.wav': 'music',

  // Archives
  '.zip': 'file-archive',
  '.tar': 'file-archive',
  '.gz': 'file-archive',

  // Default
  default: 'file',
}

/**
 * MIME type categories
 */
export const MIME_TYPE_CATEGORIES = {
  text: [
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'text/markdown',
    'text/xml',
    'application/json',
    'application/javascript',
    'application/xml',
  ],
  image: [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  video: [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
  ],
  audio: [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
  ],
}
