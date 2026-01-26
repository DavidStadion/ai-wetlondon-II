// api/reviews.js
// Vercel Serverless Function - User reviews stored in Supabase
//
// Usage:
// GET /api/reviews?venue=British%20Museum - Get reviews for a venue
// POST /api/reviews - Submit a new review { venue, name, rating, text }

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://iguspxisuudvvlcbtaxk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (!supabaseKey) {
    return json(res, 500, { error: 'Supabase not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // GET - Fetch reviews for a venue
    if (req.method === 'GET') {
      const venue = req.query?.venue;
      if (!venue) {
        return json(res, 400, { error: 'Missing venue parameter' });
      }

      const { data, error } = await supabase
        .from('user_reviews')
        .select('*')
        .eq('venue_name', venue)
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Supabase error:', error);
        return json(res, 500, { error: 'Failed to fetch reviews' });
      }

      const reviews = (data || []).map(r => ({
        id: r.id,
        authorName: r.author_name,
        rating: r.rating,
        text: r.review_text,
        createdAt: r.created_at,
        relativeTime: getRelativeTime(r.created_at)
      }));

      return json(res, 200, { reviews });
    }

    // POST - Submit a new review
    if (req.method === 'POST') {
      let body = req.body;

      // Parse body if it's a string
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          return json(res, 400, { error: 'Invalid JSON body' });
        }
      }

      const { venue, name, rating, text } = body || {};

      if (!venue || !name || !rating || !text) {
        return json(res, 400, {
          error: 'Missing required fields',
          required: ['venue', 'name', 'rating', 'text']
        });
      }

      // Validate rating
      const ratingNum = parseFloat(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return json(res, 400, { error: 'Rating must be between 1 and 5' });
      }

      // Validate text length
      if (text.length < 10 || text.length > 1000) {
        return json(res, 400, { error: 'Review must be between 10 and 1000 characters' });
      }

      // Basic spam check - very simple for now
      const spamPatterns = [/http[s]?:\/\//, /<script/i, /viagra/i, /casino/i];
      if (spamPatterns.some(p => p.test(text))) {
        return json(res, 400, { error: 'Review contains prohibited content' });
      }

      const { data, error } = await supabase
        .from('user_reviews')
        .insert([{
          venue_name: venue.trim(),
          author_name: name.trim().substring(0, 50),
          rating: ratingNum,
          review_text: text.trim().substring(0, 1000),
          approved: true, // Auto-approve for now, can add moderation later
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        return json(res, 500, { error: 'Failed to submit review' });
      }

      return json(res, 201, {
        success: true,
        message: 'Review submitted successfully',
        review: data?.[0]
      });
    }

    return json(res, 405, { error: 'Method not allowed' });

  } catch (e) {
    console.error('Reviews API error:', e);
    return json(res, 500, { error: 'Internal server error' });
  }
}

function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
