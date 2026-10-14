# One Hat

One Hat is a modern web application built with the T3 Stack, featuring video processing capabilities, authentication, and a dashboard interface for doctors and administrators.

## 🚀 Features

- 🔐 Authentication system with NextAuth.js
- 👥 Role-based access (Admin and Doctor portals)
- 🎥 Video processing integration with HeyGen
- 💬 Real-time messaging capabilities
- 📊 Interactive dashboard
- 🔒 Protected routes
- 🎨 Modern UI with Tailwind CSS

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org)
- **Database**: [Prisma](https://prisma.io) with PostgreSQL
- **API**: [tRPC](https://trpc.io) for type-safe APIs
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **State Management**: [TanStack Query](https://tanstack.com/query)
- **UI Components**: [Framer Motion](https://www.framer.com/motion/)
- **Video Processing**: HeyGen Integration
- **Rate Limiting**: Upstash Redis

## 🚦 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sudharsan-do/one-hat-2.git
   cd one-hat-2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Fill in the required environment variables

4. **Set up the database**
   ```bash
   npm run db:generate   # Generate Prisma client
   npm run db:migrate    # Run migrations
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format:write` - Format code with Prettier
- `npm run typecheck` - Run TypeScript type checking
- `npm run db:studio` - Open Prisma Studio
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client

## 🏗 Project Structure

```
src/
├── app/              # Next.js app router components
├── lib/             # Utility functions and types
├── server/          # Server-side code and API routes
├── styles/          # Global styles
└── trpc/            # tRPC setup and configuration
```

## 🔐 Authentication

The application uses NextAuth.js for authentication with support for multiple providers. Protected routes are implemented using the `protected-route.tsx` component.

## 👥 Role-Based Access

- **Admin Portal**: Manage users, handle video uploads, and system configuration
- **Doctor Portal**: Access to patient information and video management

## 📦 Database Management

The project uses Prisma as the ORM with PostgreSQL. Database migrations are handled through Prisma Migrate.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
