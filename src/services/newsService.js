/**
 * News Service - Business logic for news operations
 * @module newsService
 */

const News = require('../../models/News');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Create a new news article
 * @param {Object} data - News data
 * @param {string} data.title - News title
 * @param {string} data.content - News content
 * @param {string} [data.imageUrl] - Optional image URL
 * @returns {Promise<Object>} Created news object
 */
const createNews = async ({ title, content, imageUrl }) => {
  const news = new News({ title, content, imageUrl });
  await news.save();
  return news;
};

/**
 * Get all news articles sorted by date
 * @returns {Promise<Array>} Array of formatted news objects
 */
const getAllNews = async () => {
  const news = await News.find().sort({ createdAt: -1 });
  return news.map(item => ({
    id: item._id.toString(),
    title: item.title,
    content: item.content,
    imageUrl: item.imageUrl,
    date: item.createdAt
  }));
};

/**
 * Get a single news article by ID
 * @param {string} id - News ID
 * @returns {Promise<Object>} Formatted news object
 * @throws {ApiError} If news not found
 */
const getNewsById = async (id) => {
  const news = await News.findById(id);
  if (!news) {
    throw new ApiError(404, 'News not found');
  }
  return {
    id: news._id.toString(),
    title: news.title,
    content: news.content,
    imageUrl: news.imageUrl,
    date: news.createdAt
  };
};

/**
 * Update a news article
 * @param {string} id - News ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated news object
 * @throws {ApiError} If news not found
 */
const updateNews = async (id, { title, content, imageUrl }) => {
  const news = await News.findByIdAndUpdate(
    id,
    { title, content, imageUrl },
    { new: true, runValidators: true }
  );
  if (!news) {
    throw new ApiError(404, 'News not found');
  }
  return news;
};

/**
 * Delete a news article
 * @param {string} id - News ID
 * @returns {Promise<void>}
 * @throws {ApiError} If news not found
 */
const deleteNews = async (id) => {
  const news = await News.findByIdAndDelete(id);
  if (!news) {
    throw new ApiError(404, 'News not found');
  }
};

module.exports = {
  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews
};
