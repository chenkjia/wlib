import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register the alias loader
register('./alias-loader.js', pathToFileURL('./'));