# Pingbase Project

This is the Pingbase project.

---

## Project Preview

Here’s a preview of the project:

<p align="center">
  <img src="images/img1.png" alt="Screenshot 1" width="250" />
  <img src="images/img2.png" alt="Screenshot 2" width="250" />
  <img src="images/img3.png" alt="Screenshot 3" width="250" />
</p>

<p align="center">
  <img src="images/img4.png" alt="Screenshot 4" width="250" />
  <img src="images/img5.png" alt="Screenshot 5" width="250" />
  <img src="images/img6.png" alt="Screenshot 6" width="250" />
</p>

<p align="center">
  <img src="images/img7.png" alt="Screenshot 7" width="250" />
</p>

---

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Install Dependencies

```bash
# Install dependencies for the entire project
npm install
# or
yarn install
# or
pnpm install

# Starts both frontend and backend
npm run dev
# or
yarn dev
# or
pnpm dev

# Run Background Jobs (Scheduler & Worker)
cd apps/apis
npm run scheduler
# or
yarn scheduler
# or
pnpm scheduler

cd apps/apis
npm run worker
# or
yarn worker
# or
pnpm worker


