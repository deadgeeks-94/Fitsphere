# FitSphere

FitSphere is a mobile-first fitness and wellness companion.

## Live application

https://fitsphere-togez8.v2.appdeploy.ai/

## Features

- Secure account sign-in
- Workout library: Strength, Cardio, Mobility and Recovery
- Workout completion and personal activity history
- Custom activity logging and weekly summaries
- Responsive interface and installable PWA shell

## Architecture

The frontend imports `@appdeploy/client`; the API in `backend/index.ts` uses `@appdeploy/sdk`.
Authentication and the private activity API depend on the AppDeploy runtime. This repository is the source mirror; it is not a standalone GitHub Pages deployment. Keep the AppDeploy deployment active for working sign-in and saved activity records.

## Development

Built with React, TypeScript and Vite. Build with `npm run build` in an environment that provides the AppDeploy client package and runtime configuration.
