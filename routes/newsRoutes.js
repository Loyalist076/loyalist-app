const express = require('express');
const router = express.Router();
const News = require('../models/News');
const { authenticate, isAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// CREATE news (admin only)
router.post('/', authenticate, isAdmin, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('imageUrl').optional().isURL().withMessage('Image URL must be valid')
], async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  try {
    const { title, content, imageUrl } = req.body;

    const news = new News({ title, content, imageUrl });
    await news.save();

    res.status(201).json({ message: 'News created successfully', news });
  } catch (err) {
    console.error('Error creating news:', err);
    res.status(500).json({ message: 'Error creating news' });
  }
});

// READ all news (latest first) — ✅ returns id instead of _id
router.get('/', async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });

    const formatted = news.map(item => ({
      id: item._id.toString(),
      title: item.title,
      content: item.content,
      imageUrl: item.imageUrl,
      date: item.createdAt
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).json({ message: 'Error fetching news' });
  }
});

// READ single news by ID — ✅ required for news-detail.html
router.get('/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    res.json({
      id: news._id.toString(),
      title: news.title,
      content: news.content,
      imageUrl: news.imageUrl,
      date: news.createdAt
    });
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).json({ message: 'Error fetching news' });
  }
});

// UPDATE news by ID (admin only)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { title, content, imageUrl } = req.body;

    const updatedNews = await News.findByIdAndUpdate(
      req.params.id,
      { title, content, imageUrl },
      { new: true, runValidators: true }
    );

    if (!updatedNews) {
      return res.status(404).json({ message: 'News not found' });
    }

    res.json({ message: 'News updated successfully', news: updatedNews });
  } catch (err) {
    console.error('Error updating news:', err);
    res.status(500).json({ message: 'Error updating news' });
  }
});

// DELETE news by ID (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const deletedNews = await News.findByIdAndDelete(req.params.id);

    if (!deletedNews) {
      return res.status(404).json({ message: 'News not found' });
    }

    res.json({ message: 'News deleted successfully' });
  } catch (err) {
    console.error('Error deleting news:', err);
    res.status(500).json({ message: 'Error deleting news' });
  }
});

module.exports = router;
