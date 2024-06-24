# Setup Guide for NestJS Project

## 1. Clone the Repository
Clone the NestJS project repository from GitHub:

```bash
git clone https://github.com/oleetech/scsapi.git

2. Navigate into the Cloned Directory
```bash
cd scsapi
```

3. Install Dependencies
```bash
npm install
```

4. Install Prisma CLI
```bash
npm install -g @prisma/cli
```

5. Generate Prisma Client
```bash
npx prisma generate
```

6.1. Create Migration
```bash
npx prisma migrate dev --name initial_migration
```
6.2. Apply Migration
```bash
npx prisma migrate deploy
```
