# Setup Instructions

This document provides step-by-step instructions to set up and run the Claude Project Manager application.

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- Supabase account (for database and authentication)
- Anthropic API key (for Claude AI integration)

## 1. Environment Setup

### 1.1 Clone and Install Dependencies

```bash
# Install dependencies
npm install
```

### 1.2 Configure Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Anthropic API Configuration
ANTHROPIC_API_KEY=sk-ant-api03-your-anthropic-api-key-here

# Project Configuration
PROJECT_ROOT_PATH=/absolute/path/to/your/project

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
DEBUG=false
```

## 2. Supabase Setup

### 2.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Wait for the project to be provisioned

### 2.2 Get Your Supabase Credentials

1. Go to Project Settings > API
2. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon/Public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2.3 Run Database Migrations

Option 1: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

Option 2: Manual Setup

1. Go to your Supabase project's SQL Editor
2. Run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_token_usage.sql`
   - `supabase/migrations/004_conversations.sql`

### 2.4 Enable Authentication Providers

1. Go to Authentication > Providers in Supabase Dashboard
2. Enable Email provider
3. Configure email templates if needed
4. (Optional) Enable other providers like Google, GitHub, etc.

## 3. Anthropic API Setup

### 3.1 Get Your Anthropic API Key

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Go to API Keys
4. Create a new API key
5. Copy the key and add it to your `.env.local` as `ANTHROPIC_API_KEY`

## 4. Running the Application

### 4.1 Development Mode

```bash
# Start the development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 4.2 Production Build

```bash
# Build the application
npm run build

# Start the production server
npm start
```

### 4.3 Type Checking

```bash
# Run TypeScript type checking
npm run type-check
```

### 4.4 Code Formatting

```bash
# Format code with Prettier
npm run format
```

### 4.5 Linting

```bash
# Run ESLint
npm run lint
```

## 5. Project Structure

```
ai-buddy/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── (auth)/       # Authentication pages
│   │   ├── (dashboard)/  # Dashboard pages
│   │   └── api/          # API routes
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Library code
│   │   ├── auth/         # Authentication logic
│   │   ├── claude/       # Claude AI integration
│   │   ├── filesystem/   # File system operations
│   │   └── supabase/     # Supabase client
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── supabase/
│   └── migrations/       # Database migrations
├── public/               # Static assets
└── .env.local            # Environment variables (create this)
```

## 6. Database Schema

The application uses the following main tables:

- **profiles** - User profiles
- **projects** - User projects
- **conversations** - Chat conversations
- **messages** - Chat messages
- **tasks** - Project tasks
- **task_executions** - Task execution history
- **token_usage** - API usage tracking
- **chat_messages** - Legacy chat messages

See `DATABASE_SCHEMA.md` for detailed schema information.

## 7. Features

- 🔐 **Authentication** - Email/password authentication with Supabase
- 💬 **AI Chat** - Claude-powered chat interface
- 📁 **Project Management** - Create and manage coding projects
- ✅ **Task Management** - Track project tasks and execution
- 📊 **Usage Tracking** - Monitor API token usage and costs
- 🎨 **Modern UI** - Built with Tailwind CSS and shadcn/ui components
- 🔒 **Secure** - Row Level Security (RLS) policies for data protection

## 8. Troubleshooting

### Build Errors

If you encounter TypeScript or linting errors:

```bash
# Type check
npm run type-check

# Build without linting (if needed)
npm run build -- --no-lint
```

### Supabase Connection Issues

1. Verify your `.env.local` file has correct credentials
2. Check that your Supabase project is active
3. Ensure migrations have been run successfully
4. Check Supabase logs in the dashboard

### API Rate Limits

- Monitor your Anthropic API usage in the console
- Check the `token_usage` table for usage statistics
- Adjust `max_tokens` in prompts if needed

## 9. Next Steps

1. Create your first project
2. Start a conversation with Claude
3. Explore the file system integration
4. Set up task management for your project
5. Review the documentation in the `/docs` directory

## 10. Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

## Support

For issues, questions, or contributions, please refer to the project's GitHub repository or contact the maintainers.
