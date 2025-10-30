import kaplay from 'kaplay'
import { crew } from '@kaplayjs/crew'

export { kaplay, crew }

// npx esbuild --bundle modules/esbuild.js --outfile=modules/imports.js --format=esm