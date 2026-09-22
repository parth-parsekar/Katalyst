const { YoutubeTranscript } = require('youtube-transcript');

/**
 * Extractive 2-sentence summarization.
 * Scores sentences by: keyword frequency + position (early sentences rank higher).
 */
function extractiveSummarize(text, numSentences = 2) {
  // Split into sentences
  const sentences = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.split(' ').length >= 5); // skip very short fragments

  if (sentences.length <= numSentences) return sentences.join(' ');

  // Build word frequency map (skip stop words)
  const stopWords = new Set([
    'the','a','an','is','it','in','on','at','to','of','and','or','but','for',
    'with','this','that','was','are','be','as','i','you','we','they','he','she',
    'so','do','did','by','from','up','out','if','about','what','which','have',
    'has','had','will','can','just','been','not','its','all','also','more',
    'like','get','got','very','my','your','our','their','there','when','then',
    'than','into','over','after','before','now','would','could','should',
    'really','make','made','some','how','know','go','going','okay','yeah',
    'um','uh','hey','hi','hello','guys','want','let','see','well','right',
    'actually','basically','kind','sort','think','things','something','anything'
  ]);

  const wordFreq = {};
  sentences.forEach(s => {
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).forEach(w => {
      if (w && !stopWords.has(w)) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    });
  });

  // Score each sentence
  const scored = sentences.map((sentence, idx) => {
    const words = sentence.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    const relevantWords = words.filter(w => w && !stopWords.has(w));
    const freqScore = relevantWords.reduce((sum, w) => sum + (wordFreq[w] || 0), 0) / (relevantWords.length || 1);
    // Slight position boost for early sentences (they often contain the topic)
    const positionBoost = idx === 0 ? 1.3 : idx < 3 ? 1.1 : 1.0;
    return { sentence, score: freqScore * positionBoost, idx };
  });

  // Sort by score, pick top N, then restore original order
  const topSentences = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, numSentences)
    .sort((a, b) => a.idx - b.idx)
    .map(s => s.sentence);

  return topSentences.join(' ');
}

/**
 * Extract YouTube video ID from various URL formats.
 */
function extractVideoId(url) {
  if (!url) return null;
  // youtu.be/<id>
  const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  // youtube.com/watch?v=<id>
  const longMatch = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  // youtube.com/embed/<id>
  const embedMatch = url.match(/embed\/([A-Za-z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return null;
}

/**
 * GET /api/transcript?videoId=<id>
 *    OR
 * GET /api/transcript?url=<youtube-url>
 */
async function getTranscriptSummary(req, res) {
  try {
    let videoId = req.query.videoId;

    // Also allow passing a full URL
    if (!videoId && req.query.url) {
      videoId = extractVideoId(req.query.url);
    }

    if (!videoId) {
      return res.status(400).json({ error: 'Missing videoId or url query parameter' });
    }

    // Fetch transcript
    let transcriptItems;
    try {
      transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (err) {
      // Transcripts may be disabled for some videos
      return res.status(404).json({ error: 'Transcript not available for this video', details: err.message });
    }

    if (!transcriptItems || transcriptItems.length === 0) {
      return res.status(404).json({ error: 'Transcript is empty for this video' });
    }

    // Concatenate all transcript text
    const fullText = transcriptItems.map(t => t.text).join(' ');

    // Extract a 2-sentence summary
    const summary = extractiveSummarize(fullText, 2);

    return res.json({ videoId, summary, transcriptLength: transcriptItems.length });
  } catch (error) {
    console.error('Transcript controller error:', error);
    return res.status(500).json({ error: 'Server error while fetching transcript', details: error.message });
  }
}

module.exports = { getTranscriptSummary };
