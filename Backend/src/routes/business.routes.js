const express = require('express');
const router = express.Router();

router.get('/services', (req, res) => {
  res.json([
    { id: 'negotiation', name: 'Négociation en direct', price: '5% par transaction' },
    { id: 'contracts', name: 'Contrats traduits', price: '25 000 FCFA/contrat' },
    { id: 'support', name: 'Service client multilingue', price: 'Sur devis' },
    { id: 'marketing', name: 'Marketing localisé', price: '100 000 FCFA/campagne' }
  ]);
});

router.get('/marketplace', (req, res) => {
  res.json([
    { id: 'p1', name: 'Cacao bio', seller: 'Aminata (🇨🇮)', price: 2500, unit: 'kg' },
    { id: 'p2', name: 'Tissu Kente', seller: 'Kofi (🇬🇭)', price: 15000, unit: 'pièce' },
    { id: 'p3', name: 'Café éthiopien', seller: 'Dawit (🇪🇹)', price: 8000, unit: 'kg' }
  ]);
});

router.post('/contracts', (req, res) => {
  res.status(201).json({ id: `c${Date.now()}`, status: 'draft', ...req.body });
});

module.exports = router;
