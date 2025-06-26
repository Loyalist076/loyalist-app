const express = require('express');
const router = express.Router();
const News = require('../models/News');

// CREATE news
router.post('/', async (req, res) => {
  try {
    const { title, content, imageUrl } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const news = new News({ title, content, imageUrl });
    await news.save();

    res.status(201).json({ message: 'News created successfully', news });
  } catch (err) {
    res.status(500).json({ message: 'Error creating news', error: err.message });
  }
});

// READ all news (latest first)
router.get('/', async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching news', error: err.message });
  }
});

// UPDATE news by ID
router.put('/:id', async (req, res) => {
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
    res.status(500).json({ message: 'Error updating news', error: err.message });
  }
});

// DELETE news by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedNews = await News.findByIdAndDelete(req.params.id);

    if (!deletedNews) {
      return res.status(404).json({ message: 'News not found' });
    }

    res.json({ message: 'News deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting news', error: err.message });
  }
});

module.exports = router;
