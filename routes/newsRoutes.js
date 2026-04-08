/**
 * News Routes - Route definitions only
 * Business logic delegated to newsService
 * @module routes/newsRoutes
 */

const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const asyncWrapper = require('../src/utils/asyncWrapper');
const newsService = require('../src/services/newsService');

/**
 * Validation middleware for news creation/update
 */
const validateNews = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('imageUrl').optional().isURL().withMessage('Image URL must be valid')
];

/**
 * @route POST /api/news
 * @desc Create a new news article
 * @access Admin only
 */
router.post('/', authenticate, isAdmin, validateNews, asyncWrapper(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }

  const news = await newsService.createNews(req.body);
  res.status(201).json({ message: 'News created successfully', news });
}));

/**
 * @route GET /api/news
 * @desc Get all news articles
 * @access Public
 */
router.get('/', asyncWrapper(async (req, res) => {
  const news = await newsService.getAllNews();
  res.json(news);
}));

/**
 * @route GET /api/news/:id
 * @desc Get single news article by ID
 * @access Public
 */
router.get('/:id', asyncWrapper(async (req, res) => {
  const news = await newsService.getNewsById(req.params.id);
  res.json(news);
}));

/**
 * @route PUT /api/news/:id
 * @desc Update a news article
 * @access Admin only
 */
router.put('/:id', authenticate, isAdmin, asyncWrapper(async (req, res) => {
  const news = await newsService.updateNews(req.params.id, req.body);
  res.json({ message: 'News updated successfully', news });
}));

/**
 * @route DELETE /api/news/:id
 * @desc Delete a news article
 * @access Admin only
 */
router.delete('/:id', authenticate, isAdmin, asyncWrapper(async (req, res) => {
  await newsService.deleteNews(req.params.id);
  res.json({ message: 'News deleted successfully' });
}));

module.exports = router;
