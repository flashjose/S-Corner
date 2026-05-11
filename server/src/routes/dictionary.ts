import { Router } from 'express';
import axios from 'axios';

export const dictionaryRouter = Router();

// GET /api/dictionary/:word - Look up word definition
dictionaryRouter.get('/:word', async (req, res) => {
  try {
    const word = req.params.word.toLowerCase().trim();

    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { timeout: 5000 }
    );

    const data = response.data[0];

    const result = {
      word: data.word,
      phonetic: data.phonetic || data.phonetics?.find((p: any) => p.text)?.text || '',
      meanings: data.meanings.map((m: any) => ({
        partOfSpeech: m.partOfSpeech,
        definitions: m.definitions.slice(0, 3).map((d: any) => ({
          definition: d.definition,
          example: d.example,
          synonyms: d.synonyms?.slice(0, 3) || [],
        })),
      })),
    };

    res.json(result);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return res.json({
        word: req.params.word,
        phonetic: '',
        meanings: [],
        message: 'Word not found in dictionary',
      });
    }
    res.status(500).json({ error: 'Dictionary lookup failed' });
  }
});
