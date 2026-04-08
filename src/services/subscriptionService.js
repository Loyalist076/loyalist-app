/**
 * Subscription Service - Business logic for newsletter subscriptions
 * @module subscriptionService
 */

const mailchimp = require('@mailchimp/mailchimp_marketing');
const { config } = require('../config');
const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');

// Configure Mailchimp
if (config.mailchimp.apiKey) {
  mailchimp.setConfig({
    apiKey: config.mailchimp.apiKey,
    server: config.mailchimp.serverPrefix
  });
}

/**
 * Subscribe an email to the newsletter
 * @param {string} email - Email address to subscribe
 * @param {string} [source='website'] - Subscription source
 * @returns {Promise<Object>} Subscription result
 * @throws {ApiError} If subscription fails
 */
const subscribe = async (email, source = 'website') => {
  if (!config.mailchimp.apiKey) {
    throw new ApiError(500, 'Mailchimp not configured');
  }

  try {
    const response = await mailchimp.lists.addListMember(config.mailchimp.audienceId, {
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        SOURCE: source
      }
    });

    logger.info(`New subscriber: ${email} from ${source}`);
    return { success: true, message: 'Successfully subscribed!' };
  } catch (error) {
    // Handle already subscribed
    if (error.response?.body?.title === 'Member Exists') {
      return { success: true, message: 'You are already subscribed!' };
    }

    // Handle invalid email
    if (error.response?.body?.detail?.includes('looks fake or invalid')) {
      throw new ApiError(400, 'Email address appears to be invalid');
    }

    logger.error('Mailchimp subscription error:', error.response?.body || error.message);
    throw new ApiError(500, 'Failed to subscribe. Please try again.');
  }
};

/**
 * Unsubscribe an email from the newsletter
 * @param {string} email - Email address to unsubscribe
 * @returns {Promise<Object>} Unsubscription result
 */
const unsubscribe = async (email) => {
  if (!config.mailchimp.apiKey) {
    throw new ApiError(500, 'Mailchimp not configured');
  }

  try {
    const subscriberHash = require('crypto')
      .createHash('md5')
      .update(email.toLowerCase())
      .digest('hex');

    await mailchimp.lists.updateListMember(
      config.mailchimp.audienceId,
      subscriberHash,
      { status: 'unsubscribed' }
    );

    logger.info(`Unsubscribed: ${email}`);
    return { success: true, message: 'Successfully unsubscribed' };
  } catch (error) {
    logger.error('Mailchimp unsubscribe error:', error.response?.body || error.message);
    throw new ApiError(500, 'Failed to unsubscribe');
  }
};

module.exports = {
  subscribe,
  unsubscribe
};
