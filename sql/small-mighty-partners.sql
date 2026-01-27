-- Small & Mighty Partners Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS small_mighty_partners (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,                    -- workshops, cooking, pottery, crafts, art, wellbeing, other
  location TEXT NOT NULL,                -- central, north, south, east, west
  description TEXT,
  price NUMERIC DEFAULT 0,
  price_display TEXT,                    -- e.g., "From £45", "FREE"
  website_url TEXT,
  affiliate_link TEXT,
  image_filename TEXT,                   -- e.g., "bread-ahead.jpg" stored in /assets/smallandmighty/
  featured BOOLEAN DEFAULT false,        -- show on homepage (max 3)
  active BOOLEAN DEFAULT true,           -- soft delete / hide
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_small_mighty_featured ON small_mighty_partners(featured) WHERE featured = true AND active = true;
CREATE INDEX IF NOT EXISTS idx_small_mighty_location ON small_mighty_partners(location) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_small_mighty_type ON small_mighty_partners(type) WHERE active = true;

-- Enable Row Level Security
ALTER TABLE small_mighty_partners ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active partners
CREATE POLICY "Public read access for active partners" ON small_mighty_partners
  FOR SELECT USING (active = true);

-- Policy: Authenticated users (admins) can do everything
CREATE POLICY "Admin full access" ON small_mighty_partners
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample partners (optional - remove if adding via admin panel)
INSERT INTO small_mighty_partners (name, type, location, description, price, price_display, website_url, image_filename, featured, active)
VALUES
('Bread Ahead Bakery School', 'cooking', 'south', 'Learn to bake artisan breads and pastries in Borough Market. Small group classes with expert bakers.', 75, 'From £75', 'https://www.breadahead.com', 'bread-ahead.jpg', true, true),
('Turning Earth', 'pottery', 'east', 'Drop-in pottery studio with wheel throwing and hand-building classes. Perfect for beginners and experienced potters.', 45, 'From £45', 'https://www.turningearth.uk', 'turning-earth.jpg', true, true),
('The Goodlife Centre', 'workshops', 'south', 'Upholstery, woodwork, and craft workshops in a stunning Victorian building in Waterloo.', 55, 'From £55', 'https://www.thegoodlifecentre.co.uk', 'goodlife-centre.jpg', true, true),
('Token Studio', 'crafts', 'north', 'Jewellery making workshops. Create your own silver rings, bracelets, and pendants in Angel.', 65, 'From £65', 'https://www.tokenstudio.co.uk', 'token-studio.jpg', false, true),
('The Cheese Bar', 'cooking', 'central', 'Cheese tasting and pairing workshops featuring the best British artisan cheeses.', 40, 'From £40', 'https://www.thecheesebar.com', 'cheese-bar.jpg', false, true),
('Kiln Rooms', 'pottery', 'south', 'Ceramic workshops for beginners in Peckham. Wheel throwing, hand building, and glazing.', 50, 'From £50', 'https://www.kilnrooms.com', 'kiln-rooms.jpg', false, true),
('Hot Mess Kitchen', 'cooking', 'east', 'Relaxed cooking classes with wine in Hackney. Italian, Thai, and seasonal menus.', 55, 'From £55', 'https://www.hotmesskitchen.co.uk', 'hot-mess.jpg', false, true),
('Life Drawing Classes', 'art', 'central', 'Drop-in life drawing sessions across London. All materials provided, all levels welcome.', 20, 'From £20', 'https://www.lifedrawing.co.uk', 'life-drawing.jpg', false, true);
