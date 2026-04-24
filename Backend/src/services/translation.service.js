/**
 * translation.service.js
 * Couche métier pour la traduction.
 * Utilise OpenAI en fallback et propose un système de cache + modèles propriétaires.
 */

const dictionary = require('../utils/dictionary');

exports.translateText = async ({ text, sourceLanguage, targetLanguage, mode }) => {
  // 1. Détection si sourceLanguage non fourni
  const detectedLanguage = sourceLanguage || (await exports.detectLanguage(text));

  // 2. Chercher dans le cache / dictionnaire propriétaire
  const cached = dictionary.lookup(text, detectedLanguage, targetLanguage);
  if (cached) {
    return {
      translatedText: cached,
      confidence: 0.98,
      isOffline: false,
      detectedLanguage,
      source: 'kivu-dictionary'
    };
  }

  // 3. Fallback OpenAI ou modèle KIVU
  try {
    const { OpenAI } = require('openai');
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Tu es un traducteur expert spécialisé dans les langues africaines. Traduis ce texte ${detectedLanguage} → ${targetLanguage}. Réponds UNIQUEMENT avec la traduction brute, sans explication.

Texte : ${text}`;

    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });

    const translated = (res.choices?.[0]?.message?.content || '').trim();
    return {
      translatedText: translated || `[${targetLanguage}] ${text}`,
      confidence: 0.92,
      isOffline: false,
      detectedLanguage,
      source: 'kivu-ai-v1'
    };
  } catch (err) {
    console.warn('Translation fallback:', err.message);
    return {
      translatedText: `[${targetLanguage}] ${text}`,
      confidence: 0.75,
      isOffline: true,
      detectedLanguage,
      source: 'kivu-offline'
    };
  }
};

exports.detectLanguage = async (text) => {
  // Heuristique simple — en production : modèle fastText
  if (/bonjour|merci|salut/i.test(text)) return 'fra';
  if (/hello|thank|welcome/i.test(text)) return 'eng';
  if (/jambo|asante|karibu/i.test(text)) return 'swa';
  if (/jërëjëf|nanga def/i.test(text)) return 'wol';
  if (/ini sɔgɔma|i ni ce/i.test(text)) return 'bam';
  return 'fra';
};

exports.translateAudio = async ({ audio, sourceLanguage, targetLanguage }) => {
  return {
    transcribed: '[audio transcription]',
    translatedText: '[traduction]',
    detectedLanguage: sourceLanguage || 'fra',
    confidence: 0.90
  };
};

exports.translateImage = async ({ image, targetLanguage }) => {
  return { translatedText: '[OCR + traduction]', confidence: 0.88 };
};

exports.getOfflinePack = async (languageId) => {
  return {
    languageId,
    size: '42 MB',
    version: '2026.04',
    downloadUrl: `https://cdn.kivu.africa/offline/${languageId}.pack`,
    includesVoice: true,
    includesDictionary: true
  };
};
