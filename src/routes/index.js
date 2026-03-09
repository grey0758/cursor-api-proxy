const express = require('express');
const router = express.Router();
const v1Routes = require('./v1');
const cursorRoutes = require('./cursor');
const anthropicRoutes = require('./anthropic');

// OpenAI v1 API routes
router.use('/v1', v1Routes);
// Anthropic Messages API routes
router.use('/v1', anthropicRoutes);
router.use('/cursor', cursorRoutes);

module.exports = router;
