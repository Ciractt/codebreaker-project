-- ============================================================================
-- Migration 0006: Taco Bell product photography
--
-- Paths only. The images themselves are in /public/offers and gitignored, like
-- the fonts and the bell — they are Taco Bell's assets and this repo is public.
-- ============================================================================

update locations set offer_image_url = '/offers/baja-blast.jpg'
  where offer_title ilike '%baja%';

update locations set offer_image_url = '/offers/crunchy-taco.jpg'
  where offer_title ilike '%crunchy taco%';

update locations set offer_image_url = '/offers/cinnamon-twists.jpg'
  where offer_title ilike '%cinnamon%';

update locations set offer_image_url = '/offers/churros.jpg'
  where offer_title ilike '%churro%';
